import uuid

from django.conf import settings
from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

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
