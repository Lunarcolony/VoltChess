from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademyViewSet,
    CoachStudentLinkViewSet,
    StudentGamesView,
    StudentReportView,
    StudentStatsView,
)

router = DefaultRouter()
router.register(r"academies", AcademyViewSet, basename="academy")
router.register(r"coach-links", CoachStudentLinkViewSet, basename="coach-link")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "students/<uuid:student_id>/stats/",
        StudentStatsView.as_view(),
        name="student-stats",
    ),
    path(
        "students/<uuid:student_id>/report/",
        StudentReportView.as_view(),
        name="student-report",
    ),
    path(
        "students/<uuid:student_id>/games/",
        StudentGamesView.as_view(),
        name="student-games",
    ),
]
