"""Server-side Stockfish analysis when the student browser is unavailable."""

from __future__ import annotations

import io
import os
import subprocess
from datetime import datetime, timezone

import chess.pgn
from django.conf import settings

from games.models import AnalysisSource, Game, GameEval

from .eval_pipeline import classify_moves, compute_accuracy
from .services import mark_analysis_complete, mark_analysis_failed


def _stockfish_path() -> str | None:
    path = os.environ.get("STOCKFISH_PATH") or getattr(
        settings, "STOCKFISH_PATH", None
    )
    if path and os.path.isfile(path):
        return path
    for candidate in ("/usr/bin/stockfish", "/usr/games/stockfish"):
        if os.path.isfile(candidate):
            return candidate
    return None


def _fens_and_moves_from_pgn(pgn_text: str) -> tuple[list[str], list[str]]:
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        return [], []
    board = game.board()
    fens = [board.fen()]
    uci_moves: list[str] = []
    for move in game.mainline_moves():
        uci_moves.append(move.uci())
        board.push(move)
        fens.append(board.fen())
    return fens, uci_moves


def _wait_for(process: subprocess.Popen, token: str, limit: int = 80) -> None:
    for _ in range(limit):
        line = process.stdout.readline()
        if token in line:
            return


def _eval_fen(
    process: subprocess.Popen,
    fen: str,
    depth: int,
    movetime_ms: int,
    multipv: int = 2,
) -> dict:
    process.stdin.write(f"position fen {fen}\n")
    process.stdin.write(f"go depth {depth} movetime {movetime_ms}\n")
    process.stdin.flush()

    lines_by_pv: dict[int, dict] = {}
    best_move = ""
    for _ in range(800):
        line = process.stdout.readline()
        if not line:
            break
        line = line.strip()
        if line.startswith("bestmove"):
            parts = line.split()
            if len(parts) > 1:
                best_move = parts[1]
            break
        if not line.startswith("info "):
            continue
        parts = line.split()
        try:
            depth_idx = parts.index("depth")
            depth_found = int(parts[depth_idx + 1])
        except (ValueError, IndexError):
            continue
        multipv_idx = parts.index("multipv") if "multipv" in parts else -1
        if multipv_idx == -1:
            continue
        try:
            pv_index = int(parts[multipv_idx + 1])
        except (ValueError, IndexError):
            continue
        if pv_index < 1 or pv_index > multipv:
            continue

        existing = lines_by_pv.get(pv_index)
        if existing and depth_found < existing.get("depth", 0):
            continue

        cp = None
        mate = None
        if " cp " in f" {line} ":
            try:
                cp = int(parts[parts.index("cp") + 1])
            except (ValueError, IndexError):
                pass
        if " mate " in f" {line} ":
            try:
                mate = int(parts[parts.index("mate") + 1])
            except (ValueError, IndexError):
                pass
        pv: list[str] = []
        if " pv " in line:
            pv = line.split(" pv ", 1)[1].split()

        lines_by_pv[pv_index] = {
            "pv": pv[:10],
            "cp": cp,
            "mate": mate,
            "depth": depth_found,
            "multiPv": pv_index,
        }

    ordered = [lines_by_pv[i] for i in sorted(lines_by_pv) if i in lines_by_pv]
    if not ordered:
        ordered = [{"pv": [], "cp": 0, "depth": depth, "multiPv": 1}]

    pos: dict = {"lines": ordered}
    if best_move and best_move != "(none)":
        pos["bestMove"] = best_move
    return pos


def analyze_game_on_server(game: Game, depth: int = 8, movetime_ms: int = 120) -> bool:
    path = _stockfish_path()
    if not path:
        print("[voltchess-pi] server analysis skipped: STOCKFISH_PATH not set")
        return False

    fens, uci_moves = _fens_and_moves_from_pgn(game.pgn)
    if len(fens) < 2:
        return False

    print(
        f"[voltchess-pi] analyzing game {game.id} "
        f"({len(fens)} positions, depth={depth}, movetime={movetime_ms}ms)"
    )

    process = subprocess.Popen(
        [path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        bufsize=1,
    )

    try:
        process.stdin.write("uci\n")
        process.stdin.flush()
        _wait_for(process, "uciok")
        process.stdin.write("setoption name MultiPV value 2\n")
        process.stdin.write("isready\n")
        process.stdin.flush()
        _wait_for(process, "readyok")

        raw_positions = [
            _eval_fen(process, fen, depth, movetime_ms, multipv=2) for fen in fens
        ]
        positions = classify_moves(raw_positions, uci_moves, fens)
        accuracy = compute_accuracy(positions)
        white_rating = (game.white or {}).get("rating") or 1500
        black_rating = (game.black or {}).get("rating") or 1500

        GameEval.objects.update_or_create(
            game=game,
            defaults={
                "positions": positions,
                "accuracy": accuracy,
                "estimated_elo": {"white": white_rating, "black": black_rating},
                "settings": {
                    "engine": "stockfish-server",
                    "depth": depth,
                    "multiPv": 2,
                    "date": datetime.now(timezone.utc).isoformat(),
                },
            },
        )
        mark_analysis_complete(game, AnalysisSource.SERVER)
        print(f"[voltchess-pi] finished game {game.id}")
        return True
    except Exception as exc:
        print(f"[voltchess-pi] failed game {game.id}: {exc}")
        mark_analysis_failed(game)
        return False
    finally:
        try:
            process.kill()
        except Exception:
            pass


def process_server_queue(max_games: int = 3) -> dict:
    from .services import games_pending_server_analysis

    if not _stockfish_path():
        return {"processed": 0, "reason": "STOCKFISH_PATH not configured"}

    pending = games_pending_server_analysis(limit=max_games)
    if pending:
        print(f"[voltchess-pi] server queue: {len(pending)} game(s)")
    done = 0
    failed = 0
    for game in pending:
        game.analysis_source = AnalysisSource.SERVER
        game.analysis_claimed_at = datetime.now(timezone.utc)
        game.save(
            update_fields=["analysis_source", "analysis_claimed_at", "updated_at"]
        )
        if analyze_game_on_server(game):
            done += 1
        else:
            failed += 1
    return {"processed": done, "failed": failed, "attempted": len(pending)}
