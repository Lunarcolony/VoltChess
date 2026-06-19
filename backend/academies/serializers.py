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
            "platform",
            "platform_username",
            "sync_enabled",
            "last_sync_at",
            "sync_status",
            "sync_error",
            "created_at",
        )
        read_only_fields = ("id", "coach", "student", "created_at")

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get("student_id") and not attrs.get("student_username"):
                raise serializers.ValidationError(
                    "Provide student_id or student_username."
                )
        platform = attrs.get("platform", getattr(self.instance, "platform", ""))
        username = attrs.get(
            "platform_username",
            getattr(self.instance, "platform_username", ""),
        )
        if platform and not str(username).strip():
            raise serializers.ValidationError(
                {"platform_username": "Username is required when platform is set."}
            )
        if username and not platform:
            raise serializers.ValidationError(
                {"platform": "Select chesscom or lichess when setting a username."}
            )
        return attrs
