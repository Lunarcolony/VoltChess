"""Tests for the platform sync + hybrid analysis flow."""

from __future__ import annotations

from unittest import mock

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from academies.models import (
    Academy,
    CoachStudentLink,
    PlatformChoice,
    SyncStatus,
)
from games.models import AnalysisStatus, Game, GameEval
from sync.platform_fetch import FetchedGame
from sync.services import (
    StudentPresence,
    sync_coach_student_link,
    upsert_fetched_game,
)

User = get_user_model()

DEMO_PGN = '[Event "Test"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0'


def make_fetched(external_id: str, source: str = "lichess") -> FetchedGame:
    return FetchedGame(
        external_id=external_id,
        external_url=f"https://lichess.org/{external_id}",
        pgn=DEMO_PGN,
        event="Test",
        site="lichess.org",
        date="2026.01.01",
        round="-",
        white={"name": "White", "rating": 2000, "title": None},
        black={"name": "Black", "rating": 1900, "title": None},
        result="1-0",
        termination="Normal",
        time_control="600",
        source=source,
        played_at=None,
    )


class SyncFixtureMixin:
    def setUp(self):
        super().setUp()
        self.coach = User.objects.create_user(
            username="coach", email="coach@x.test", password="pw", role="coach"
        )
        self.student = User.objects.create_user(
            username="student", email="student@x.test", password="pw", role="student"
        )
        self.other = User.objects.create_user(
            username="other", email="other@x.test", password="pw", role="student"
        )
        self.academy = Academy.objects.create(name="Test Academy")
        self.link = CoachStudentLink.objects.create(
            coach=self.coach,
            student=self.student,
            academy=self.academy,
            platform=PlatformChoice.LICHESS,
            platform_username="DrNykterstein",
            sync_enabled=True,
        )


