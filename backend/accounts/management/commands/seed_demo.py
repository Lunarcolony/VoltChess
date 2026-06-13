from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from academies.models import Academy, CoachStudentLink, Membership, MembershipRole
from accounts.models import UserRole
from assignments.models import Assignment, AssignmentStatus

User = get_user_model()

DEMO_PASSWORD = "demo1234"


class Command(BaseCommand):
    help = "Create demo coach, student, and academy links for local testing"

    def handle(self, *args, **options):
        coach, _ = User.objects.get_or_create(
            username="coach",
            defaults={
                "email": "coach@voltchess.local",
                "role": UserRole.COACH,
            },
        )
        coach.set_password(DEMO_PASSWORD)
        coach.role = UserRole.COACH
        coach.save()

        student, _ = User.objects.get_or_create(
            username="student",
            defaults={
                "email": "student@voltchess.local",
                "role": UserRole.STUDENT,
            },
        )
        student.set_password(DEMO_PASSWORD)
        student.role = UserRole.STUDENT
        student.save()

        academy, _ = Academy.objects.get_or_create(name="VoltChess Demo Academy")
        Membership.objects.get_or_create(
            academy=academy,
            user=coach,
            defaults={"role": MembershipRole.COACH},
        )
        Membership.objects.get_or_create(
            academy=academy,
            user=student,
            defaults={"role": MembershipRole.STUDENT},
        )
        CoachStudentLink.objects.get_or_create(
            coach=coach,
            student=student,
            defaults={"academy": academy},
        )

        Assignment.objects.get_or_create(
            coach=coach,
            student=student,
            instructions="Analyze your latest tournament game and upload it to VoltChess.",
            defaults={
                "status": AssignmentStatus.PENDING,
                "pgn": "",
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data ready:"))
        self.stdout.write(f"  Coach login:   coach / {DEMO_PASSWORD}")
        self.stdout.write(f"  Student login: student / {DEMO_PASSWORD}")
