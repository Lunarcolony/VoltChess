from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from academies.models import CoachStudentLink
from assignments.models import Assignment
from assignments.serializers import AssignmentSerializer

from .models import CoachMessage, LessonTemplate, TrainingPlan
from .serializers import (
    CoachMessageSerializer,
    LessonTemplateSerializer,
    TrainingPlanSerializer,
)
from .services import (
    compute_coach_analytics,
    compute_coach_dashboard,
    compute_student_timeline,
    compute_weekly_games,
)

User = get_user_model()


def _require_coach(user):
    if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
        raise PermissionDenied("Coaches only.")


def _coach_has_student(coach, student_id):
    if coach.role == User.UserRole.ADMIN:
        return True
    return CoachStudentLink.objects.filter(coach=coach, student_id=student_id).exists()


class CoachDashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        _require_coach(request.user)
        return Response(compute_coach_dashboard(request.user))


class CoachAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        _require_coach(request.user)
        return Response(compute_coach_analytics(request.user))


class StudentTimelineView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, student_id):
        _require_coach(request.user)
        if not _coach_has_student(request.user, student_id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        student = get_object_or_404(User, pk=student_id)
        return Response(
            {
                "weekly_games": compute_weekly_games(student),
                "timeline": compute_student_timeline(student, request.user),
            }
        )


class BulkAssignmentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        _require_coach(request.user)
        student_ids = request.data.get("student_ids", [])
        if not student_ids:
            return Response(
                {"detail": "student_ids required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = {
            k: v
            for k, v in request.data.items()
            if k
            in (
                "instructions",
                "title",
                "pgn",
                "due_date",
                "category",
                "priority",
                "game_id",
            )
        }

        created = []
        for sid in student_ids:
            if not _coach_has_student(request.user, sid):
                continue
            student = get_object_or_404(User, pk=sid)
            ser = AssignmentSerializer(
                data={**payload, "student_id": str(sid)},
                context={"request": request},
            )
            ser.is_valid(raise_exception=True)
            created.append(ser.save(coach=request.user))

        return Response(
            AssignmentSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class LessonTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = LessonTemplateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        _require_coach(self.request.user)
        return LessonTemplate.objects.filter(coach=self.request.user)

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class CoachMessageViewSet(viewsets.ModelViewSet):
    serializer_class = CoachMessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.UserRole.COACH, User.UserRole.ADMIN):
            return CoachMessage.objects.filter(coach=user).select_related(
                "coach", "student"
            )
        return CoachMessage.objects.filter(student=user).select_related(
            "coach", "student"
        )

    def perform_create(self, serializer):
        _require_coach(self.request.user)
        student_id = self.request.data.get("student_id")
        if not _coach_has_student(self.request.user, student_id):
            raise PermissionDenied("Student is not assigned to you.")
        student = get_object_or_404(User, pk=student_id)
        serializer.save(coach=self.request.user, student=student)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        if request.user.role == User.UserRole.STUDENT and msg.student_id != request.user.pk:
            raise PermissionDenied()
        msg.read_at = timezone.now()
        msg.save(update_fields=["read_at"])
        return Response(CoachMessageSerializer(msg).data)


class TrainingPlanViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingPlanSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.UserRole.COACH, User.UserRole.ADMIN):
            return TrainingPlan.objects.filter(coach=user).select_related("student")
        return TrainingPlan.objects.filter(student=user).select_related("coach")

    def perform_create(self, serializer):
        _require_coach(self.request.user)
        student_id = self.request.data.get("student_id")
        if not _coach_has_student(self.request.user, student_id):
            raise PermissionDenied("Student is not assigned to you.")
        student = get_object_or_404(User, pk=student_id)
        serializer.save(coach=self.request.user, student=student)
