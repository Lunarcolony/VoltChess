import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    COACH = "coach", "Coach"
    STUDENT = "student", "Student"


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
    )

    def __str__(self):
        return self.username


# Allows User.UserRole.COACH style references across the codebase
User.UserRole = UserRole
