from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BulkAssignmentView,
    CoachAnalyticsView,
    CoachDashboardView,
    CoachMessageViewSet,
    LessonTemplateViewSet,
    StudentTimelineView,
    TrainingPlanViewSet,
)

router = DefaultRouter()
router.register(r"lesson-templates", LessonTemplateViewSet, basename="lesson-template")
router.register(r"coach-messages", CoachMessageViewSet, basename="coach-message")
router.register(r"training-plans", TrainingPlanViewSet, basename="training-plan")

urlpatterns = [
    path("coach/dashboard/", CoachDashboardView.as_view(), name="coach-dashboard"),
    path("coach/analytics/", CoachAnalyticsView.as_view(), name="coach-analytics"),
    path(
        "students/<uuid:student_id>/timeline/",
        StudentTimelineView.as_view(),
        name="student-timeline",
    ),
    path("assignments/bulk/", BulkAssignmentView.as_view(), name="assignments-bulk"),
    path("", include(router.urls)),
]
