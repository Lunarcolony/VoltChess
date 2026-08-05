"""Ingest and aggregate helpers for product telemetry."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import TelemetryClient, TelemetryEvent, TelemetrySession

User = get_user_model()

MAX_EVENTS_PER_INGEST = 200


def _parse_ts(value: Any) -> datetime:
    if isinstance(value, datetime):
        ts = value
    elif isinstance(value, (int, float)):
        # Accept ms or seconds epoch
        raw = float(value)
        if raw > 1e12:
            raw /= 1000.0
        ts = datetime.fromtimestamp(raw, tz=timezone.get_current_timezone())
    elif isinstance(value, str):
        ts = parse_datetime(value)
        if ts is None:
            raise ValueError(f"Invalid timestamp: {value}")
    else:
        raise ValueError(f"Invalid timestamp type: {type(value)}")
    if timezone.is_naive(ts):
        ts = timezone.make_aware(ts, timezone.get_current_timezone())
    return ts


def _as_uuid(value: Any, field: str) -> UUID:
    try:
        return UUID(str(value))
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid {field}") from exc


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, n)


@transaction.atomic
def ingest_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Upsert client/session, insert events, bump counters. Returns accept summary."""
    client_id = _as_uuid(data.get("client_id"), "client_id")
    device = data.get("device") if isinstance(data.get("device"), dict) else {}
    aggregates = (
        data.get("aggregates") if isinstance(data.get("aggregates"), dict) else {}
    )
    raw_events = data.get("events")
    if not isinstance(raw_events, list):
        raw_events = []
    raw_events = raw_events[:MAX_EVENTS_PER_INGEST]

    user = None
    user_id = data.get("user_id")
    if user_id:
        try:
            user = User.objects.filter(id=_as_uuid(user_id, "user_id")).first()
        except ValueError:
            user = None

    client, created = TelemetryClient.objects.select_for_update().get_or_create(
        client_id=client_id,
        defaults={"device": device or {}, "user": user},
    )
    if not created:
        if device:
            client.device = device
        if user and client.user_id != user.id:
            client.user = user
        client.save(update_fields=["device", "user", "last_seen"])

    session_obj = None
    session_data = data.get("session")
    if isinstance(session_data, dict) and session_data.get("session_id"):
        session_id = _as_uuid(session_data.get("session_id"), "session_id")
        started_at = _parse_ts(
            session_data.get("started_at") or timezone.now().isoformat()
        )
        ended_raw = session_data.get("ended_at")
        ended_at = _parse_ts(ended_raw) if ended_raw else None
        active_ms = _safe_int(session_data.get("active_ms"))
        landing_path = str(session_data.get("landing_path") or "")[:512]
        referrer = str(session_data.get("referrer") or "")[:1024]
        utm = session_data.get("utm") if isinstance(session_data.get("utm"), dict) else {}
        route_times = (
            session_data.get("route_times")
            if isinstance(session_data.get("route_times"), dict)
            else {}
        )

        session_obj, sess_created = TelemetrySession.objects.select_for_update().get_or_create(
            client=client,
            session_id=session_id,
            defaults={
                "started_at": started_at,
                "ended_at": ended_at,
                "active_ms": active_ms,
                "landing_path": landing_path,
                "referrer": referrer,
                "utm": utm,
                "route_times": route_times,
            },
        )
        if sess_created:
            TelemetryClient.objects.filter(pk=client.pk).update(
                session_count=F("session_count") + 1
            )
            client.session_count += 1
        else:
            # Merge: take max active_ms, latest ended_at, union route_times
            merged_routes = dict(session_obj.route_times or {})
            for path, ms in route_times.items():
                key = str(path)[:512]
                merged_routes[key] = max(
                    _safe_int(merged_routes.get(key)), _safe_int(ms)
                )
            session_obj.active_ms = max(session_obj.active_ms, active_ms)
            if ended_at and (
                session_obj.ended_at is None or ended_at > session_obj.ended_at
            ):
                session_obj.ended_at = ended_at
            if landing_path and not session_obj.landing_path:
                session_obj.landing_path = landing_path
            if referrer and not session_obj.referrer:
                session_obj.referrer = referrer
            if utm:
                session_obj.utm = {**(session_obj.utm or {}), **utm}
            session_obj.route_times = merged_routes
            session_obj.save(
                update_fields=[
                    "active_ms",
                    "ended_at",
                    "landing_path",
                    "referrer",
                    "utm",
                    "route_times",
                ]
            )

    accepted_ids: list[str] = []
    games_bump = 0
    for raw in raw_events:
        if not isinstance(raw, dict):
            continue
        try:
            event_id = _as_uuid(raw.get("event_id"), "event_id")
            name = str(raw.get("name") or "").strip()[:128]
            if not name:
                continue
            ts = _parse_ts(raw.get("ts") or timezone.now().isoformat())
            props = raw.get("properties") if isinstance(raw.get("properties"), dict) else {}
        except ValueError:
            continue

        try:
            with transaction.atomic():
                TelemetryEvent.objects.create(
                    event_id=event_id,
                    client=client,
                    session=session_obj,
                    name=name,
                    ts=ts,
                    properties=props,
                )
        except IntegrityError:
            accepted_ids.append(str(event_id))
            continue

        accepted_ids.append(str(event_id))
        if name == "game_analyzed":
            games_bump += 1

    # Prefer client-reported totals when higher (covers offline accumulations).
    reported_games = _safe_int(aggregates.get("games_analyzed_total"))
    reported_active = _safe_int(aggregates.get("active_ms_total"))
    reported_sessions = _safe_int(aggregates.get("sessions_total"))

    update_fields = ["last_seen"]
    if games_bump:
        client.games_analyzed += games_bump
        update_fields.append("games_analyzed")
    if reported_games > client.games_analyzed:
        client.games_analyzed = reported_games
        if "games_analyzed" not in update_fields:
            update_fields.append("games_analyzed")

    # Session active_ms already stored on session; bump client total from aggregates or delta
    if reported_active > client.active_ms:
        client.active_ms = reported_active
        update_fields.append("active_ms")
    elif session_obj and session_obj.active_ms > 0 and reported_active == 0:
        # Soft bump: ensure client.active_ms at least covers this session once
        pass

    if reported_sessions > client.session_count:
        client.session_count = reported_sessions
        update_fields.append("session_count")

    client.save(update_fields=list(dict.fromkeys(update_fields)))

    return {
        "accepted": len(accepted_ids),
        "accepted_event_ids": accepted_ids,
        "client_id": str(client.client_id),
        "created": created,
    }


