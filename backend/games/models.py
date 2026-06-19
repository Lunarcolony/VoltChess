import uuid

from django.conf import settings
from django.db import models


class AnalysisStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In progress"
    COMPLETE = "complete", "Complete"
    FAILED = "failed", "Failed"


class AnalysisSource(models.TextChoices):
    BROWSER = "browser", "Browser"
    SERVER = "server", "Server"


class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="games",
    )
    pgn = models.TextField()
    event = models.CharField(max_length=200, blank=True)
    site = models.CharField(max_length=200, blank=True)
    date = models.CharField(max_length=50, blank=True)
    round = models.CharField(max_length=50, blank=True)
    white = models.JSONField(default=dict)
    black = models.JSONField(default=dict)
    result = models.CharField(max_length=20, blank=True)
    termination = models.CharField(max_length=100, blank=True)
    time_control = models.CharField(max_length=50, blank=True)
    source = models.CharField(max_length=50, blank=True, default="upload")
    external_id = models.CharField(max_length=200, blank=True, db_index=True)
    external_url = models.URLField(max_length=500, blank=True)
    analysis_status = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.COMPLETE,
    )
    analysis_source = models.CharField(
        max_length=20,
        choices=AnalysisSource.choices,
        blank=True,
    )
    analysis_claimed_at = models.DateTimeField(null=True, blank=True)
    platform_played_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "source", "external_id"],
                condition=models.Q(external_id__gt=""),
                name="unique_game_external_id_per_owner",
            )
        ]

    def __str__(self):
        white_name = self.white.get("name", "?")
        black_name = self.black.get("name", "?")
        return f"{white_name} vs {black_name}"


class GameEval(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.OneToOneField(
        Game, on_delete=models.CASCADE, related_name="eval"
    )
    positions = models.JSONField(default=list)
    accuracy = models.JSONField(default=dict)
    estimated_elo = models.JSONField(null=True, blank=True)
    settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Eval for {self.game_id}"
