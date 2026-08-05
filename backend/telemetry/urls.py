from django.urls import path

from .views import TelemetryEventsView, TelemetryIngestView, TelemetryStatsView

urlpatterns = [
    path("telemetry/ingest/", TelemetryIngestView.as_view(), name="telemetry-ingest"),
    path("telemetry/stats/", TelemetryStatsView.as_view(), name="telemetry-stats"),
    path("telemetry/events/", TelemetryEventsView.as_view(), name="telemetry-events"),
]
