from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from games.models import Game
from games.permissions import IsGameOwnerOrCoach

from .models import Annotation
from .serializers import AnnotationSerializer

User = get_user_model()


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        game_id = self.request.query_params.get("game_id")
        if not game_id:
            return Annotation.objects.none()
        game = get_object_or_404(Game, pk=game_id)
        checker = IsGameOwnerOrCoach()
        if not checker.has_object_permission(self.request, self, game):
            return Annotation.objects.none()
        return Annotation.objects.filter(game=game).select_related("author")

    def perform_create(self, serializer):
        game_id = self.request.data.get("game")
        game = get_object_or_404(Game, pk=game_id)
        checker = IsGameOwnerOrCoach()
        if not checker.has_object_permission(self.request, self, game):
            raise PermissionDenied()
        serializer.save(author=self.request.user, game=game)
