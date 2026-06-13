import { Chess } from "chess.js";
import { openDB } from "idb";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { formatGameToDatabase } from "@/lib/chess";
import {
  bulkUploadGames,
  createGame,
  uploadGameEval,
  type ServerGameDetail,
} from "@/lib/api/games";
import type { GameEval } from "@/types/eval";
import type { Game } from "@/types/game";

const MAP_KEY = "voltchess-server-game-map";
const MIGRATED_KEY = "voltchess-games-migrated";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isServerGameId(id: string): boolean {
  return UUID_RE.test(id);
}

function readMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function getServerIdForLocal(localId: number): string | undefined {
  return readMap()[String(localId)];
}

export function setServerIdForLocal(localId: number, serverId: string) {
  const map = readMap();
  map[String(localId)] = serverId;
  writeMap(map);
}

export function hasMigratedLocalGames(): boolean {
  return localStorage.getItem(MIGRATED_KEY) === "true";
}

export function markLocalGamesMigrated() {
  localStorage.setItem(MIGRATED_KEY, "true");
}

function gamePayloadFromChess(chess: Chess) {
  const formatted = formatGameToDatabase(chess);
  return {
    pgn: formatted.pgn,
    event: formatted.event,
    site: formatted.site,
    date: formatted.date,
    round: formatted.round,
    white: formatted.white,
    black: formatted.black,
    result: formatted.result,
    termination: formatted.termination,
    time_control: formatted.timeControl,
    source: "upload",
  };
}

function evalPayload(evalData: GameEval) {
  return {
    positions: evalData.positions,
    accuracy: evalData.accuracy,
    estimated_elo: evalData.estimatedElo,
    settings: evalData.settings,
  };
}

export async function ensureGameOnServer(
  chess: Chess,
  localId?: number
): Promise<string | undefined> {
  if (!ENABLE_AUTHENTICATION) return undefined;

  if (localId != null) {
    const existing = getServerIdForLocal(localId);
    if (existing) return existing;
  }

  const created = await createGame(gamePayloadFromChess(chess));
  if (localId != null) {
    setServerIdForLocal(localId, created.id);
  }
  return created.id;
}

export async function syncEvalToServer(
  serverId: string,
  evalData: GameEval
): Promise<void> {
  if (!ENABLE_AUTHENTICATION) return;
  await uploadGameEval(
    serverId,
    evalPayload(evalData) as unknown as Parameters<typeof uploadGameEval>[1]
  );
}

export async function syncAnalysisResult(
  chess: Chess,
  evalData: GameEval,
  localId?: number,
  serverId?: string
): Promise<string | undefined> {
  if (!ENABLE_AUTHENTICATION) return undefined;

  let id = serverId ?? (localId != null ? getServerIdForLocal(localId) : undefined);
  if (!id) {
    id = await ensureGameOnServer(chess, localId);
  }
  if (id) {
    await syncEvalToServer(id, evalData);
  }
  return id;
}

export async function migrateLocalGamesToServer(): Promise<number> {
  if (!ENABLE_AUTHENTICATION) return 0;

  const db = await openDB("games", 1);
  const localGames = (await db.getAll("games")) as Game[];
  if (!localGames.length) {
    markLocalGamesMigrated();
    return 0;
  }

  const payload = localGames.map((g) => {
    const chess = new Chess();
    chess.loadPgn(g.pgn);
    return {
      ...gamePayloadFromChess(chess),
      eval: g.eval ? evalPayload(g.eval) : undefined,
    };
  });

  const result = await bulkUploadGames(payload);
  localGames.forEach((g, idx) => {
    const serverId = result.created[idx];
    if (serverId && g.id) {
      setServerIdForLocal(g.id, serverId);
    }
  });

  markLocalGamesMigrated();
  return result.created.length;
}

export function serverGameToSession(game: ServerGameDetail) {
  return {
    serverId: game.id,
    pgn: game.pgn,
    eval: game.eval
      ? {
          positions: game.eval.positions,
          accuracy: game.eval.accuracy,
          estimatedElo: game.eval.estimated_elo,
          settings: game.eval.settings,
        }
      : undefined,
    white: game.white,
    black: game.black,
  };
}
