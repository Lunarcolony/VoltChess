from rest_framework import serializers

from .models import CoachMessage, LessonTemplate, TrainingPlan


class LessonTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonTemplate
        fields = (
            "id",
            "title",
            "category",
            "instructions",
            "pgn",
            "estimated_minutes",
            "is_favorite",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CoachMessageSerializer(serializers.ModelSerializer):
    coach_username = serializers.CharField(source="coach.username", read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)
    student_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = CoachMessage
        fields = (
            "id",
            "coach_username",
            "student",
            "student_id",
            "student_username",
            "subject",
            "body",
            "read_at",
            "created_at",
        )
        read_only_fields = ("id", "coach_username", "student", "student_username", "read_at", "created_at")


class TrainingPlanSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(write_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = TrainingPlan
        fields = (
            "id",
            "student",
            "student_id",
            "student_username",
            "title",
            "description",
            "status",
            "target_weeks",
            "goals",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "student", "student_username", "created_at", "updated_at")
