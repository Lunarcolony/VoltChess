"""Coach dashboard analytics and student insights."""

from collections import defaultdict
from datetime import date, datetime, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone

from academies.models import CoachStudentLink
from assignments.models import Assignment, AssignmentStatus
from annotations.models import Annotation
from games.models import Game
from games.stats import compute_student_stats, _parse_date, _count_classifications

from .models import CoachMessage, TrainingPlan, TrainingPlanStatus

User = get_user_model()


def _coach_students(coach):
    return User.objects.filter(
        pk__in=CoachStudentLink.objects.filter(coach=coach).values_list(
            "student_id", flat=True
        )
    )


def _engagement_score(stats, link, games_this_week):
    score = 0
    if stats["analyzed_games"] > 0:
        score += 25
    if stats["total_games"] >= 3:
        score += 15
    if games_this_week > 0:
        score += 20
    if stats["pending_assignments"] == 0:
        score += 10
    goal = link.weekly_game_goal or 0
    if goal and games_this_week >= goal:
        score += 20
    acc = stats.get("avg_accuracy_white") or stats.get("avg_accuracy_black")
    if acc and acc >= 80:
        score += 10
    return min(100, score)


def compute_weekly_games(student, weeks=8):
    today = date.today()
    result = []
    games = Game.objects.filter(owner=student)
    for w in range(weeks - 1, -1, -1):
        start = today - timedelta(days=today.weekday() + 7 * w)
        end = start + timedelta(days=6)
        count = 0
        for g in games:
            gd = _parse_date(g.date)
            if gd and start <= gd <= end:
                count += 1
        result.append({"week_start": start.isoformat(), "games": count})
    return result


