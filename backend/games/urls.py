from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BulkGameUploadView, GameEvalView, GameViewSet

router = DefaultRouter()
router.register(r"games", GameViewSet, basename="game")

urlpatterns = [
    path("games/bulk/", BulkGameUploadView.as_view(), name="games-bulk"),
    path("games/<uuid:game_id>/eval/", GameEvalView.as_view(), name="game-eval"),
    path("", include(router.urls)),
]
