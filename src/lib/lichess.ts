import { Chess, DEFAULT_POSITION } from "chess.js";
import { LineEval, PositionEval } from "@/types/eval";
import { sortLines } from "./engine/helpers/parseResults";
import {
  LichessDailyPuzzleResponse,
  LichessError,
  LichessEvalBody,
  LichessGame,
  LichessResponse,
} from "@/types/lichess";
import { logErrorToSentry } from "./sentry";
import { formatUciPv } from "./chess";
import { LoadedGame } from "@/types/game";

export interface DailyPuzzle {
  id: string;
  fen: string;
  rating: number;
  themes: string[];
  /** UCI moves: player move, opponent reply, player move, … */
  solution: string[];
  description: string;
}

/** Fetch Lichess's puzzle of the day and resolve it to a starting FEN + solution. */
export const fetchLichessDailyPuzzle = async (
  signal?: AbortSignal
): Promise<DailyPuzzle | null> => {
  try {
    const res = await fetch("https://lichess.org/api/puzzle/daily", {
      method: "GET",
      signal,
    });
    if (!res.ok) return null;

    const data: LichessDailyPuzzleResponse = await res.json();
    if (!data?.puzzle?.solution?.length || !data.game?.pgn) return null;

    // The API's game.pgn ends exactly at the puzzle position: the player to
    // move plays solution[0]. (Deriving the FEN from initialPly lands one ply
    // early and makes the solution illegal.)
    const chess = new Chess();
    chess.loadPgn(data.game.pgn);
    const fen = chess.history().length > 0 ? chess.fen() : DEFAULT_POSITION;

    // Sanity check: the first solution move must be legal from this position.
    const probe = new Chess(fen);
    try {
      const uci = data.puzzle.solution[0];
      probe.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4]?.toLowerCase(),
      });
    } catch {
      return null;
    }

    return {
      id: `lichess-daily-${data.puzzle.id}`,
      fen,
      rating: data.puzzle.rating,
      themes: data.puzzle.themes,
      solution: data.puzzle.solution,
      description: `Lichess Puzzle of the Day${
        data.puzzle.themes.length ? ` — ${data.puzzle.themes[0]}` : ""
      }`,
    };
  } catch (error) {
    logErrorToSentry(error, { source: "fetchLichessDailyPuzzle" });
    return null;
  }
};

export const getLichessEval = async (
  fen: string,
  multiPv = 1
): Promise<PositionEval> => {
  try {
    const data = await fetchLichessEval(fen, multiPv);

    if ("error" in data) {
      if (data.error === LichessError.NotFound) {
        return {
          bestMove: "",
          lines: [],
        };
      }
      throw new Error(data.error);
    }

    const lines: LineEval[] = data.pvs.map((pv, index) => ({
      pv: formatUciPv(fen, pv.moves.split(" ")),
      cp: pv.cp,
      mate: pv.mate,
      depth: data.depth,
      multiPv: index + 1,
    }));

    lines.sort(sortLines);
    const isWhiteToPlay = fen.split(" ")[1] === "w";
    if (!isWhiteToPlay) lines.reverse();

    const bestMove = lines[0].pv[0];
    const linesToKeep = lines.slice(0, multiPv);

    return {
      bestMove,
      lines: linesToKeep,
    };
  } catch (error) {
    logErrorToSentry(error, { fen, multiPv });

    return {
      bestMove: "",
      lines: [],
    };
  }
};

export const getLichessUserRecentGames = async (
  username: string,
  signal?: AbortSignal
): Promise<LoadedGame[]> => {
  const usernameParam = encodeURIComponent(username.trim());
  const res = await fetch(
    `https://lichess.org/api/games/user/${usernameParam}?until=${Date.now()}&max=50&pgnInJson=true&sort=dateDesc&clocks=true`,
    { method: "GET", headers: { accept: "application/x-ndjson" }, signal }
  );

  if (res.status >= 400) {
    throw new Error("Error fetching games from Lichess");
  }

  const rawData = await res.text();
  const games: LichessGame[] = rawData
    .split("\n")
    .filter((game) => game.length > 0)
    .map((game) => JSON.parse(game));

  return games.map(formatLichessGame);
};

const fetchLichessEval = async (
  fen: string,
  multiPv: number
): Promise<LichessResponse<LichessEvalBody>> => {
  try {
    const res = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${fen}&multiPv=${multiPv}`,
      { method: "GET", signal: AbortSignal.timeout(200) }
    );

    return res.json();
  } catch (error) {
    console.error(error);

    return { error: LichessError.NotFound };
  }
};

const formatLichessGame = (data: LichessGame): LoadedGame => {
  return {
    id: data.id,
    pgn: data.pgn || "",
    white: {
      name: data.players.white.user?.name || "White",
      rating: data.players.white.rating,
      title: data.players.white.user?.title,
    },
    black: {
      name: data.players.black.user?.name || "Black",
      rating: data.players.black.rating,
      title: data.players.black.user?.title,
    },
    result: getGameResult(data),
    timeControl: `${Math.floor(data.clock?.initial / 60 || 0)}+${data.clock?.increment || 0}`,
    timeClass: data.speed,
    date: new Date(data.createdAt || data.lastMoveAt).toLocaleDateString(),
    movesNb: data.moves?.split(" ").length || 0,
    url: `https://lichess.org/${data.id}`,
  };
};

const getGameResult = (data: LichessGame): string => {
  if (data.status === "draw") return "1/2-1/2";

  if (data.winner) return data.winner === "white" ? "1-0" : "0-1";

  return "*";
};
