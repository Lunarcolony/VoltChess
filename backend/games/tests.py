from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from academies.models import CoachStudentLink
from games.models import Game, GameEval

User = get_user_model()


class CoachRetrieveStudentGameTests(TestCase):
    def setUp(self):
        self.coach = User.objects.create_user(
            username="coach1", email="c@test.com", password="pass", role="coach"
        )
        self.student = User.objects.create_user(
            username="student1", email="s@test.com", password="pass", role="student"
        )
        CoachStudentLink.objects.create(coach=self.coach, student=self.student)
        self.game = Game.objects.create(
            owner=self.student,
            pgn='[Event "t"]\n\n1. e4 e5 2. Nf3 Nc6 *',
            white={"name": "White"},
            black={"name": "Black"},
            source="lichess",
            external_id="abc123",
        )
        GameEval.objects.create(
            game=self.game,
            positions=[{"lines": [{"cp": 0, "depth": 8, "multiPv": 1, "pv": []}]}],
            accuracy={"white": 90.0, "black": 88.0},
            settings={"depth": 8},
        )
        self.client = APIClient()

    def test_coach_can_retrieve_linked_student_game(self):
        self.client.force_authenticate(self.coach)
        res = self.client.get(f"/api/games/{self.game.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["id"], str(self.game.id))
        self.assertTrue(res.data.get("eval"))

    def test_coach_list_without_student_id_excludes_student_games(self):
        self.client.force_authenticate(self.coach)
        res = self.client.get("/api/games/")
        self.assertEqual(res.status_code, 200)
        ids = {g["id"] for g in res.data}
        self.assertNotIn(str(self.game.id), ids)
