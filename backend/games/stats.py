from collections import defaultdict
from datetime import datetime

from django.contrib.auth import get_user_model

from assignments.models import Assignment, AssignmentStatus
from .models import Game

User = get_user_model()

CLASSIFICATION_KEYS = [
    "Splendid",
    "Perfect",
    "Best",
    "Excellent",
    "Okay",
    "Inaccuracy",
    "Mistake",
    "Blunder",
    "Opening",
    "Forced",
]


def _parse_date(date_str):
    if not date_str:
        return None
    for fmt in ("%Y.%m.%d", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def _count_classifications(positions):
    counts = defaultdict(lambda: {"white": 0, "black": 0})
    for idx, pos in enumerate(positions):
        classification = pos.get("moveClassification")
        if not classification:
            continue
        side = "white" if idx % 2 == 0 else "black"
        counts[classification][side] += 1
    return counts


def _game_summary(game):
    eval_obj = getattr(game, "eval", None)
    if not eval_obj:
        return {
            "game_id": str(game.id),
            "date": game.date,
            "white": game.white,
            "black": game.black,
            "result": game.result,
            "has_eval": False,
        }

    positions = eval_obj.positions or []
    accuracy = eval_obj.accuracy or {}
    classifications = _count_classifications(positions)

    return {
        "game_id": str(game.id),
        "date": game.date,
        "white": game.white,
        "black": game.black,
        "result": game.result,
        "has_eval": True,
        "accuracy": accuracy,
        "classifications": dict(classifications),
        "move_count": len(positions),
    }


def compute_student_stats(student):
    games = Game.objects.filter(owner=student).select_related("eval")
    games_with_eval = [g for g in games if hasattr(g, "eval")]

    total_games = games.count()
    analyzed_games = len(games_with_eval)

    accuracy_white = []
    accuracy_black = []
    blunders = {"white": 0, "black": 0}
    mistakes = {"white": 0, "black": 0}

    for game in games_with_eval:
        acc = game.eval.accuracy or {}
        w = acc.get("white")
        b = acc.get("black")
        if isinstance(w, (int, float)):
            accuracy_white.append(w)
        if isinstance(b, (int, float)):
            accuracy_black.append(b)

        counts = _count_classifications(game.eval.positions or [])
        blunders["white"] += counts.get("Blunder", {}).get("white", 0)
        blunders["black"] += counts.get("Blunder", {}).get("black", 0)
        mistakes["white"] += counts.get("Mistake", {}).get("white", 0)
        mistakes["black"] += counts.get("Mistake", {}).get("black", 0)

    def avg(values):
        nums = [v for v in values if isinstance(v, (int, float))]
        return round(sum(nums) / len(nums), 1) if nums else None

    pending_assignments = Assignment.objects.filter(
        student=student,
        status=AssignmentStatus.PENDING,
    ).count()

    return {
        "student_id": str(student.id),
        "username": student.username,
        "total_games": total_games,
        "analyzed_games": analyzed_games,
        "avg_accuracy_white": avg(accuracy_white),
        "avg_accuracy_black": avg(accuracy_black),
        "blunders": blunders,
        "mistakes": mistakes,
        "pending_assignments": pending_assignments,
    }


def compute_student_report(student, date_from=None, date_to=None):
    games = Game.objects.filter(owner=student).select_related("eval")

    from_date = _parse_date(date_from) if date_from else None
    to_date = _parse_date(date_to) if date_to else None

    filtered = []
    for game in games:
        game_date = _parse_date(game.date)
        if from_date and game_date and game_date < from_date:
            continue
        if to_date and game_date and game_date > to_date:
            continue
        filtered.append(game)

    stats = compute_student_stats(student)
    game_breakdown = [_game_summary(g) for g in filtered]

    assignments = Assignment.objects.filter(student=student).select_related(
        "coach"
    )
    assignment_data = [
        {
            "id": str(a.id),
            "status": a.status,
            "instructions": a.instructions,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "coach": a.coach.username,
        }
        for a in assignments
    ]

    return {
        "student": {
            "id": str(student.id),
            "username": student.username,
            "email": student.email,
        },
        "summary": stats,
        "games": game_breakdown,
        "assignments": assignment_data,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
