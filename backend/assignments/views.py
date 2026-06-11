from django.contrib.auth import get_user_model
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from academies.models import CoachStudentLink

from .models import Assignment
from .serializers import AssignmentSerializer

User = get_user_model()


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.select_related("coach", "student", "game")

        if user.role == User.UserRole.ADMIN:
            return qs

        if user.role == User.UserRole.COACH:
            return qs.filter(coach=user)

        return qs.filter(student=user)

    def perform_create(self, serializer):
        user = self.request.user
        student_id = self.request.data.get("student_id")
        if user.role == User.UserRole.COACH:
            if not CoachStudentLink.objects.filter(
                coach=user, student_id=student_id
            ).exists():
                raise PermissionDenied("Student is not assigned to you.")
        serializer.save(coach=user)
