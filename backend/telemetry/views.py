from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from .services import compute_telemetry_stats, ingest_payload, list_recent_events

User = get_user_model()


def _require_admin(user):
    if not user.is_authenticated or user.role != User.UserRole.ADMIN:
        raise PermissionDenied("Admins only.")


class TelemetryIngestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        if not isinstance(request.data, dict):
            raise ValidationError("Expected a JSON object.")
        if not request.data.get("client_id"):
            raise ValidationError({"client_id": "Required."})
        try:
            result = ingest_payload(request.data)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        return Response(result, status=status.HTTP_200_OK)


class TelemetryStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        _require_admin(request.user)
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        return Response(compute_telemetry_stats(days=days))


class TelemetryEventsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        _require_admin(request.user)
        try:
            limit = int(request.query_params.get("limit", 50))
        except (TypeError, ValueError):
            limit = 50
        try:
            offset = int(request.query_params.get("offset", 0))
        except (TypeError, ValueError):
            offset = 0
        return Response(list_recent_events(limit=limit, offset=offset))
