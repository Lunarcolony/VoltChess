from django.conf import settings
from django.db import models


class StudentSyncPresence(models.Model):
    """Tracks whether a student browser is online for hybrid analysis routing."""

    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sync_presence",
    )
    last_seen_at = models.DateTimeField(null=True, blank=True)
    browser_busy = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Presence: {self.student.username}"
