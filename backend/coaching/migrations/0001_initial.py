# Generated manually for coach platform

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LessonTemplate",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("opening", "Opening"),
                            ("tactics", "Tactics"),
                            ("endgame", "Endgame"),
                            ("game_review", "Game review"),
                            ("strategy", "Strategy"),
                            ("homework", "Homework"),
                        ],
                        default="homework",
                        max_length=30,
                    ),
                ),
                ("instructions", models.TextField()),
                ("pgn", models.TextField(blank=True)),
                (
                    "estimated_minutes",
                    models.PositiveSmallIntegerField(blank=True, null=True),
                ),
                ("is_favorite", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "coach",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lesson_templates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-is_favorite", "-updated_at"]},
        ),
        migrations.CreateModel(
            name="CoachMessage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("subject", models.CharField(max_length=200)),
                ("body", models.TextField()),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "coach",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages_sent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages_received",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="TrainingPlan",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Active"),
                            ("completed", "Completed"),
                            ("paused", "Paused"),
                        ],
                        default="active",
                        max_length=20,
                    ),
                ),
                ("target_weeks", models.PositiveSmallIntegerField(default=4)),
                ("goals", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "coach",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="training_plans_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="training_plans",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
    ]
