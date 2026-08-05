from django.contrib import admin

from .models import TelemetryClient, TelemetryEvent, TelemetrySession


@admin.register(TelemetryClient)
class TelemetryClientAdmin(admin.ModelAdmin):
    list_display = (
        "client_id",
        "user",
        "games_analyzed",
        "active_ms",
        "session_count",
        "first_seen",
        "last_seen",
    )
    list_filter = ("first_seen", "last_seen")
    search_fields = ("client_id", "user__username")
    readonly_fields = ("first_seen", "last_seen")


@admin.register(TelemetrySession)
class TelemetrySessionAdmin(admin.ModelAdmin):
    list_display = (
        "session_id",
        "client",
        "started_at",
        "ended_at",
        "active_ms",
        "landing_path",
    )
    list_filter = ("started_at",)
    search_fields = ("session_id", "client__client_id", "landing_path")
    raw_id_fields = ("client",)


@admin.register(TelemetryEvent)
class TelemetryEventAdmin(admin.ModelAdmin):
    list_display = ("name", "ts", "client", "event_id", "created_at")
    list_filter = ("name", "ts")
    search_fields = ("name", "event_id", "client__client_id")
    raw_id_fields = ("client", "session")
    readonly_fields = ("created_at",)
