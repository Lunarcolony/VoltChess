from django.contrib import admin

from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("coach", "student", "status", "due_date", "created_at")
    list_filter = ("status",)
