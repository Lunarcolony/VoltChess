/* global Chess */
import { Chess } from "./vendor-chess.js";

const DEFAULT_ANALYZER_URL = "https://voltchess.vercel.app";

async function getAnalyzerBase() {
  try {
    const stored = await chrome.storage.sync.get(["analyzerUrl"]);
    const url = (stored.analyzerUrl || DEFAULT_ANALYZER_URL).replace(/\/$/, "");
    return url || DEFAULT_ANALYZER_URL;
  } catch {
    return DEFAULT_ANALYZER_URL;
  }
}

function encodePgnForUrl(pgn) {
  const bytes = new TextEncoder().encode(pgn);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

async function openAnalysisWithPgn(pgn, orientation) {
  const base = await getAnalyzerBase();
  const params = new URLSearchParams({ pgn: encodePgnForUrl(pgn) });
  if (orientation === "black") params.set("orientation", "black");
  await chrome.tabs.create({ url: `${base}/analysis?${params.toString()}` });
}

function uciMoveParams(uci) {
  const move = {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
  };
  if (uci.length > 4) move.promotion = uci[4].toLowerCase();
  return move;
}

function pgnFromMoveList(moveList, headers = {}) {
  const chess = new Chess();
  const tokens = moveList.match(/[a-h][1-8][a-h][1-8][qrbn]?/gi) || [];
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

function buildPgnFromCallback(payload) {
  const game = payload.game || payload;
  if (typeof game.pgn === "string" && game.pgn.includes("[")) {
    return game.pgn;
  }

  const rawHeaders = game.pgnHeaders || game.headers || {};
  const headers = {
    Event: rawHeaders.Event || "Chess.com Game",
    Site: rawHeaders.Site || "Chess.com",
    Date: rawHeaders.Date || "????.??.??",
    White: rawHeaders.White || game.whiteUsername || "White",
    Black: rawHeaders.Black || game.blackUsername || "Black",
    Result: rawHeaders.Result || "*",
    WhiteElo: rawHeaders.WhiteElo || game.whiteRating,
    BlackElo: rawHeaders.BlackElo || game.blackRating,
    TimeControl: rawHeaders.TimeControl || game.timeControl,
    ECO: rawHeaders.ECO,
    Opening: rawHeaders.Opening,
    ...rawHeaders,
  };

  if (typeof game.moveList === "string" && game.moveList.length >= 4) {
    return pgnFromMoveList(game.moveList, headers);
  }

  if (typeof game.pgn === "string" && game.pgn.trim()) {
    const chess = new Chess();
    try {
      chess.loadPgn(
        Object.entries(headers)
          .filter(([, v]) => v !== undefined && v !== null && `${v}`.length)
          .map(([k, v]) => `[${k} "${String(v).replace(/"/g, "")}"]`)
          .join("\n") +
          "\n\n" +
          game.pgn
      );
      return chess.pgn();
    } catch {
      return (
        Object.entries(headers)
          .filter(([, v]) => v !== undefined && v !== null && `${v}`.length)
          .map(([k, v]) => `[${k} "${String(v).replace(/"/g, "")}"]`)
          .join("\n") +
        "\n\n" +
        game.pgn +
        "\n"
      );
    }
  }

  return null;
}

async function fetchChessComGamePgn(gameId, gameType) {
  const type = gameType === "daily" ? "daily" : "live";
  const endpoints = [
    `https://www.chess.com/callback/${type}/game/${gameId}`,
    `https://www.chess.com/callback/live/game/${gameId}`,
    `https://www.chess.com/callback/daily/game/${gameId}`,
  ];

  let lastError;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const pgn = buildPgnFromCallback(data);
      if (pgn) return pgn;
      lastError = new Error("Empty PGN from Chess.com callback");
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Could not fetch Chess.com game");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "ANALYZE_CHESSCOM") {
        const pgn = await fetchChessComGamePgn(
          message.gameId,
          message.gameType
        );
        await openAnalysisWithPgn(pgn, message.orientation);
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "ANALYZE_PGN") {
        await openAnalysisWithPgn(message.pgn, message.orientation);
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "GET_ANALYZER_URL") {
        sendResponse({ ok: true, url: await getAnalyzerBase() });
        return;
      }
      sendResponse({ ok: false, error: "Unknown message type" });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();
  return true;
});
