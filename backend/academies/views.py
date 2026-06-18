from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Game
from games.serializers import GameListSerializer
from games.stats import compute_student_report, compute_student_stats

from .classroom_codes import (
    generate_join_code,
    get_or_create_classroom_for_coach,
    normalize_join_code,
)
from .classroom_serializers import ClassroomSerializer
from .models import Academy, Classroom, CoachStudentLink, Membership, MembershipRole
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

        # Coaches must use classroom join codes — prevents linking the wrong account.
        if user.role == User.UserRole.COACH:
            raise PermissionDenied(
                "Share your classroom join code instead. Students join from My Academy."
            )

        student_username = self.request.data.get("student_username", "").strip()
        student_id = self.request.data.get("student_id")
        if student_username:
            student = User.objects.filter(username__iexact=student_username).first()
            if not student:
                raise ValidationError(
                    {"student_username": f"No user found with username '{student_username}'."}
                )
        else:
            student = get_object_or_404(User, pk=student_id)

        if student.role != User.UserRole.STUDENT:
            raise PermissionDenied("Can only link student accounts.")

        if CoachStudentLink.objects.filter(coach=user, student=student).exists():
            raise ValidationError({"detail": "This student is already linked to you."})

        try:
            serializer.save(coach=user, student=student)
        except IntegrityError:
            raise ValidationError({"detail": "This student is already linked to you."})


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


class MyClassroomView(APIView):
    """Coach: get or create their classroom and join code."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
            return Response(status=status.HTTP_403_FORBIDDEN)
        classroom = get_or_create_classroom_for_coach(user)
        return Response(ClassroomSerializer(classroom).data)

    def patch(self, request):
        user = request.user
        if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
            return Response(status=status.HTTP_403_FORBIDDEN)
        classroom = get_or_create_classroom_for_coach(user)
        name = request.data.get("name")
        if name and isinstance(name, str):
            classroom.name = name.strip()[:200]
            classroom.save(update_fields=["name", "updated_at"])
        if "is_active" in request.data:
            classroom.is_active = bool(request.data["is_active"])
            classroom.save(update_fields=["is_active", "updated_at"])
        return Response(ClassroomSerializer(classroom).data)


class RegenerateClassroomCodeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
            return Response(status=status.HTTP_403_FORBIDDEN)
        classroom = get_or_create_classroom_for_coach(user)
        classroom.join_code = generate_join_code()
        classroom.save(update_fields=["join_code", "updated_at"])
        return Response(ClassroomSerializer(classroom).data)


class PreviewClassroomJoinView(APIView):
    """Student: verify a join code and see which coach they will join."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.role != User.UserRole.STUDENT:
            return Response(
                {"detail": "Only student accounts can join a classroom."},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = normalize_join_code(request.data.get("join_code", ""))
        if not code or len(code) < 5:
            return Response(
                {"detail": "Enter a valid classroom code (e.g. VC-ABC123)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        classroom = Classroom.objects.filter(
            join_code__iexact=code, is_active=True
        ).select_related("coach").first()
        if not classroom:
            return Response(
                {"detail": "No classroom found with that code. Check with your coach."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if classroom.coach_id == user.pk:
            return Response(
                {"detail": "You cannot join your own classroom."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        already = CoachStudentLink.objects.filter(
            coach=classroom.coach, student=user
        ).exists()

        return Response(
            {
                "join_code": classroom.join_code,
                "classroom_name": classroom.name,
                "coach_username": classroom.coach.username,
                "already_member": already,
            }
        )


class JoinClassroomView(APIView):
    """Student: join a coach's classroom after verifying the code."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.role != User.UserRole.STUDENT:
            return Response(
                {"detail": "Only student accounts can join a classroom."},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = normalize_join_code(request.data.get("join_code", ""))
        if not code:
            return Response(
                {"detail": "Classroom code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        classroom = Classroom.objects.filter(
            join_code__iexact=code, is_active=True
        ).select_related("coach").first()
        if not classroom:
            return Response(
                {"detail": "Invalid or inactive classroom code."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if classroom.coach_id == user.pk:
            return Response(
                {"detail": "You cannot join your own classroom."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        link, created = CoachStudentLink.objects.get_or_create(
            coach=classroom.coach,
            student=user,
        )

        return Response(
            {
                "created": created,
                "coach_username": classroom.coach.username,
                "classroom_name": classroom.name,
                "link_id": str(link.id),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
