from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Annotation


class AnnotationSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Annotation
        fields = (
            "id",
            "game",
            "author",
            "move_index",
            "fen",
            "body",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "author", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
