"""Fetch recent games from Chess.com and Lichess public APIs."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import requests

SYNC_GAME_LIMIT = 30
REQUEST_TIMEOUT = 25

# Chess.com's public API is fronted by Cloudflare, which returns 403 ("Just a
# moment…") for requests that do not send a real User-Agent. Lichess also asks
# integrations to identify themselves. Always send a descriptive UA so imports
# don't silently fail with "user not found".
USER_AGENT = "VoltChess/1.0 (+https://voltchess.me; chess analysis academy)"


def _get(url: str, *, headers: dict | None = None) -> requests.Response:
    merged = {"User-Agent": USER_AGENT}
    if headers:
        merged.update(headers)
    return requests.get(url, headers=merged, timeout=REQUEST_TIMEOUT)


@dataclass
class FetchedGame:
    external_id: str
    external_url: str
    pgn: str
    event: str
    site: str
    date: str
    round: str
    white: dict
    black: dict
    result: str
    termination: str
    time_control: str
    source: str
    played_at: datetime | None


def _pgn_header(pgn: str, key: str) -> str:
    match = re.search(rf'\[{re.escape(key)} "(.*?)"\]', pgn)
    return match.group(1) if match else ""


def _parse_chesscom_game(raw: dict) -> FetchedGame | None:
    pgn = raw.get("pgn") or ""
    if not pgn:
        return None
    external_id = raw.get("uuid") or ""
    if not external_id and raw.get("url"):
        external_id = str(raw["url"]).rstrip("/").split("/")[-1]
    if not external_id:
        return None

    end_time = raw.get("end_time")
    played_at = (
        datetime.fromtimestamp(end_time, tz=timezone.utc) if end_time else None
    )

    return FetchedGame(
        external_id=external_id,
        external_url=raw.get("url") or "",
        pgn=pgn,
        event=_pgn_header(pgn, "Event"),
        site=_pgn_header(pgn, "Site") or "Chess.com",
        date=_pgn_header(pgn, "Date"),
        round=_pgn_header(pgn, "Round"),
        white={
            "name": (raw.get("white") or {}).get("username", "White"),
            "rating": (raw.get("white") or {}).get("rating", 0),
            "title": (raw.get("white") or {}).get("title"),
        },
        black={
            "name": (raw.get("black") or {}).get("username", "Black"),
            "rating": (raw.get("black") or {}).get("rating", 0),
            "title": (raw.get("black") or {}).get("title"),
        },
        result=_pgn_header(pgn, "Result"),
        termination=_pgn_header(pgn, "Termination"),
        time_control=_pgn_header(pgn, "TimeControl"),
        source="chesscom",
        played_at=played_at,
    )


def fetch_chesscom_games(username: str, limit: int = SYNC_GAME_LIMIT) -> list[FetchedGame]:
    username = username.strip().lower()

    # Resolve the player's monthly archives instead of guessing the current /
    # previous month: a player who hasn't played recently still imports their
    # latest games, and empty months don't surface as spurious 404s.
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    archives_resp = _get(archives_url)
    if archives_resp.status_code == 404:
        raise ValueError(f"Chess.com user '{username}' not found.")
    if archives_resp.status_code >= 400:
        raise ValueError(
            f"Chess.com is unavailable right now (status {archives_resp.status_code})."
        )

    archives = (archives_resp.json() if archives_resp.content else {}).get(
        "archives"
    ) or []

    games: list[dict] = []
    # Newest month first; stop once we have enough games.
    for archive_url in reversed(archives):
        if len(games) >= limit:
            break
        resp = _get(archive_url)
        if resp.status_code >= 400:
            continue
        data = resp.json() if resp.content else {}
        month_games = data.get("games") or []
        games.extend(month_games)

    parsed: list[FetchedGame] = []
    for raw in sorted(games, key=lambda g: g.get("end_time") or 0, reverse=True):
        item = _parse_chesscom_game(raw)
        if item:
            parsed.append(item)
        if len(parsed) >= limit:
            break
    return parsed


def _parse_lichess_game(raw: dict) -> FetchedGame | None:
    pgn = raw.get("pgn") or ""
    if not pgn:
        return None
    external_id = raw.get("id") or raw.get("gameId") or ""
    if not external_id:
        return None

    played_at = None
    if raw.get("lastMoveAt"):
        played_at = datetime.fromtimestamp(raw["lastMoveAt"] / 1000, tz=timezone.utc)
    elif raw.get("createdAt"):
        played_at = datetime.fromtimestamp(raw["createdAt"] / 1000, tz=timezone.utc)

    players = raw.get("players") or {}
    white = players.get("white") or {}
    black = players.get("black") or {}

    return FetchedGame(
        external_id=external_id,
        external_url=f"https://lichess.org/{external_id}",
        pgn=pgn,
        event=_pgn_header(pgn, "Event"),
        site="lichess.org",
        date=_pgn_header(pgn, "Date"),
        round=_pgn_header(pgn, "Round"),
        white={
            "name": (white.get("user") or {}).get("name") or white.get("name") or "White",
            "rating": white.get("rating") or 0,
            "title": (white.get("user") or {}).get("title"),
        },
        black={
            "name": (black.get("user") or {}).get("name") or black.get("name") or "Black",
            "rating": black.get("rating") or 0,
            "title": (black.get("user") or {}).get("title"),
        },
        result=_pgn_header(pgn, "Result"),
        termination=_pgn_header(pgn, "Termination"),
        time_control=_pgn_header(pgn, "TimeControl"),
        source="lichess",
        played_at=played_at,
    )


def fetch_lichess_games(username: str, limit: int = SYNC_GAME_LIMIT) -> list[FetchedGame]:
    username = username.strip()
    url = (
        f"https://lichess.org/api/games/user/{username}"
        f"?max={limit}&pgnInJson=true&sort=dateDesc&clocks=true"
    )
    resp = _get(url, headers={"Accept": "application/x-ndjson"})
    if resp.status_code == 404:
        raise ValueError(f"Lichess user '{username}' not found.")
    if resp.status_code >= 400:
        raise ValueError(
            f"Lichess is unavailable right now (status {resp.status_code})."
        )

    parsed: list[FetchedGame] = []
    for line in resp.text.split("\n"):
        line = line.strip()
        if not line:
            continue
        raw = json.loads(line)
        item = _parse_lichess_game(raw)
        if item:
            parsed.append(item)
    return parsed[:limit]


def fetch_platform_games(platform: str, username: str, limit: int = SYNC_GAME_LIMIT) -> list[FetchedGame]:
    if platform == "chesscom":
        return fetch_chesscom_games(username, limit)
    if platform == "lichess":
        return fetch_lichess_games(username, limit)
    raise ValueError(f"Unsupported platform: {platform}")
