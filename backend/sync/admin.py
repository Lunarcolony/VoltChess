from django.contrib import admin

from .models import StudentSyncPresence


@admin.register(StudentSyncPresence)
class StudentSyncPresenceAdmin(admin.ModelAdmin):
    list_display = ("student", "last_seen_at", "browser_busy", "updated_at")
