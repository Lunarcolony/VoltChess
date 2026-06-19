from django.urls import path

from .views import (
    ClaimAnalysisView,
    CompleteAnalysisView,
    PendingAnalysisView,
    PresenceView,
    ProcessServerQueueView,
    SyncOverviewView,
    SyncTriggerView,
)

urlpatterns = [
    path("sync/overview/", SyncOverviewView.as_view(), name="sync-overview"),
    path("sync/trigger/", SyncTriggerView.as_view(), name="sync-trigger"),
    path("sync/presence/", PresenceView.as_view(), name="sync-presence"),
    path(
        "sync/pending-analysis/",
        PendingAnalysisView.as_view(),
        name="sync-pending-analysis",
    ),
    path(
        "sync/games/<uuid:game_id>/claim/",
        ClaimAnalysisView.as_view(),
        name="sync-claim-analysis",
    ),
    path(
        "sync/games/<uuid:game_id>/complete/",
        CompleteAnalysisView.as_view(),
        name="sync-complete-analysis",
    ),
    path(
        "sync/process-server/",
        ProcessServerQueueView.as_view(),
        name="sync-process-server",
    ),
]
