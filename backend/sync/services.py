"""Orchestrate platform import and hybrid analysis routing."""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from academies.models import CoachStudentLink, PlatformChoice, SyncStatus
from games.models import AnalysisStatus, Game

from .platform_fetch import SYNC_GAME_LIMIT, fetch_platform_games

User = get_user_model()

PRESENCE_ONLINE_SECONDS = 120
# How long a browser "claim" is trusted before another worker may take the game
# over. Kept short so a tab that is closed mid-analysis doesn't leave a game
# stuck for a long time.
BROWSER_CLAIM_TIMEOUT = timedelta(minutes=4)
SERVER_PENDING_TIMEOUT = timedelta(minutes=3)


class StudentPresence:
    """In-memory-ish presence via DB row (lightweight for Pi)."""

    @staticmethod
    def get_or_create(student):
        from .models import StudentSyncPresence

        obj, _ = StudentSyncPresence.objects.get_or_create(student=student)
        return obj

    @classmethod
    def mark_seen(cls, student, *, browser_busy: bool = False) -> None:
        presence = cls.get_or_create(student)
        presence.last_seen_at = timezone.now()
        presence.browser_busy = browser_busy
        presence.save(update_fields=["last_seen_at", "browser_busy", "updated_at"])

    @classmethod
    def is_online(cls, student) -> bool:
        from .models import StudentSyncPresence

        try:
            presence = StudentSyncPresence.objects.get(student=student)
        except StudentSyncPresence.DoesNotExist:
            return False
        if not presence.last_seen_at:
            return False
        return presence.last_seen_at >= timezone.now() - timedelta(
            seconds=PRESENCE_ONLINE_SECONDS
        )

    @classmethod
    def is_browser_busy(cls, student) -> bool:
        from .models import StudentSyncPresence

        try:
            presence = StudentSyncPresence.objects.get(student=student)
        except StudentSyncPresence.DoesNotExist:
            return False
        return presence.browser_busy and cls.is_online(student)


def upsert_fetched_game(student, fetched) -> tuple[Game, bool]:
    """Insert or update a synced game. Returns (game, created)."""
    defaults = {
        "pgn": fetched.pgn,
        "event": fetched.event,
        "site": fetched.site,
        "date": fetched.date,
        "round": fetched.round,
        "white": fetched.white,
        "black": fetched.black,
        "result": fetched.result,
        "termination": fetched.termination,
        "time_control": fetched.time_control,
        "external_url": fetched.external_url,
        "platform_played_at": fetched.played_at,
    }

    game, created = Game.objects.get_or_create(
        owner=student,
        source=fetched.source,
        external_id=fetched.external_id,
        defaults={
            **defaults,
            "analysis_status": AnalysisStatus.PENDING,
        },
    )

    if not created:
        Game.objects.filter(pk=game.pk).update(**defaults)
        game.refresh_from_db()

    if hasattr(game, "eval"):
        if game.analysis_status != AnalysisStatus.COMPLETE:
            game.analysis_status = AnalysisStatus.COMPLETE
            game.save(update_fields=["analysis_status", "updated_at"])
    elif created:
        game.analysis_status = AnalysisStatus.PENDING
        game.save(update_fields=["analysis_status", "updated_at"])

    return game, created


@transaction.atomic
def sync_coach_student_link(link: CoachStudentLink, limit: int = SYNC_GAME_LIMIT) -> dict:
    if not link.platform or not link.platform_username.strip():
        raise ValueError("Set a platform and username before syncing.")

    if link.platform not in (PlatformChoice.CHESSCOM, PlatformChoice.LICHESS):
        raise ValueError("Platform must be chesscom or lichess.")

    link.sync_status = SyncStatus.SYNCING
    link.sync_error = ""
    link.save(update_fields=["sync_status", "sync_error"])

    try:
        fetched = fetch_platform_games(
            link.platform, link.platform_username.strip(), limit
        )
        created_count = 0
        updated_count = 0
        pending_analysis = 0

        for item in fetched:
            game, created = upsert_fetched_game(link.student, item)
            if created:
                created_count += 1
            else:
                updated_count += 1
            if game.analysis_status == AnalysisStatus.PENDING:
                pending_analysis += 1

        link.last_sync_at = timezone.now()
        link.sync_status = SyncStatus.IDLE
        link.sync_error = ""
        link.save(
            update_fields=["last_sync_at", "sync_status", "sync_error"]
        )

        return {
            "link_id": str(link.id),
            "fetched": len(fetched),
            "created": created_count,
            "updated": updated_count,
            "pending_analysis": pending_analysis,
            "last_sync_at": link.last_sync_at.isoformat(),
        }
    except Exception as exc:
        link.sync_status = SyncStatus.ERROR
        link.sync_error = str(exc)[:500]
        link.save(update_fields=["sync_status", "sync_error"])
        raise


def sync_all_enabled_links_for_student(student) -> list[dict]:
    results = []
    links = CoachStudentLink.objects.filter(
        student=student,
        sync_enabled=True,
    ).exclude(platform="").exclude(platform_username="")

    for link in links:
        try:
            results.append(sync_coach_student_link(link))
        except Exception as exc:
            results.append(
                {
                    "link_id": str(link.id),
                    "error": str(exc),
                }
            )
    return results


