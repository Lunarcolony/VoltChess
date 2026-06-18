import uuid

from django.conf import settings
from django.db import models


class Academy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "academies"

    def __str__(self):
        return self.name


class MembershipRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    COACH = "coach", "Coach"
    STUDENT = "student", "Student"


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy = models.ForeignKey(
        Academy, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=20, choices=MembershipRole.choices)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("academy", "user")

    def __str__(self):
        return f"{self.user.username} @ {self.academy.name} ({self.role})"


class LinkPriority(models.TextChoices):
    LOW = "low", "Low"
    NORMAL = "normal", "Normal"
    HIGH = "high", "High"


class CoachStudentLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="students_coached",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coaches",
    )
    academy = models.ForeignKey(
        Academy,
        on_delete=models.CASCADE,
        related_name="coach_student_links",
        null=True,
        blank=True,
    )
    coach_notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=LinkPriority.choices,
        default=LinkPriority.NORMAL,
    )
    target_accuracy = models.FloatField(null=True, blank=True)
    weekly_game_goal = models.PositiveSmallIntegerField(null=True, blank=True)
    pinned = models.BooleanField(default=False)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("coach", "student")

    def __str__(self):
        return f"{self.coach.username} → {self.student.username}"
