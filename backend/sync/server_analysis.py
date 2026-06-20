"""Server-side Stockfish analysis when the student browser is unavailable."""

from __future__ import annotations

import io
import os
import subprocess
from datetime import datetime, timezone

import chess.pgn
from django.conf import settings

from games.models import AnalysisSource, Game, GameEval

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


def _fens_from_pgn(pgn_text: str) -> list[str]:
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        return []
    board = game.board()
    fens = [board.fen()]
    for move in game.mainline_moves():
        board.push(move)
        fens.append(board.fen())
    return fens


def _eval_fen(process: subprocess.Popen, fen: str, depth: int, movetime_ms: int) -> dict:
    process.stdin.write(f"position fen {fen}\n")
    process.stdin.write(f"go depth {depth} movetime {movetime_ms}\n")
    process.stdin.flush()

    cp = 0
    pv: list[str] = []
    depth_found = depth
    for _ in range(500):
        line = process.stdout.readline()
        if not line:
            break
        line = line.strip()
        if line.startswith("info ") and " score cp " in line:
            parts = line.split()
            try:
                cp = int(parts[parts.index("cp") + 1])
            except (ValueError, IndexError):
                pass
            if " pv " in line:
                pv = line.split(" pv ", 1)[1].split()
            if " depth " in line:
                try:
                    depth_found = int(parts[parts.index("depth") + 1])
                except (ValueError, IndexError):
                    pass
        if line.startswith("bestmove"):
            break

    return {
        "bestMove": pv[0] if pv else "",
        "lines": [{"pv": pv[:10], "cp": cp, "depth": depth_found, "multiPv": 1}],
    }


def analyze_game_on_server(game: Game, depth: int = 4, movetime_ms: int = 80) -> bool:
    path = _stockfish_path()
    if not path:
        print("[voltchess-pi] server analysis skipped: STOCKFISH_PATH not set")
        return False

    fens = _fens_from_pgn(game.pgn)
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
        for _ in range(50):
            line = process.stdout.readline()
            if "uciok" in line:
                break
        process.stdin.write("isready\n")
        process.stdin.flush()
        for _ in range(50):
            line = process.stdout.readline()
            if "readyok" in line:
                break

        positions = [_eval_fen(process, fen, depth, movetime_ms) for fen in fens]
        white_rating = (game.white or {}).get("rating") or 1500
        black_rating = (game.black or {}).get("rating") or 1500

        GameEval.objects.update_or_create(
            game=game,
            defaults={
                "positions": positions,
                "accuracy": {"white": 0, "black": 0},
                "estimated_elo": {"white": white_rating, "black": black_rating},
                "settings": {
                    "engine": "stockfish-server",
                    "depth": depth,
                    "multiPv": 1,
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
        print(f"[voltchess-pi] server queue: {len(pending)} game(s) (manual/cron only)")
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