def games_pending_browser_analysis(student, limit: int = 5) -> list[Game]:
    """Games the student's browser should analyze when online and idle."""
    if StudentPresence.is_browser_busy(student):
        return []

    now = timezone.now()
    stale_claim = now - BROWSER_CLAIM_TIMEOUT

    qs = (
        Game.objects.filter(
            owner=student,
            analysis_status__in=(
                AnalysisStatus.PENDING,
                AnalysisStatus.IN_PROGRESS,
                # Retry games that previously failed (e.g. transient engine /
                # browser issues) instead of leaving them stuck forever.
                AnalysisStatus.FAILED,
            ),
        )
        .exclude(external_id="")
        .select_related("eval")
        .order_by("-platform_played_at", "-created_at")
    )

    eligible = []
    for game in qs:
        if hasattr(game, "eval"):
            continue
        if game.analysis_claimed_at and game.analysis_claimed_at > stale_claim:
            if game.analysis_source == "server":
                continue
            # Another tab is working on it
            continue
        eligible.append(game)
        if len(eligible) >= limit:
            break
    return eligible


def games_pending_server_analysis(limit: int = 3) -> list[Game]:
    """Games for Pi/server Stockfish when student is offline or browser is busy."""
    now = timezone.now()
    stale_claim = now - BROWSER_CLAIM_TIMEOUT
    server_after = now - SERVER_PENDING_TIMEOUT

    qs = (
        Game.objects.filter(
            analysis_status__in=(
                AnalysisStatus.PENDING,
                AnalysisStatus.IN_PROGRESS,
            ),
        )
        .exclude(external_id="")
        .select_related("owner")
        .order_by("analysis_claimed_at", "-platform_played_at")
    )

    eligible = []
    for game in qs:
        if hasattr(game, "eval"):
            continue

        student = game.owner
        online = StudentPresence.is_online(student)
        busy = StudentPresence.is_browser_busy(student)

        claimed_recently = (
            game.analysis_claimed_at and game.analysis_claimed_at > stale_claim
        )

        if online and not busy and claimed_recently:
            continue

        if online and not busy and game.created_at > server_after:
            # Give the student's browser a few minutes first
            continue

        eligible.append(game)
        if len(eligible) >= limit:
            break
    return eligible


def claim_game_for_browser(game_id, student) -> Game | None:
    """Atomically claim a game for browser-side analysis.

    Returns the claimed game, or None if it can't be claimed (already analyzed,
    or another worker holds a fresh claim). Row-locking prevents two tabs / the
    server queue from analyzing the same game at once.
    """
    now = timezone.now()
    stale_claim = now - BROWSER_CLAIM_TIMEOUT

    with transaction.atomic():
        try:
            game = Game.objects.select_for_update().get(
                pk=game_id, owner=student
            )
        except Game.DoesNotExist:
            return None

        if hasattr(game, "eval"):
            return None

        already_claimed = (
            game.analysis_status == AnalysisStatus.IN_PROGRESS
            and game.analysis_claimed_at is not None
            and game.analysis_claimed_at > stale_claim
        )
        if already_claimed:
            return None

        game.analysis_status = AnalysisStatus.IN_PROGRESS
        game.analysis_source = "browser"
        game.analysis_claimed_at = now
        game.save(
            update_fields=[
                "analysis_status",
                "analysis_source",
                "analysis_claimed_at",
                "updated_at",
            ]
        )
        return game


def release_game_for_retry(game_id, student) -> bool:
    """Return an unfinished, browser-claimed game to PENDING so it can be picked
    up again promptly (used when a browser worker fails or abandons a game)."""
    with transaction.atomic():
        try:
            game = Game.objects.select_for_update().get(
                pk=game_id, owner=student
            )
        except Game.DoesNotExist:
            return False

        if hasattr(game, "eval"):
            return True

        game.analysis_status = AnalysisStatus.PENDING
        game.analysis_claimed_at = None
        game.save(
            update_fields=["analysis_status", "analysis_claimed_at", "updated_at"]
        )
        return True


def mark_analysis_complete(game: Game, source: str) -> None:
    game.analysis_status = AnalysisStatus.COMPLETE
    game.analysis_source = source
    game.analysis_claimed_at = None
    game.save(
        update_fields=[
            "analysis_status",
            "analysis_source",
            "analysis_claimed_at",
            "updated_at",
        ]
    )


def mark_analysis_failed(game: Game) -> None:
    game.analysis_status = AnalysisStatus.FAILED
    game.analysis_claimed_at = None
    game.save(
        update_fields=["analysis_status", "analysis_claimed_at", "updated_at"]
    )


def student_sync_overview(student) -> dict:
    links = CoachStudentLink.objects.filter(student=student).select_related("coach")
    platform_links = []
    for link in links:
        platform_links.append(
            {
                "link_id": str(link.id),
                "coach_username": link.coach.username,
                "platform": link.platform,
                "platform_username": link.platform_username,
                "sync_enabled": link.sync_enabled,
                "last_sync_at": link.last_sync_at.isoformat()
                if link.last_sync_at
                else None,
                "sync_status": link.sync_status,
                "sync_error": link.sync_error,
            }
        )

    # Whether a saved eval (report) exists is the source of truth for
    # "analyzed" — not analysis_status, which can drift (e.g. a tab closed
    # mid-flight). This keeps a game that already has a report from being shown
    # as perpetually "analyzing".
    games = list(Game.objects.filter(owner=student).select_related("eval"))
    analyzed = sum(1 for g in games if hasattr(g, "eval"))
    not_analyzed = [g for g in games if not hasattr(g, "eval")]
    in_progress = sum(
        1 for g in not_analyzed if g.analysis_status == AnalysisStatus.IN_PROGRESS
    )
    failed = sum(
        1 for g in not_analyzed if g.analysis_status == AnalysisStatus.FAILED
    )
    pending = len(not_analyzed) - in_progress - failed

    return {
        "platform_links": platform_links,
        "games_total": len(games),
        "games_analyzed": analyzed,
        "games_pending": pending,
        "games_in_progress": in_progress,
        "games_failed": failed,
        "last_sync_at": max(
            (l.last_sync_at for l in links if l.last_sync_at),
            default=None,
        ),
    }