def compute_coach_dashboard(coach):
    links = list(
        CoachStudentLink.objects.filter(coach=coach).select_related("student")
    )
    student_ids = [l.student_id for l in links]
    students = {l.student_id: l for l in links}

    assignments = Assignment.objects.filter(coach=coach)
    today = date.today()

    overdue = assignments.filter(
        due_date__lt=today,
        status__in=[AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
    ).count()

    due_this_week_end = today + timedelta(days=(6 - today.weekday()))
    due_soon = assignments.filter(
        due_date__gte=today,
        due_date__lte=due_this_week_end,
        status__in=[AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
    ).count()

    roster = []
    at_risk = []
    week_start = today - timedelta(days=today.weekday())

    for link in links:
        stats = compute_student_stats(link.student)
        weekly = compute_weekly_games(link.student, weeks=1)
        games_this_week = weekly[0]["games"] if weekly else 0
        engagement = _engagement_score(stats, link, games_this_week)

        last_game = (
            Game.objects.filter(owner=link.student).order_by("-created_at").first()
        )
        days_inactive = None
        if last_game:
            days_inactive = (timezone.now().date() - last_game.created_at.date()).days

        avg_acc = None
        vals = [stats["avg_accuracy_white"], stats["avg_accuracy_black"]]
        nums = [v for v in vals if v is not None]
        if nums:
            avg_acc = round(sum(nums) / len(nums), 1)

        item = {
            "link_id": str(link.id),
            "student": {
                "id": str(link.student_id),
                "username": link.student.username,
                "email": link.student.email,
            },
            "stats": stats,
            "engagement_score": engagement,
            "games_this_week": games_this_week,
            "avg_accuracy": avg_acc,
            "tags": link.tags or [],
            "priority": link.priority,
            "pinned": link.pinned,
            "target_accuracy": link.target_accuracy,
            "weekly_game_goal": link.weekly_game_goal,
            "coach_notes_preview": (link.coach_notes or "")[:120],
            "days_inactive": days_inactive,
            "last_reviewed_at": (
                link.last_reviewed_at.isoformat() if link.last_reviewed_at else None
            ),
        }
        roster.append(item)

        student_overdue = assignments.filter(
            student=link.student,
            due_date__lt=today,
            status__in=[AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
        ).count()

        if (
            (days_inactive is not None and days_inactive >= 14)
            or student_overdue > 0
            or engagement < 40
            or (
                link.weekly_game_goal
                and games_this_week < link.weekly_game_goal
                and today.weekday() >= 4
            )
        ):
            at_risk.append(
                {
                    **item,
                    "reasons": _at_risk_reasons(item, student_overdue),
                }
            )

    roster.sort(key=lambda x: (-x["pinned"], -x["engagement_score"]))

    recent_games = (
        Game.objects.filter(owner_id__in=student_ids)
        .select_related("owner")
        .order_by("-created_at")[:12]
    )
    activity = []
    for g in recent_games:
        activity.append(
            {
                "type": "game_synced",
                "at": g.created_at.isoformat(),
                "student_username": g.owner.username,
                "student_id": str(g.owner_id),
                "summary": f"{g.white.get('name', '?')} vs {g.black.get('name', '?')}",
            }
        )

    for a in assignments.order_by("-updated_at")[:8]:
        activity.append(
            {
                "type": "assignment_updated",
                "at": a.updated_at.isoformat(),
                "student_username": a.student.username,
                "student_id": str(a.student_id),
                "summary": f"Assignment {a.status}: {(a.title or a.instructions)[:60]}",
            }
        )

    activity.sort(key=lambda x: x["at"], reverse=True)

    unread_messages = CoachMessage.objects.filter(
        coach=coach, read_at__isnull=True
    ).count()

    return {
        "summary": {
            "students": len(links),
            "assignments_total": assignments.count(),
            "assignments_pending": assignments.filter(
                status=AssignmentStatus.PENDING
            ).count(),
            "assignments_in_progress": assignments.filter(
                status=AssignmentStatus.IN_PROGRESS
            ).count(),
            "assignments_overdue": overdue,
            "assignments_due_soon": due_soon,
            "active_training_plans": TrainingPlan.objects.filter(
                coach=coach, status=TrainingPlanStatus.ACTIVE
            ).count(),
            "unread_messages": unread_messages,
            "analyzed_games_total": sum(
                compute_student_stats(l.student)["analyzed_games"] for l in links
            ),
        },
        "roster": roster,
        "at_risk": at_risk[:10],
        "activity": activity[:20],
    }


def _at_risk_reasons(item, student_overdue):
    reasons = []
    if item.get("days_inactive") and item["days_inactive"] >= 14:
        reasons.append("Inactive 14+ days")
    if item.get("engagement_score", 100) < 40:
        reasons.append("Low engagement")
    if item.get("weekly_game_goal") and item.get("games_this_week", 0) < item["weekly_game_goal"]:
        reasons.append("Below weekly game goal")
    if student_overdue > 0:
        reasons.append(f"{student_overdue} overdue assignment(s)")
    return reasons


def compute_coach_analytics(coach):
    links = CoachStudentLink.objects.filter(coach=coach).select_related("student")
    accuracy_by_student = []
    blunder_totals = defaultdict(int)
    category_counts = defaultdict(int)
    opening_events = defaultdict(int)

    for link in links:
        stats = compute_student_stats(link.student)
        vals = [stats["avg_accuracy_white"], stats["avg_accuracy_black"]]
        nums = [v for v in vals if v is not None]
        avg = round(sum(nums) / len(nums), 1) if nums else None
        accuracy_by_student.append(
            {
                "username": link.student.username,
                "student_id": str(link.student_id),
                "accuracy": avg,
                "blunders": stats["blunders"]["white"] + stats["blunders"]["black"],
            }
        )
        blunder_totals["blunders"] += stats["blunders"]["white"] + stats["blunders"]["black"]
        blunder_totals["mistakes"] += stats["mistakes"]["white"] + stats["mistakes"]["black"]

        games = Game.objects.filter(owner=link.student).select_related("eval")
        for g in games:
            if g.event:
                opening_events[g.event[:80]] += 1
            if hasattr(g, "eval") and g.eval.positions:
                counts = _count_classifications(g.eval.positions)
                for cls, sides in counts.items():
                    blunder_totals[cls] += sides.get("white", 0) + sides.get("black", 0)

    assignments = Assignment.objects.filter(coach=coach)
    for a in assignments:
        category_counts[a.category] += 1

    status_breakdown = (
        assignments.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    cohort_avg = None
    accs = [x["accuracy"] for x in accuracy_by_student if x["accuracy"] is not None]
    if accs:
        cohort_avg = round(sum(accs) / len(accs), 1)

    return {
        "cohort_avg_accuracy": cohort_avg,
        "accuracy_by_student": sorted(
            accuracy_by_student,
            key=lambda x: x["accuracy"] or 0,
            reverse=True,
        ),
        "mistake_totals": dict(blunder_totals),
        "assignment_categories": dict(category_counts),
        "assignment_status": list(status_breakdown),
        "top_opening_events": sorted(
            opening_events.items(), key=lambda x: -x[1]
        )[:10],
    }


def compute_student_timeline(student, coach):
    events = []
    for g in Game.objects.filter(owner=student).order_by("-created_at")[:30]:
        events.append(
            {
                "type": "game",
                "at": g.created_at.isoformat(),
                "title": f"Game synced: {g.white.get('name', '?')} vs {g.black.get('name', '?')}",
                "meta": {"game_id": str(g.id), "has_eval": hasattr(g, "eval")},
            }
        )
    for a in Assignment.objects.filter(student=student, coach=coach).order_by(
        "-created_at"
    )[:20]:
        events.append(
            {
                "type": "assignment",
                "at": a.created_at.isoformat(),
                "title": a.title or a.instructions[:80],
                "meta": {"status": a.status, "assignment_id": str(a.id)},
            }
        )
    for m in CoachMessage.objects.filter(student=student, coach=coach).order_by(
        "-created_at"
    )[:15]:
        events.append(
            {
                "type": "message",
                "at": m.created_at.isoformat(),
                "title": m.subject,
                "meta": {"read": m.read_at is not None},
            }
        )
    for n in Annotation.objects.filter(
        game__owner=student, author=coach
    ).select_related("game")[:15]:
        events.append(
            {
                "type": "annotation",
                "at": n.updated_at.isoformat(),
                "title": f"Coach note on move {n.move_index + 1}",
                "meta": {"game_id": str(n.game_id)},
            }
        )
    events.sort(key=lambda x: x["at"], reverse=True)
    return events[:40]