class PresenceTests(SyncFixtureMixin, APITestCase):
    def test_presence_marks_seen_and_online(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(
            "/api/sync/presence/", {"browser_busy": False}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(StudentPresence.is_online(self.student))
        self.assertFalse(StudentPresence.is_browser_busy(self.student))

    def test_presence_busy_flag(self):
        self.client.force_authenticate(self.student)
        self.client.post(
            "/api/sync/presence/", {"browser_busy": True}, format="json"
        )
        self.assertTrue(StudentPresence.is_browser_busy(self.student))


class OverviewTests(SyncFixtureMixin, APITestCase):
    def test_student_overview(self):
        self.client.force_authenticate(self.student)
        res = self.client.get("/api/sync/overview/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["platform_links"]), 1)
        self.assertEqual(res.data["games_total"], 0)

    def test_coach_overview_for_linked_student(self):
        self.client.force_authenticate(self.coach)
        res = self.client.get(
            "/api/sync/overview/", {"student_id": str(self.student.id)}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["platform_links"]), 1)

    def test_coach_overview_for_unlinked_student_forbidden(self):
        self.client.force_authenticate(self.coach)
        res = self.client.get(
            "/api/sync/overview/", {"student_id": str(self.other.id)}
        )
        self.assertEqual(res.status_code, 403)

    def test_coach_overview_missing_student_returns_404(self):
        # Admin path: a missing student id must 404, not 500.
        admin = User.objects.create_user(
            username="admin", email="a@x.test", password="pw", role="admin"
        )
        self.client.force_authenticate(admin)
        res = self.client.get(
            "/api/sync/overview/",
            {"student_id": "00000000-0000-0000-0000-000000000000"},
        )
        self.assertEqual(res.status_code, 404)


class ClaimCompleteTests(SyncFixtureMixin, APITestCase):
    def _make_pending_game(self, owner=None):
        return Game.objects.create(
            owner=owner or self.student,
            pgn=DEMO_PGN,
            source="lichess",
            external_id="abc123",
            white={"name": "White", "rating": 2000},
            black={"name": "Black", "rating": 1900},
            analysis_status=AnalysisStatus.PENDING,
        )

    def test_claim_missing_game_returns_404(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(
            "/api/sync/games/00000000-0000-0000-0000-000000000000/claim/"
        )
        self.assertEqual(res.status_code, 404)

    def test_complete_missing_game_returns_404(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(
            "/api/sync/games/00000000-0000-0000-0000-000000000000/complete/",
            {"positions": [], "accuracy": {}, "settings": {}},
            format="json",
        )
        self.assertEqual(res.status_code, 404)

    def test_claim_then_complete_flow(self):
        game = self._make_pending_game()
        self.client.force_authenticate(self.student)

        claim = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(claim.status_code, 200)
        game.refresh_from_db()
        self.assertEqual(game.analysis_status, AnalysisStatus.IN_PROGRESS)
        self.assertEqual(game.analysis_source, "browser")

        complete = self.client.post(
            f"/api/sync/games/{game.id}/complete/",
            {
                "positions": [{"fen": "x"}],
                "accuracy": {"white": 90, "black": 85},
                "settings": {"depth": 16},
            },
            format="json",
        )
        self.assertEqual(complete.status_code, 200)
        game.refresh_from_db()
        self.assertEqual(game.analysis_status, AnalysisStatus.COMPLETE)
        self.assertTrue(hasattr(game, "eval"))

    def test_claim_other_users_game_forbidden(self):
        game = self._make_pending_game(owner=self.other)
        self.client.force_authenticate(self.student)
        res = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(res.status_code, 403)

    def test_double_claim_returns_conflict(self):
        game = self._make_pending_game()
        self.client.force_authenticate(self.student)

        first = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(first.status_code, 200)

        # A second claim while the first is still fresh must be rejected so two
        # tabs don't analyze the same game.
        second = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(second.status_code, 409)

    def test_claim_already_analyzed_returns_conflict(self):
        game = self._make_pending_game()
        GameEval.objects.create(
            game=game,
            positions=[{"lines": [{"cp": 0, "depth": 1, "multiPv": 1, "pv": []}]}],
            accuracy={"white": 90, "black": 90},
            settings={},
        )
        self.client.force_authenticate(self.student)
        res = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(res.status_code, 409)

    def test_release_returns_game_to_pending(self):
        game = self._make_pending_game()
        self.client.force_authenticate(self.student)

        self.client.post(f"/api/sync/games/{game.id}/claim/")
        game.refresh_from_db()
        self.assertEqual(game.analysis_status, AnalysisStatus.IN_PROGRESS)

        res = self.client.post(f"/api/sync/games/{game.id}/release/")
        self.assertEqual(res.status_code, 200)
        game.refresh_from_db()
        self.assertEqual(game.analysis_status, AnalysisStatus.PENDING)
        self.assertIsNone(game.analysis_claimed_at)

        # After release it can be claimed again (e.g. retried).
        again = self.client.post(f"/api/sync/games/{game.id}/claim/")
        self.assertEqual(again.status_code, 200)

    def test_release_other_users_game_forbidden(self):
        game = self._make_pending_game(owner=self.other)
        self.client.force_authenticate(self.student)
        res = self.client.post(f"/api/sync/games/{game.id}/release/")
        self.assertEqual(res.status_code, 403)

    def test_pending_analysis_lists_synced_games(self):
        self._make_pending_game()
        self.client.force_authenticate(self.student)
        res = self.client.get("/api/sync/pending-analysis/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)


class SyncServiceTests(SyncFixtureMixin, APITestCase):
    def test_upsert_creates_then_updates(self):
        fetched = make_fetched("game-1")
        game, created = upsert_fetched_game(self.student, fetched)
        self.assertTrue(created)
        self.assertEqual(game.analysis_status, AnalysisStatus.PENDING)

        # Same external id -> update, not duplicate.
        game2, created2 = upsert_fetched_game(self.student, fetched)
        self.assertFalse(created2)
        self.assertEqual(game.pk, game2.pk)
        self.assertEqual(Game.objects.filter(owner=self.student).count(), 1)

    def test_sync_coach_student_link_imports_games(self):
        fetched = [make_fetched("g1"), make_fetched("g2")]
        with mock.patch(
            "sync.services.fetch_platform_games", return_value=fetched
        ) as fetch:
            result = sync_coach_student_link(self.link)
        fetch.assert_called_once()
        self.assertEqual(result["created"], 2)
        self.assertEqual(result["fetched"], 2)
        self.assertEqual(Game.objects.filter(owner=self.student).count(), 2)
        self.link.refresh_from_db()
        self.assertEqual(self.link.sync_status, SyncStatus.IDLE)
        self.assertIsNotNone(self.link.last_sync_at)

    def test_sync_requires_platform_username(self):
        self.link.platform_username = ""
        self.link.save(update_fields=["platform_username"])
        with self.assertRaises(ValueError):
            sync_coach_student_link(self.link)

    def test_trigger_endpoint_for_student(self):
        fetched = [make_fetched("g1")]
        self.client.force_authenticate(self.student)
        with mock.patch("sync.services.fetch_platform_games", return_value=fetched):
            res = self.client.post("/api/sync/trigger/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["results"][0]["created"], 1)
