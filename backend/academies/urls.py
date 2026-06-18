from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademyViewSet,
    CoachStudentLinkViewSet,
    JoinClassroomView,
    MyClassroomView,
    PreviewClassroomJoinView,
    RegenerateClassroomCodeView,
    StudentGamesView,
    StudentReportView,
    StudentStatsView,
)

router = DefaultRouter()
router.register(r"academies", AcademyViewSet, basename="academy")
router.register(r"coach-links", CoachStudentLinkViewSet, basename="coach-link")

urlpatterns = [
    path("", include(router.urls)),
    path("classroom/mine/", MyClassroomView.as_view(), name="classroom-mine"),
    path(
        "classroom/regenerate/",
        RegenerateClassroomCodeView.as_view(),
        name="classroom-regenerate",
    ),
    path(
        "classroom/preview/",
        PreviewClassroomJoinView.as_view(),
        name="classroom-preview",
    ),
    path("classroom/join/", JoinClassroomView.as_view(), name="classroom-join"),
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
