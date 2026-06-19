"""Tests for student self-service of their chess platform account."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from academies.models import Academy, CoachStudentLink, PlatformChoice

User = get_user_model()


class CoachLinkUpdatePermissionTests(APITestCase):
    def setUp(self):
        self.coach = User.objects.create_user(
            username="coach", email="coach@x.test", password="pw", role="coach"
        )
        self.student = User.objects.create_user(
            username="student", email="student@x.test", password="pw", role="student"
        )
        self.other_student = User.objects.create_user(
            username="other", email="other@x.test", password="pw", role="student"
        )
        self.academy = Academy.objects.create(name="Test Academy")
        self.link = CoachStudentLink.objects.create(
            coach=self.coach, student=self.student, academy=self.academy
        )

    def test_student_can_set_own_platform_account(self):
        self.client.force_authenticate(self.student)
        res = self.client.patch(
            f"/api/coach-links/{self.link.id}/",
            {"platform": "lichess", "platform_username": "DrNykterstein"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.link.refresh_from_db()
        self.assertEqual(self.link.platform, PlatformChoice.LICHESS)
        self.assertEqual(self.link.platform_username, "DrNykterstein")

    def test_student_can_toggle_sync_enabled(self):
        self.client.force_authenticate(self.student)
        res = self.client.patch(
            f"/api/coach-links/{self.link.id}/",
            {"sync_enabled": False},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.link.refresh_from_db()
        self.assertFalse(self.link.sync_enabled)

    def test_student_cannot_edit_coach_only_fields(self):
        self.client.force_authenticate(self.student)
        res = self.client.patch(
            f"/api/coach-links/{self.link.id}/",
            {"coach_notes": "i am hacking"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)
        self.link.refresh_from_db()
        self.assertEqual(self.link.coach_notes, "")

    def test_student_cannot_edit_another_students_link(self):
        # The other student's link is not in this student's queryset -> 404.
        other_link = CoachStudentLink.objects.create(
            coach=self.coach, student=self.other_student
        )
        self.client.force_authenticate(self.student)
        res = self.client.patch(
            f"/api/coach-links/{other_link.id}/",
            {"platform": "lichess", "platform_username": "x"},
            format="json",
        )
        self.assertIn(res.status_code, (403, 404))

    def test_coach_can_still_edit_coaching_fields(self):
        self.client.force_authenticate(self.coach)
        res = self.client.patch(
            f"/api/coach-links/{self.link.id}/",
            {"coach_notes": "great progress", "platform": "chesscom",
             "platform_username": "magnus"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.link.refresh_from_db()
        self.assertEqual(self.link.coach_notes, "great progress")
        self.assertEqual(self.link.platform_username, "magnus")
