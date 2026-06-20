from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserRole

User = get_user_model()

# Roles a self-service signup is allowed to pick. "admin" is intentionally
# excluded — privileged accounts are provisioned server-side, never via the
# public registration endpoint.
SELF_SIGNUP_ROLES = (UserRole.COACH, UserRole.STUDENT)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=SELF_SIGNUP_ROLES,
        help_text="Account type to create: 'coach' or 'student'.",
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")

    def validate_email(self, value):
        # Email uniqueness is enforced at the DB level, but checking here gives
        # the client a clean field-level error instead of a 500 on the insert.
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return normalized

    def validate_username(self, value):
        normalized = value.strip()
        if User.objects.filter(username__iexact=normalized).exists():
            raise serializers.ValidationError("This username is already taken.")
        return normalized

    def validate_password(self, value):
        # Run Django's configured AUTH_PASSWORD_VALIDATORS (min length, common
        # password, numeric-only, etc.) so the API enforces the same policy the
        # rest of the project relies on.
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=validated_data["role"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "first_name", "last_name")
        read_only_fields = fields
