from rest_framework import serializers

from .models import AnalysisStatus, Game, GameEval


class GameEvalSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameEval
        fields = (
            "id",
            "positions",
            "accuracy",
            "estimated_elo",
            "settings",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class GameListSerializer(serializers.ModelSerializer):
    has_eval = serializers.SerializerMethodField()
    accuracy = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = (
            "id",
            "pgn",
            "event",
            "site",
            "date",
            "round",
            "white",
            "black",
            "result",
            "termination",
            "time_control",
            "source",
            "external_id",
            "external_url",
            "analysis_status",
            "analysis_source",
            "platform_played_at",
            "created_at",
            "has_eval",
            "accuracy",
        )

    def get_has_eval(self, obj):
        return hasattr(obj, "eval")

    def get_accuracy(self, obj):
        if hasattr(obj, "eval") and obj.eval.accuracy:
            return obj.eval.accuracy
        return None


class GameDetailSerializer(serializers.ModelSerializer):
    eval = GameEvalSerializer(read_only=True)

    class Meta:
        model = Game
        fields = (
            "id",
            "pgn",
            "event",
            "site",
            "date",
            "round",
            "white",
            "black",
            "result",
            "termination",
            "time_control",
            "source",
            "external_id",
            "external_url",
            "analysis_status",
            "analysis_source",
            "platform_played_at",
            "created_at",
            "updated_at",
            "eval",
        )
        read_only_fields = ("id", "created_at", "updated_at", "owner")


class GameCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = (
            "id",
            "pgn",
            "event",
            "site",
            "date",
            "round",
            "white",
            "black",
            "result",
            "termination",
            "time_control",
            "source",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class GameEvalUploadSerializer(serializers.Serializer):
    positions = serializers.ListField()
    accuracy = serializers.DictField()
    estimated_elo = serializers.DictField(required=False, allow_null=True)
    settings = serializers.DictField()

    def save(self, game):
        eval_data = {
            "positions": self.validated_data["positions"],
            "accuracy": self.validated_data["accuracy"],
            "estimated_elo": self.validated_data.get("estimated_elo"),
            "settings": self.validated_data["settings"],
        }
        eval_obj, _ = GameEval.objects.update_or_create(
            game=game,
            defaults=eval_data,
        )
        if game.analysis_status != AnalysisStatus.COMPLETE:
            game.analysis_status = AnalysisStatus.COMPLETE
            game.save(update_fields=["analysis_status", "updated_at"])
        return eval_obj
