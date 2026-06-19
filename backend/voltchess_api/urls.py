from django.contrib import admin
from django.urls import include, path

from .health import health

urlpatterns = [
    path("api/health/", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("academies.urls")),
    path("api/", include("games.urls")),
    path("api/", include("assignments.urls")),
    path("api/", include("annotations.urls")),
    path("api/", include("coaching.urls")),
    path("api/", include("sync.urls")),
]
