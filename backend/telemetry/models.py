import uuid

from django.conf import settings
from django.db import models


class TelemetryClient(models.Model):
    """Anonymous browser client that reports product telemetry."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_id = models.UUIDField(unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="telemetry_clients",
    )
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    device = models.JSONField(default=dict, blank=True)
    games_analyzed = models.PositiveIntegerField(default=0)
    active_ms = models.PositiveBigIntegerField(default=0)
    session_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-last_seen",)

    def __str__(self):
        return f"Client {self.client_id}"


class TelemetrySession(models.Model):
    """One browser session for a telemetry client."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        TelemetryClient,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    session_id = models.UUIDField(db_index=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    active_ms = models.PositiveBigIntegerField(default=0)
    landing_path = models.CharField(max_length=512, blank=True, default="")
    referrer = models.CharField(max_length=1024, blank=True, default="")
    utm = models.JSONField(default=dict, blank=True)
    route_times = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("client", "session_id"),
                name="telemetry_session_client_session_uniq",
            )
        ]
        ordering = ("-started_at",)

    def __str__(self):
        return f"Session {self.session_id}"


class TelemetryEvent(models.Model):
    """Individual product/analytics event from a client."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.UUIDField(unique=True, db_index=True)
    client = models.ForeignKey(
        TelemetryClient,
        on_delete=models.CASCADE,
        related_name="events",
    )
    session = models.ForeignKey(
        TelemetrySession,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    name = models.CharField(max_length=128, db_index=True)
    ts = models.DateTimeField(db_index=True)
    properties = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=("name", "ts"), name="telemetry_event_name_ts"),
        ]
        ordering = ("-ts",)

    def __str__(self):
        return f"{self.name} @ {self.ts}"
