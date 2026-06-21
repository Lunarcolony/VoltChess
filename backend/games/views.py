from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from academies.models import CoachStudentLink

from .models import Game
from .permissions import IsGameOwnerOrCoach
from .serializers import (
    GameCreateSerializer,
    GameDetailSerializer,
    GameEvalUploadSerializer,
    GameListSerializer,
)

User = get_user_model()


class GameViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, IsGameOwnerOrCoach)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GameCreateSerializer
        if self.action == "retrieve":
            return GameDetailSerializer
        return GameListSerializer

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get("student_id")

        if student_id:
            if user.role == User.UserRole.COACH:
                if CoachStudentLink.objects.filter(
                    coach=user, student_id=student_id
                ).exists():
                    return Game.objects.filter(owner_id=student_id).select_related(
                        "eval"
                    )
                return Game.objects.none()
            if user.role == User.UserRole.ADMIN:
                return Game.objects.filter(owner_id=student_id).select_related(
                    "eval"
                )
            return Game.objects.none()

        if user.role == User.UserRole.ADMIN:
            return Game.objects.all().select_related("eval")
        return Game.objects.filter(owner=user).select_related("eval")

    def get_object(self):
        """Retrieve by pk + object permission (coaches can open linked students' games)."""
        if self.action == "retrieve":
            queryset = Game.objects.select_related("eval")
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            obj = get_object_or_404(queryset, **filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class GameEvalView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsGameOwnerOrCoach)

    def get_game(self, request, game_id):
        game = get_object_or_404(Game, pk=game_id)
        self.check_object_permissions(request, game)
        return game

    def put(self, request, game_id):
        game = self.get_game(request, game_id)
        serializer = GameEvalUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        eval_obj = serializer.save(game=game)
        return Response(
            {
                "id": str(eval_obj.id),
                "game_id": str(game.id),
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request, game_id):
        game = self.get_game(request, game_id)
        if not hasattr(game, "eval"):
            return Response(status=status.HTTP_404_NOT_FOUND)
        from .serializers import GameEvalSerializer

        return Response(GameEvalSerializer(game.eval).data)


class BulkGameUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        games_data = request.data.get("games", [])
        if not isinstance(games_data, list):
            return Response(
                {"detail": "games must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        for item in games_data:
            serializer = GameCreateSerializer(
                data=item, context={"request": request}
            )
            if serializer.is_valid():
                game = serializer.save(owner=request.user)
                eval_data = item.get("eval")
                if eval_data:
                    upload = GameEvalUploadSerializer(data=eval_data)
                    if upload.is_valid():
                        upload.save(game=game)
                created.append(str(game.id))

        return Response({"created": created}, status=status.HTTP_201_CREATED)
