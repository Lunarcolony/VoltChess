import secrets
import string

from django.db import IntegrityError

AMBIGUOUS = frozenset("O0IL1")
ALPHABET = "".join(
    c for c in (string.ascii_uppercase + string.digits) if c not in AMBIGUOUS
)


def normalize_join_code(raw: str) -> str:
    """Normalize user input: trim, uppercase, ensure VC- prefix."""
    code = (raw or "").strip().upper().replace(" ", "")
    if code and not code.startswith("VC-"):
        code = f"VC-{code.removeprefix('VC')}"
    return code


def generate_join_code() -> str:
    from .models import Classroom

    for _ in range(32):
        suffix = "".join(secrets.choice(ALPHABET) for _ in range(6))
        code = f"VC-{suffix}"
        if not Classroom.objects.filter(join_code=code).exists():
            return code
    raise RuntimeError("Could not generate a unique classroom join code")


def get_or_create_classroom_for_coach(coach):
    from .models import Classroom

    classroom, created = Classroom.objects.get_or_create(
        coach=coach,
        defaults={"join_code": generate_join_code(), "name": f"{coach.username}'s classroom"},
    )
    if created:
        return classroom
    if not classroom.join_code:
        classroom.join_code = generate_join_code()
        try:
            classroom.save(update_fields=["join_code", "updated_at"])
        except IntegrityError:
            classroom.join_code = generate_join_code()
            classroom.save(update_fields=["join_code", "updated_at"])
    return classroom
