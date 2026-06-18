import uuid

from django.conf import settings
from django.db import models


class TemplateCategory(models.TextChoices):
    OPENING = "opening", "Opening"
    TACTICS = "tactics", "Tactics"
    ENDGAME = "endgame", "Endgame"
    GAME_REVIEW = "game_review", "Game review"
    STRATEGY = "strategy", "Strategy"
    HOMEWORK = "homework", "Homework"


class LessonTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_templates",
    )
    title = models.CharField(max_length=200)
    category = models.CharField(
        max_length=30,
        choices=TemplateCategory.choices,
        default=TemplateCategory.HOMEWORK,
    )
    instructions = models.TextField()
    pgn = models.TextField(blank=True)
    estimated_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_favorite", "-updated_at"]

    def __str__(self):
        return self.title


class CoachMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_sent",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_received",
    )
    subject = models.CharField(max_length=200)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} → {self.student.username}"


class TrainingPlanStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    PAUSED = "paused", "Paused"


class TrainingPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="training_plans_created",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="training_plans",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=TrainingPlanStatus.choices,
        default=TrainingPlanStatus.ACTIVE,
    )
    target_weeks = models.PositiveSmallIntegerField(default=4)
    goals = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.student.username})"
