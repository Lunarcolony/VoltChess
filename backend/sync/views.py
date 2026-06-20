from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academies.models import CoachStudentLink
from games.models import Game
from games.permissions import IsGameOwnerOrCoach
from games.serializers import GameDetailSerializer, GameEvalUploadSerializer

from .server_analysis import process_server_queue
from .services import (
    StudentPresence,
    claim_game_for_browser,
    games_pending_browser_analysis,
    mark_analysis_complete,
    release_game_for_retry,
    student_sync_overview,
    sync_all_enabled_links_for_student,
    sync_coach_student_link,
)

User = get_user_model()


def _get_link_for_coach(coach, link_id):
    return CoachStudentLink.objects.select_related("student").get(
        pk=link_id, coach=coach
    )


class SyncOverviewView(APIView):
    """Student or coach: platform sync summary."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        student_id = request.query_params.get("student_id")

        if student_id:
            if user.role not in (User.UserRole.COACH, User.UserRole.ADMIN):
                return Response(status=status.HTTP_403_FORBIDDEN)
            if user.role == User.UserRole.COACH:
                if not CoachStudentLink.objects.filter(
                    coach=user, student_id=student_id
                ).exists():
                    return Response(status=status.HTTP_403_FORBIDDEN)
            student = get_object_or_404(User, pk=student_id)
        else:
            student = user

        return Response(student_sync_overview(student))


class SyncTriggerView(APIView):
    """Trigger import of last 30 games for a coach-student link or all student links."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        link_id = request.data.get("link_id")
        student_id = request.data.get("student_id")

        if link_id:
            try:
                if user.role == User.UserRole.COACH:
                    link = _get_link_for_coach(user, link_id)
                elif user.role == User.UserRole.ADMIN:
                    link = CoachStudentLink.objects.select_related("student").get(
                        pk=link_id
                    )
                else:
                    link = CoachStudentLink.objects.get(pk=link_id, student=user)
            except CoachStudentLink.DoesNotExist:
                return Response(
                    {"detail": "Coach-student link not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not link.sync_enabled:
                return Response(
                    {"detail": "Sync is disabled for this student."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = sync_coach_student_link(link)
            return Response(result, status=status.HTTP_200_OK)

        target_student = user
        if student_id and user.role in (User.UserRole.COACH, User.UserRole.ADMIN):
            if user.role == User.UserRole.COACH and not CoachStudentLink.objects.filter(
                coach=user, student_id=student_id
            ).exists():
                return Response(status=status.HTTP_403_FORBIDDEN)
            target_student = get_object_or_404(User, pk=student_id)

        results = sync_all_enabled_links_for_student(target_student)
        return Response({"results": results}, status=status.HTTP_200_OK)


class PresenceView(APIView):
    """Student heartbeat — used to route analysis to browser vs Pi."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        browser_busy = bool(request.data.get("browser_busy", False))
        StudentPresence.mark_seen(request.user, browser_busy=browser_busy)
        return Response({"ok": True})


class PendingAnalysisView(APIView):
    """Games waiting for browser-side Stockfish analysis."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 3)), 10)
        games = games_pending_browser_analysis(request.user, limit=limit)
        return Response(
            GameDetailSerializer(games, many=True).data,
        )


class ClaimAnalysisView(APIView):
    """Claim a pending game for browser analysis."""

    permission_classes = (permissions.IsAuthenticated, IsGameOwnerOrCoach)

    def post(self, request, game_id):
        game = get_object_or_404(Game, pk=game_id)
        self.check_object_permissions(request, game)
        if request.user.pk != game.owner_id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        claimed = claim_game_for_browser(game.id, request.user)
        if claimed is None:
            # Already analyzed, or another tab/worker holds a fresh claim.
            return Response(
                {"detail": "Game is already analyzed or being analyzed."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(GameDetailSerializer(claimed).data)


class ReleaseAnalysisView(APIView):
    """Return a claimed-but-unfinished game to the queue (browser gave up)."""

    permission_classes = (permissions.IsAuthenticated, IsGameOwnerOrCoach)

    def post(self, request, game_id):
        game = get_object_or_404(Game, pk=game_id)
        self.check_object_permissions(request, game)
        if request.user.pk != game.owner_id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        release_game_for_retry(game.id, request.user)
        return Response({"game_id": str(game.id), "status": "released"})


class CompleteAnalysisView(APIView):
    """Upload eval from browser background worker and mark complete."""

    permission_classes = (permissions.IsAuthenticated, IsGameOwnerOrCoach)

    def post(self, request, game_id):
        game = get_object_or_404(Game, pk=game_id)
        self.check_object_permissions(request, game)
        if request.user.pk != game.owner_id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = GameEvalUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(game=game)
        mark_analysis_complete(game, "browser")
        return Response({"game_id": str(game.id), "status": "complete"})


class ProcessServerQueueView(APIView):
    """Run server Stockfish on pending games (Pi timer or student fallback)."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        max_games = min(int(request.data.get("max_games", 1)), 10)
        if request.user.role == User.UserRole.STUDENT:
            max_games = min(max_games, 1)
        elif request.user.role not in (User.UserRole.ADMIN, User.UserRole.COACH):
            return Response(status=status.HTTP_403_FORBIDDEN)
        result = process_server_queue(max_games=max_games)
        return Response(result)
