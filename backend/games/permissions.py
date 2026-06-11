from django.contrib.auth import get_user_model
from rest_framework import permissions

from academies.models import CoachStudentLink

User = get_user_model()


class IsGameOwnerOrCoach(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.owner_id == request.user.pk:
            return True
        if request.user.role == User.UserRole.ADMIN:
            return True
        if request.user.role == User.UserRole.COACH:
            return CoachStudentLink.objects.filter(
                coach=request.user,
                student_id=obj.owner_id,
            ).exists()
        return False
