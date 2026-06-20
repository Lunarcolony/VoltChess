"""Port of browser eval post-processing (accuracy + move classification)."""

from __future__ import annotations

import math
from typing import Any


def _ceil(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def win_pct_from_cp(cp: int) -> float:
    cp_ceiled = _ceil(cp, -1000, 1000)
    win_chances = 2 / (1 + math.exp(-0.00368208 * cp_ceiled)) - 1
    return 50 + 50 * win_chances


def line_win_pct(line: dict[str, Any]) -> float:
    if line.get("cp") is not None:
        return win_pct_from_cp(int(line["cp"]))
    mate = line.get("mate")
    if mate is not None:
        return win_pct_from_cp(int(mate) * 100_000)
    return 50.0


def position_win_pct(position: dict[str, Any]) -> float:
    lines = position.get("lines") or []
    if not lines:
        return 50.0
    return line_win_pct(lines[0])


def compute_accuracy(positions: list[dict[str, Any]]) -> dict[str, float]:
    win_pcts = [position_win_pct(p) for p in positions]
    if len(win_pcts) < 2:
        return {"white": 0.0, "black": 0.0}

    weights = _accuracy_weights(win_pcts)
    move_acc = _moves_accuracy(win_pcts)

    return {
        "white": _player_accuracy(move_acc, weights, "white"),
        "black": _player_accuracy(move_acc, weights, "black"),
    }


def _accuracy_weights(win_pcts: list[float]) -> list[float]:
    window_size = int(_ceil(math.ceil(len(win_pcts) / 10), 2, 8))
    half = round(window_size / 2)
    weights: list[float] = []
    for i in range(1, len(win_pcts)):
        start = i - half
        end = i + half
        if start < 0:
            window = win_pcts[:window_size]
        elif end > len(win_pcts):
            window = win_pcts[-window_size:]
        else:
            window = win_pcts[start:end]
        std = _std_dev(window)
        weights.append(_ceil(std, 0.5, 12))
    return weights


def _std_dev(values: list[float]) -> float:
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    var = sum((v - mean) ** 2 for v in values) / len(values)
    return math.sqrt(var)


def _moves_accuracy(win_pcts: list[float]) -> list[float]:
    out: list[float] = []
    for index in range(1, len(win_pcts)):
        last_wp = win_pcts[index - 1]
        wp = win_pcts[index]
        is_white = (index - 1) % 2 == 0
        win_diff = max(0.0, last_wp - wp) if is_white else max(0.0, wp - last_wp)
        raw = (
            103.1668100711649 * math.exp(-0.04354415386753951 * win_diff)
            - 3.166924740191411
        )
        out.append(min(100.0, max(0.0, raw + 1)))
    return out


def _player_accuracy(
    moves: list[float], weights: list[float], player: str
) -> float:
    rem = 0 if player == "white" else 1
    accs = [m for i, m in enumerate(moves) if i % 2 == rem]
    wts = [w for i, w in enumerate(weights) if i % 2 == rem]
    if not accs:
        return 0.0
    weighted = _weighted_mean(accs, wts)
    harmonic = _harmonic_mean(accs)
    return (weighted + harmonic) / 2


def _weighted_mean(values: list[float], weights: list[float]) -> float:
    if not values:
        return 0.0
    if not weights or len(weights) != len(values):
        return sum(values) / len(values)
    total_w = sum(weights)
    if total_w == 0:
        return sum(values) / len(values)
    return sum(v * w for v, w in zip(values, weights)) / total_w


def _harmonic_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    denom = sum(1 / max(v, 0.01) for v in values)
    return len(values) / denom if denom else 0.0


def classify_moves(
    positions: list[dict[str, Any]],
    uci_moves: list[str],
    fens: list[str],
) -> list[dict[str, Any]]:
    """Basic move classification (mirrors browser getMovesClassification)."""
    win_pcts = [position_win_pct(p) for p in positions]
    result: list[dict[str, Any]] = []

    for index, raw in enumerate(positions):
        if index == 0:
            result.append(raw)
            continue

        prev = positions[index - 1]
        if len(prev.get("lines") or []) <= 1:
            result.append({**raw, "moveClassification": "forced"})
            continue

        played = uci_moves[index - 1] if index - 1 < len(uci_moves) else ""
        alt_lines = [
            ln
            for ln in prev.get("lines") or []
            if (ln.get("pv") or [""])[0] != played
        ]
        alt_wp = line_win_pct(alt_lines[0]) if alt_lines else None

        side = fens[index - 1].split()[1] if index - 1 < len(fens) else "w"
        is_white = side == "w"
        last_wp = win_pcts[index - 1]
        wp = win_pcts[index]
        diff = (wp - last_wp) * (1 if is_white else -1)

        best_move = prev.get("bestMove") or (
            (prev.get("lines") or [{}])[0].get("pv") or [""]
        )[0]
        if played and played == best_move:
            cls = "best"
        elif diff < -20:
            cls = "blunder"
        elif diff < -10:
            cls = "mistake"
        elif diff < -5:
            cls = "inaccuracy"
        elif diff < -2:
            cls = "okay"
        else:
            cls = "excellent"

        entry = {**raw, "moveClassification": cls}
        if alt_wp is not None and diff >= -2:
            if diff > 10 and (
                (last_wp < 50 < wp) or (last_wp > 50 > wp)
            ):
                entry["moveClassification"] = "perfect"
        result.append(entry)

    return result
