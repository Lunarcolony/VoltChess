from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("VoltChess", {"fields": ("role",)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("VoltChess", {"fields": ("role", "email")}),
    )
