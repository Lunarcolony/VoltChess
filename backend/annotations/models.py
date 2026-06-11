import uuid

from django.conf import settings
from django.db import models

from games.models import Game


class Annotation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name="annotations"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annotations",
    )
    move_index = models.PositiveIntegerField()
    fen = models.CharField(max_length=100, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["move_index", "created_at"]

    def __str__(self):
        return f"Annotation on {self.game_id} move {self.move_index}"
