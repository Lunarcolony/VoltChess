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

async function openAnalysisWithChessComId(gameId, gameType, orientation) {
  const base = await getAnalyzerBase();
  const params = new URLSearchParams({
    chesscomGame: gameId,
    chesscomType: gameType === "daily" ? "daily" : "live",
  });
  if (orientation === "black") params.set("orientation", "black");
  await chrome.tabs.create({ url: `${base}/analysis?${params.toString()}` });
}

function buildPgnFromCallback(payload) {
  const game = payload.game || payload;
  if (typeof game.pgn === "string" && game.pgn.includes("[")) {
    return game.pgn;
  }

  const headers = game.pgnHeaders || game.headers || {};
  const lines = [];
  const put = (k, v) => {
    if (v !== undefined && v !== null && `${v}`.length) {
      lines.push(`[${k} "${String(v).replace(/"/g, "")}"]`);
    }
  };

  put("Event", headers.Event || "Chess.com Game");
  put("Site", headers.Site || "Chess.com");
  put("Date", headers.Date || "????.??.??");
  put("White", headers.White || game.whiteUsername || "White");
  put("Black", headers.Black || game.blackUsername || "Black");
  put("Result", headers.Result || "*");
  put("WhiteElo", headers.WhiteElo || game.whiteRating);
  put("BlackElo", headers.BlackElo || game.blackRating);
  put("TimeControl", headers.TimeControl || game.timeControl);
  put("ECO", headers.ECO);
  put("Opening", headers.Opening);

  // Prefer letting the web app parse moveList via chesscomGame param.
  // If we already have a SAN/PGN body, use it.
  if (typeof game.pgn === "string" && game.pgn.trim()) {
    return `${lines.join("\n")}\n\n${game.pgn}\n`;
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

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const pgn = buildPgnFromCallback(data);
      if (pgn) return pgn;
    } catch {
      /* try next */
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "ANALYZE_CHESSCOM") {
        const pgn = await fetchChessComGamePgn(
          message.gameId,
          message.gameType
        );
        if (pgn) {
          await openAnalysisWithPgn(pgn, message.orientation);
        } else {
          // Fallback: web app fetches + converts moveList with chess.js
          await openAnalysisWithChessComId(
            message.gameId,
            message.gameType,
            message.orientation
          );
        }
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
