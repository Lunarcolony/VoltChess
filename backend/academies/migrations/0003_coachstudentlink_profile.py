# Generated manually for coach platform

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academies", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="coachstudentlink",
            name="coach_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="tags",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="priority",
            field=models.CharField(
                choices=[("low", "Low"), ("normal", "Normal"), ("high", "High")],
                default="normal",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="target_accuracy",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="weekly_game_goal",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="pinned",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="coachstudentlink",
            name="last_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
