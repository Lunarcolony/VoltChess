from rest_framework import serializers

from .models import Classroom


class ClassroomSerializer(serializers.ModelSerializer):
    coach_username = serializers.CharField(source="coach.username", read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = (
            "id",
            "name",
            "join_code",
            "is_active",
            "coach_username",
            "student_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "join_code",
            "coach_username",
            "student_count",
            "created_at",
            "updated_at",
        )

    def get_student_count(self, obj):
        return obj.coach.students_coached.count()


class ClassroomPreviewSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=20)


class JoinClassroomSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=20)
