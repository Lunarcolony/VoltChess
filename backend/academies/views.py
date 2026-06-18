from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Game
from games.serializers import GameListSerializer
from games.stats import compute_student_report, compute_student_stats

from .models import Academy, CoachStudentLink, Membership, MembershipRole
from .permissions import user_is_academy_admin
from .serializers import (
    AcademySerializer,
    CoachStudentLinkSerializer,
    MembershipSerializer,
)

User = get_user_model()


class AcademyViewSet(viewsets.ModelViewSet):
    serializer_class = AcademySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Academy.objects.filter(
            memberships__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        academy = serializer.save()
        Membership.objects.get_or_create(
            academy=academy,
            user=self.request.user,
            defaults={"role": MembershipRole.ADMIN},
        )

    @action(detail=True, methods=["get", "post"])
    def members(self, request, pk=None):
        academy = self.get_object()
        if request.method == "GET":
            memberships = academy.memberships.select_related("user").all()
            return Response(MembershipSerializer(memberships, many=True).data)

        if not user_is_academy_admin(request.user, academy):
            return Response(status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id")
        role = request.data.get("role", MembershipRole.STUDENT)
        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = get_object_or_404(User, pk=user_id)
        membership, created = Membership.objects.get_or_create(
            academy=academy,
            user=user,
            defaults={"role": role},
        )
        if not created:
            membership.role = role
            membership.save()
        return Response(
            MembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CoachStudentLinkViewSet(viewsets.ModelViewSet):
    serializer_class = CoachStudentLinkSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.UserRole.ADMIN:
            return CoachStudentLink.objects.select_related("coach", "student")
        if user.role == User.UserRole.COACH:
            return CoachStudentLink.objects.filter(coach=user).select_related(
                "coach", "student"
            )
        return CoachStudentLink.objects.filter(student=user).select_related(
            "coach", "student"
        )

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
            raise PermissionDenied(
                "Only coaches and admins can create coach–student links."
            )
        student_username = self.request.data.get("student_username")
        student_id = self.request.data.get("student_id")
        if student_username:
            student = get_object_or_404(User, username=student_username.strip())
        else:
            student = get_object_or_404(User, pk=student_id)
        if student.role != User.UserRole.STUDENT and user.role != User.UserRole.ADMIN:
            raise PermissionDenied("Can only link student accounts.")
        serializer.save(coach=user, student=student)


class StudentStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, student_id):
        student = get_object_or_404(User, pk=student_id)
        user = request.user
        if user.pk != student.pk:
            if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
                return Response(status=status.HTTP_403_FORBIDDEN)
            if user.role == User.UserRole.COACH:
                if not CoachStudentLink.objects.filter(
                    coach=user, student=student
                ).exists():
                    return Response(status=status.HTTP_403_FORBIDDEN)
        return Response(compute_student_stats(student))


class StudentReportView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, student_id):
        student = get_object_or_404(User, pk=student_id)
        user = request.user
        if user.pk != student.pk:
            if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
                return Response(status=status.HTTP_403_FORBIDDEN)
            if user.role == User.UserRole.COACH:
                if not CoachStudentLink.objects.filter(
                    coach=user, student=student
                ).exists():
                    return Response(status=status.HTTP_403_FORBIDDEN)

        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        report = compute_student_report(student, date_from=date_from, date_to=date_to)
        return Response(report)


class StudentGamesView(generics.ListAPIView):
    serializer_class = GameListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        student = get_object_or_404(User, pk=self.kwargs["student_id"])
        user = self.request.user
        if user.pk != student.pk:
            if user.role == User.UserRole.COACH:
                if not CoachStudentLink.objects.filter(
                    coach=user, student=student
                ).exists():
                    return Game.objects.none()
            elif user.role != User.UserRole.ADMIN:
                return Game.objects.none()
        return Game.objects.filter(owner=student).select_related("eval")
