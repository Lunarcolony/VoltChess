from django.contrib import admin

from .models import Academy, CoachStudentLink, Membership


@admin.register(Academy)
class AcademyAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "academy", "role", "joined_at")
    list_filter = ("role",)


@admin.register(CoachStudentLink)
class CoachStudentLinkAdmin(admin.ModelAdmin):
    list_display = ("coach", "student", "academy", "created_at")
