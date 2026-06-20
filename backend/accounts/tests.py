"""Tests for self-service account registration (role selection + validation)."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()

REGISTER_URL = "/api/register/"


class RegisterRoleTests(APITestCase):
    def _payload(self, **overrides):
        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "S3curePass!",
            "role": "student",
        }
        payload.update(overrides)
        return payload

    def test_register_as_student(self):
        res = self.client.post(REGISTER_URL, self._payload(), format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["role"], "student")
        user = User.objects.get(username="newuser")
        self.assertEqual(user.role, "student")

    def test_register_as_coach(self):
        res = self.client.post(
            REGISTER_URL,
            self._payload(username="coachy", email="coachy@example.com", role="coach"),
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["role"], "coach")
        self.assertEqual(User.objects.get(username="coachy").role, "coach")

    def test_admin_role_is_rejected(self):
        res = self.client.post(
            REGISTER_URL, self._payload(role="admin"), format="json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("role", res.data)
        self.assertFalse(User.objects.filter(username="newuser").exists())

    def test_missing_role_is_rejected(self):
        payload = self._payload()
        payload.pop("role")
        res = self.client.post(REGISTER_URL, payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("role", res.data)

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(
            username="taken", email="first@example.com", password="S3curePass!"
        )
        res = self.client.post(
            REGISTER_URL,
            self._payload(username="taken", email="second@example.com"),
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("username", res.data)

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="first", email="dupe@example.com", password="S3curePass!"
        )
        res = self.client.post(
            REGISTER_URL,
            self._payload(username="second", email="dupe@example.com"),
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.data)

    def test_weak_password_is_rejected(self):
        res = self.client.post(
            REGISTER_URL, self._payload(password="123"), format="json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("password", res.data)
        self.assertFalse(User.objects.filter(username="newuser").exists())