def compute_telemetry_stats(days: int = 30) -> dict[str, Any]:
    days = max(1, min(days, 90))
    since = timezone.now() - timedelta(days=days)

    totals = TelemetryClient.objects.aggregate(
        clients=Count("id"),
        games_analyzed=Sum("games_analyzed"),
        active_ms=Sum("active_ms"),
        sessions=Sum("session_count"),
    )
    session_avg = TelemetrySession.objects.aggregate(avg_active=Avg("active_ms"))

    analyses_by_day = (
        TelemetryEvent.objects.filter(name="game_analyzed", ts__gte=since)
        .annotate(day=TruncDate("ts"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    # Active hours from session heartbeats / sessions in window
    sessions_by_day = (
        TelemetrySession.objects.filter(started_at__gte=since)
        .annotate(day=TruncDate("started_at"))
        .values("day")
        .annotate(active_ms=Sum("active_ms"), count=Count("id"))
        .order_by("day")
    )

    engine_counter: Counter[str] = Counter()
    source_counter: Counter[str] = Counter()
    for props in TelemetryEvent.objects.filter(
        name="game_analyzed", ts__gte=since
    ).values_list("properties", flat=True)[:5000]:
        if not isinstance(props, dict):
            continue
        engine = props.get("engine")
        if engine:
            engine_counter[str(engine)] += 1
        source = props.get("source")
        if source:
            source_counter[str(source)] += 1

    return {
        "totals": {
            "clients": totals["clients"] or 0,
            "games_analyzed": totals["games_analyzed"] or 0,
            "active_ms": totals["active_ms"] or 0,
            "sessions": totals["sessions"] or 0,
            "avg_session_active_ms": int(session_avg["avg_active"] or 0),
        },
        "days": days,
        "analyses_by_day": [
            {"day": row["day"].isoformat(), "count": row["count"]}
            for row in analyses_by_day
            if row["day"]
        ],
        "active_by_day": [
            {
                "day": row["day"].isoformat(),
                "active_ms": row["active_ms"] or 0,
                "sessions": row["count"],
            }
            for row in sessions_by_day
            if row["day"]
        ],
        "top_engines": [
            {"name": name, "count": count}
            for name, count in engine_counter.most_common(10)
        ],
        "top_sources": [
            {"name": name, "count": count}
            for name, count in source_counter.most_common(10)
        ],
    }


def list_recent_events(*, limit: int = 50, offset: int = 0) -> dict[str, Any]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    qs = TelemetryEvent.objects.select_related("client").order_by("-ts")
    total = qs.count()
    rows = qs[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": [
            {
                "event_id": str(ev.event_id),
                "name": ev.name,
                "ts": ev.ts.isoformat(),
                "client_id": str(ev.client.client_id),
                "properties": ev.properties,
            }
            for ev in rows
        ],
    }
