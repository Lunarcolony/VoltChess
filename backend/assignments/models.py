import uuid

from django.conf import settings
from django.db import models

from games.models import Game


class AssignmentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class AssignmentCategory(models.TextChoices):
    GENERAL = "general", "General"
    OPENING = "opening", "Opening"
    TACTICS = "tactics", "Tactics"
    ENDGAME = "endgame", "Endgame"
    GAME_REVIEW = "game_review", "Game review"
    HOMEWORK = "homework", "Homework"


class AssignmentPriority(models.TextChoices):
    LOW = "low", "Low"
    NORMAL = "normal", "Normal"
    HIGH = "high", "High"


class Assignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments_created",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments_received",
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
    )
    title = models.CharField(max_length=200, blank=True)
    pgn = models.TextField(blank=True)
    instructions = models.TextField()
    category = models.CharField(
        max_length=30,
        choices=AssignmentCategory.choices,
        default=AssignmentCategory.GENERAL,
    )
    priority = models.CharField(
        max_length=10,
        choices=AssignmentPriority.choices,
        default=AssignmentPriority.NORMAL,
    )
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.coach.username} → {self.student.username}: {self.status}"
