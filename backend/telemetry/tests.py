"""Tests for anonymous telemetry ingest and admin stats."""

import uuid

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from telemetry.models import TelemetryClient, TelemetryEvent

User = get_user_model()


class TelemetryIngestTests(APITestCase):
    def setUp(self):
        self.url = reverse("telemetry-ingest")
        self.client_id = str(uuid.uuid4())
        self.session_id = str(uuid.uuid4())

    def _payload(self, events=None, **extra):
        body = {
            "client_id": self.client_id,
            "device": {
                "userAgent": "test-agent",
                "language": "en-US",
                "timezone": "UTC",
            },
            "session": {
                "session_id": self.session_id,
                "started_at": "2026-08-01T12:00:00Z",
                "active_ms": 5000,
                "landing_path": "/",
                "referrer": "https://example.com",
                "utm": {"utm_source": "test"},
                "route_times": {"/": 4000, "/analysis": 1000},
            },
            "aggregates": {
                "games_analyzed_total": 1,
                "active_ms_total": 5000,
                "sessions_total": 1,
            },
            "events": events
            or [
                {
                    "event_id": str(uuid.uuid4()),
                    "name": "game_analyzed",
                    "ts": "2026-08-01T12:01:00Z",
                    "properties": {
                        "engine": "Stockfish 17",
                        "depth": 16,
                        "source": "pgn",
                        "durationMs": 12000,
                        "nbPositions": 40,
                    },
                }
            ],
        }
        body.update(extra)
        return body

    def test_ingest_allow_any_creates_client_and_event(self):
        res = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["accepted"], 1)
        client = TelemetryClient.objects.get(client_id=self.client_id)
        self.assertEqual(client.games_analyzed, 1)
        self.assertEqual(client.session_count, 1)
        self.assertEqual(TelemetryEvent.objects.count(), 1)

    def test_duplicate_event_id_ignored(self):
        event_id = str(uuid.uuid4())
        payload = self._payload(
            events=[
                {
                    "event_id": event_id,
                    "name": "game_analyzed",
                    "ts": "2026-08-01T12:01:00Z",
                    "properties": {"engine": "Stockfish 17"},
                }
            ]
        )
        first = self.client.post(self.url, payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        second = self.client.post(self.url, payload, format="json")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(TelemetryEvent.objects.count(), 1)
        client = TelemetryClient.objects.get(client_id=self.client_id)
        # First ingest bumps; second duplicate should not double-count via events,
        # but aggregates.games_analyzed_total=1 keeps it at 1.
        self.assertEqual(client.games_analyzed, 1)


class TelemetryAdminStatsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="pw",
            role=User.UserRole.ADMIN,
        )
        self.student = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="pw",
            role=User.UserRole.STUDENT,
        )
        self.stats_url = reverse("telemetry-stats")
        self.events_url = reverse("telemetry-events")
        self.ingest_url = reverse("telemetry-ingest")

    def _auth(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_stats_forbidden_for_non_admin(self):
        self._auth(self.student)
        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_stats_ok_for_admin(self):
        self.client.post(
            self.ingest_url,
            {
                "client_id": str(uuid.uuid4()),
                "aggregates": {"games_analyzed_total": 3},
                "events": [
                    {
                        "event_id": str(uuid.uuid4()),
                        "name": "game_analyzed",
                        "ts": "2026-08-01T12:00:00Z",
                        "properties": {"engine": "Stockfish 17", "source": "lichess"},
                    }
                ],
            },
            format="json",
        )
        self._auth(self.admin)
        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data["totals"]["games_analyzed"], 1)
        self.assertGreaterEqual(res.data["totals"]["clients"], 1)

        events = self.client.get(self.events_url)
        self.assertEqual(events.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(events.data["total"], 1)
