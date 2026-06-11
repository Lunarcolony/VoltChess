from django.contrib import admin

from .models import Game, GameEval


class GameEvalInline(admin.StackedInline):
    model = GameEval
    extra = 0


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("__str__", "owner", "date", "result", "created_at")
    list_filter = ("result",)
    inlines = [GameEvalInline]


@admin.register(GameEval)
class GameEvalAdmin(admin.ModelAdmin):
    list_display = ("game", "created_at")
