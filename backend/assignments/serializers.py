from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    coach = UserSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    student_id = serializers.UUIDField(write_only=True)
    game_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "coach",
            "student",
            "student_id",
            "game",
            "game_id",
            "pgn",
            "instructions",
            "due_date",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "coach", "student", "created_at", "updated_at")

    def create(self, validated_data):
        student_id = validated_data.pop("student_id")
        game_id = validated_data.pop("game_id", None)
        from django.contrib.auth import get_user_model
        from games.models import Game

        User = get_user_model()
        student = User.objects.get(pk=student_id)
        game = None
        if game_id:
            game = Game.objects.filter(pk=game_id).first()
        return Assignment.objects.create(
            coach=self.context["request"].user,
            student=student,
            game=game,
            **validated_data,
        )
