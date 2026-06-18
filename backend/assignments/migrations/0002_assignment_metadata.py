# Generated manually for coach platform

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignment",
            name="title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="assignment",
            name="category",
            field=models.CharField(
                choices=[
                    ("general", "General"),
                    ("opening", "Opening"),
                    ("tactics", "Tactics"),
                    ("endgame", "Endgame"),
                    ("game_review", "Game review"),
                    ("homework", "Homework"),
                ],
                default="general",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="assignment",
            name="priority",
            field=models.CharField(
                choices=[("low", "Low"), ("normal", "Normal"), ("high", "High")],
                default="normal",
                max_length=10,
            ),
        ),
    ]
