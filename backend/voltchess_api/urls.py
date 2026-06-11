from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("academies.urls")),
    path("api/", include("games.urls")),
    path("api/", include("assignments.urls")),
    path("api/", include("annotations.urls")),
]
