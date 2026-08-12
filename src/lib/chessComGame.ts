import { Chess } from "chess.js";
import { uciMoveParams } from "@/lib/chess";

interface ChessComCallbackGame {
  pgn?: string;
  moveList?: string;
  pgnHeaders?: Record<string, string | number | undefined>;
  whiteUsername?: string;
  blackUsername?: string;
  whiteRating?: number;
  blackRating?: number;
  resultMessage?: string;
  timeControl?: string;
}

interface ChessComCallbackPayload {
  game?: ChessComCallbackGame;
  pgn?: string;
  moveList?: string;
  pgnHeaders?: Record<string, string | number | undefined>;
}

function headerLines(headers: Record<string, string | number | undefined>) {
  return Object.entries(headers)
    .filter(([, v]) => v !== undefined && v !== null && `${v}`.length > 0)
    .map(([k, v]) => `[${k} "${String(v).replace(/"/g, "")}"]`)
    .join("\n");
}

/** Chess.com moveList is concatenated UCI: e2e4e7e5g1f3… */
export function chessComMoveListToSanPgn(
  moveList: string,
  headers: Record<string, string | number | undefined> = {}
): string {
  const chess = new Chess();
  const tokens = moveList.match(/[a-h][1-8][a-h][1-8][qrbn]?/gi) ?? [];
  for (const uci of tokens) {
    try {
      chess.move(uciMoveParams(uci));
    } catch {
      break;
    }
  }

  for (const [k, v] of Object.entries(headers)) {
    if (v !== undefined && v !== null && `${v}`.length > 0) {
      chess.setHeader(k, String(v));
    }
  }
  if (!chess.getHeaders().Event) chess.setHeader("Event", "Chess.com Game");
  if (!chess.getHeaders().Site) chess.setHeader("Site", "Chess.com");
  return chess.pgn();
}

export function pgnFromChessComCallback(
  payload: ChessComCallbackPayload
): string {
  const game: ChessComCallbackGame = payload.game ?? payload;
  if (typeof game.pgn === "string" && game.pgn.includes("[")) {
    return game.pgn;
  }

  const headers: Record<string, string | number | undefined> = {
    Event: "Chess.com Game",
    Site: "Chess.com",
    ...(game.pgnHeaders ?? {}),
  };
  if (!headers.White && game.whiteUsername) headers.White = game.whiteUsername;
  if (!headers.Black && game.blackUsername) headers.Black = game.blackUsername;
  if (!headers.WhiteElo && game.whiteRating)
    headers.WhiteElo = game.whiteRating;
  if (!headers.BlackElo && game.blackRating)
    headers.BlackElo = game.blackRating;
  if (!headers.Result && game.resultMessage)
    headers.Result = game.resultMessage;
  if (!headers.TimeControl && game.timeControl) {
    headers.TimeControl = game.timeControl;
  }

  if (typeof game.moveList === "string" && game.moveList.length >= 4) {
    return chessComMoveListToSanPgn(game.moveList, headers);
  }

  if (typeof game.pgn === "string" && game.pgn.trim()) {
    return `${headerLines(headers)}\n\n${game.pgn}\n`;
  }

  throw new Error("Chess.com response did not include moves");
}

export async function fetchChessComGamePgn(
  gameId: string,
  gameType: "live" | "daily" = "live",
  signal?: AbortSignal
): Promise<string> {
  const endpoints = [
    `https://www.chess.com/callback/${gameType}/game/${gameId}`,
    `https://www.chess.com/callback/live/game/${gameId}`,
    `https://www.chess.com/callback/daily/game/${gameId}`,
  ];

  let lastError: Error | null = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        lastError = new Error(`Chess.com HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as ChessComCallbackPayload;
      return pgnFromChessComCallback(data);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error("Could not fetch Chess.com game");
}
