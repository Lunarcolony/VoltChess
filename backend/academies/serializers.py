from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Academy, CoachStudentLink, Membership

User = get_user_model()


class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = ("id", "name", "created_at")
        read_only_fields = ("id", "created_at")


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Membership
        fields = ("id", "academy", "user", "user_id", "role", "joined_at")
        read_only_fields = ("id", "joined_at", "academy")


class CoachStudentLinkSerializer(serializers.ModelSerializer):
    coach = UserSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    student_id = serializers.UUIDField(write_only=True, required=False)
    student_username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CoachStudentLink
        fields = (
            "id",
            "coach",
            "student",
            "student_id",
            "student_username",
            "academy",
            "coach_notes",
            "tags",
            "priority",
            "target_accuracy",
            "weekly_game_goal",
            "pinned",
            "last_reviewed_at",
            "created_at",
        )
        read_only_fields = ("id", "coach", "student", "created_at")

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get("student_id") and not attrs.get("student_username"):
                raise serializers.ValidationError(
                    "Provide student_id or student_username."
                )
        return attrs
