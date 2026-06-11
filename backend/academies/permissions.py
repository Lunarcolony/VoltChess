from django.contrib.auth import get_user_model
from rest_framework import permissions

from .models import Membership, MembershipRole

User = get_user_model()


def user_is_academy_admin(user, academy):
    return Membership.objects.filter(
        academy=academy,
        user=user,
        role=MembershipRole.ADMIN,
    ).exists()


def user_is_coach_or_admin(user):
    return user.role in (User.UserRole.COACH, User.UserRole.ADMIN)


class IsAcademyAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        academy = getattr(obj, "academy", obj)
        return user_is_academy_admin(request.user, academy)
