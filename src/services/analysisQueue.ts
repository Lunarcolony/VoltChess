import { Chess } from "chess.js";
import { SYNC_ANALYSIS_DEFAULTS } from "@/constants/engineDefaults";
import { getEvaluateGameParams } from "@/lib/chess";
import { Stockfish17 } from "@/lib/engine/stockfish17";
import type { UciEngine } from "@/lib/engine/uciEngine";
import type { ServerGameDetail } from "@/lib/api/games";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  claimGameAnalysis,
  completeGameAnalysis,
  fetchPendingAnalysis,
  processServerAnalysisQueue,
  releaseGameAnalysis,
} from "@/lib/api/sync";
import { debug } from "@/lib/debug";
import {
  markAnalysisStart,
  recordGameAnalyzed,
  recordQueueEvent,
} from "@/lib/telemetry";

export type QueuePhase =
  | "idle"
  | "loading_engine"
  | "analyzing"
  | "error"
  | "done";

export type QueueState = {
  phase: QueuePhase;
  message: string;
  gamesDone: number;
  error: string | null;
  running: boolean;
};

type Listener = (state: QueueState) => void;

let engine: UciEngine | null = null;
let engineLoadPromise: Promise<UciEngine> | null = null;
let activeJobId = 0;

let state: QueueState = {
  phase: "idle",
  message: "",
  gamesDone: 0,
  error: null,
  running: false,
};

const listeners = new Set<Listener>();

function emit() {
  const snap = { ...state };
  listeners.forEach((fn) => fn(snap));
}

function patch(partial: Partial<QueueState>) {
  state = { ...state, ...partial };
  debug.log("queue", "state patch", partial as Record<string, unknown>);
  emit();
}

function formatQueueError(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return getApiErrorMessage(err);
}

export function getQueueState(): QueueState {
  return { ...state };
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

async function loadEngine(): Promise<UciEngine> {
  if (engine?.getIsReady()) return engine;

  if (!engineLoadPromise) {
    debug.log("queue", "loading Stockfish engine");
    patch({
      phase: "loading_engine",
      running: true,
      error: null,
      message: "Loading Stockfish engine…",
    });
    engineLoadPromise = Stockfish17.create(true).then((eng) => {
      engine = eng;
      debug.log("queue", "Stockfish engine ready");
      return eng;
    });
  }

  try {
    return await engineLoadPromise;
  } catch (err) {
    engineLoadPromise = null;
    const msg = formatQueueError(err);
    patch({ phase: "error", running: false, error: msg, message: msg });
    throw err;
  }
}

async function analyzeOne(game: ServerGameDetail): Promise<void> {
  const eng = await loadEngine();
  const label = `${game.white?.name ?? "?"} vs ${game.black?.name ?? "?"}`;

  patch({
    phase: "analyzing",
    running: true,
    error: null,
    message: `Analyzing ${label}…`,
  });

  debug.log("queue", "analyzeOne start", { gameId: game.id, label });

  const chess = new Chess();
  chess.loadPgn(game.pgn);
  const params = getEvaluateGameParams(chess);

  markAnalysisStart();

  const evalResult = await eng.evaluateGame({
    ...params,
    depth: SYNC_ANALYSIS_DEFAULTS.depth,
    multiPv: SYNC_ANALYSIS_DEFAULTS.multiPv,
    workersNb: SYNC_ANALYSIS_DEFAULTS.workers,
    setEvaluationProgress: (pct) => {
      patch({ message: `Analyzing ${label}… ${Math.round(pct)}%` });
    },
    playersRatings: {
      white: game.white?.rating,
      black: game.black?.rating,
    },
  });

  await completeGameAnalysis(game.id, {
    positions: evalResult.positions,
    accuracy: evalResult.accuracy,
    estimated_elo: evalResult.estimatedElo ?? null,
    settings: evalResult.settings as unknown as Record<string, unknown>,
  });

  recordGameAnalyzed({
    engine: "Stockfish17",
    depth: SYNC_ANALYSIS_DEFAULTS.depth,
    multiPv: SYNC_ANALYSIS_DEFAULTS.multiPv,
    workers: SYNC_ANALYSIS_DEFAULTS.workers,
    nbPositions: params.fens.length,
    accuracy: evalResult.accuracy ?? null,
    estimatedElo: evalResult.estimatedElo ?? null,
    source: "queue",
    serverGameId: game.id,
    reanalyze: false,
  });
  recordQueueEvent("queue_game_complete", { gameId: game.id });

  debug.log("queue", "analyzeOne complete", { gameId: game.id, label });
}

async function claimNext(
  priorityId?: string
): Promise<ServerGameDetail | null> {
  if (priorityId) {
    debug.log("queue", "claimNext — trying priority game", { priorityId });
    try {
      return await claimGameAnalysis(priorityId);
    } catch (err) {
      debug.warn("queue", "claimNext — priority claim failed", {
        priorityId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  let pending: ServerGameDetail[];
  try {
    debug.log("queue", "claimNext — fetching pending list");
    pending = await fetchPendingAnalysis(1);
  } catch (err) {
    throw new Error(formatQueueError(err));
  }

  const game = pending[0];
  if (!game?.pgn) {
    debug.log("queue", "claimNext — no pending games");
    return null;
  }

  try {
    debug.log("queue", "claimNext — claiming game", { gameId: game.id });
    return await claimGameAnalysis(game.id);
  } catch (err) {
    debug.warn("queue", "claimNext — claim failed", {
      gameId: game.id,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export type RunQueueOptions = {
  priorityGameId?: string;
  maxGames?: number;
};

/**
 * Analyze pending synced games one at a time. Safe to call from UI buttons —
 * only one job runs at a time (new calls are ignored while running).
 */
export async function runAnalysisQueue(
  opts: RunQueueOptions = {}
): Promise<{ gamesDone: number; error?: string }> {
  if (state.running) {
    debug.log("queue", "runAnalysisQueue — already running, ignoring");
    return { gamesDone: 0, error: "Analysis already in progress" };
  }

  const jobId = ++activeJobId;
  const maxGames = opts.maxGames ?? 30;
  let gamesDone = 0;
  let priorityId = opts.priorityGameId;

  debug.log("queue", "runAnalysisQueue — job started", {
    jobId,
    maxGames,
    priorityId,
  });

  recordQueueEvent("queue_started", { maxGames, priorityId });

  patch({
    running: true,
    error: null,
    gamesDone: 0,
    phase: "loading_engine",
    message: "Starting analysis…",
  });

  try {
    await loadEngine();

    while (gamesDone < maxGames && jobId === activeJobId) {
      const game = await claimNext(priorityId);
      priorityId = undefined;

      if (!game) break;

      try {
        await analyzeOne(game);
        gamesDone += 1;
        patch({ gamesDone });
      } catch (err) {
        debug.warn("queue", "analyzeOne failed — releasing claim", {
          gameId: game.id,
          message: err instanceof Error ? err.message : String(err),
        });
        await releaseGameAnalysis(game.id).catch(() => {});
        throw err;
      }
    }

    const message =
      gamesDone > 0
        ? `Analyzed ${gamesDone} game${gamesDone === 1 ? "" : "s"}`
        : "No games waiting for analysis";

    debug.log("queue", "runAnalysisQueue — job finished OK", {
      jobId,
      gamesDone,
      message,
    });

    recordQueueEvent("queue_done", { gamesDone });

    patch({
      phase: gamesDone > 0 ? "done" : "idle",
      running: false,
      message,
      error: null,
    });

    return { gamesDone };
  } catch (err) {
    const msg = formatQueueError(err);
    debug.error("queue", "runAnalysisQueue — browser queue failed", {
      jobId,
      message: msg,
    });

    let serverDone = 0;
    try {
      debug.log("queue", "runAnalysisQueue — trying Pi server fallback");
      patch({
        phase: "analyzing",
        message: "Browser failed — trying Pi server fallback…",
        error: null,
      });
      const serverResult = await processServerAnalysisQueue(3);
      serverDone = serverResult.processed ?? 0;
      if (serverDone > 0) {
        const doneMsg = `Pi analyzed ${serverDone} game${serverDone === 1 ? "" : "s"}`;
        debug.log("queue", "runAnalysisQueue — Pi fallback succeeded", {
          serverDone,
        });
        patch({
          phase: "done",
          running: false,
          gamesDone: gamesDone + serverDone,
          error: null,
          message: doneMsg,
        });
        return { gamesDone: gamesDone + serverDone };
      }
    } catch (serverErr) {
      debug.warn("queue", "runAnalysisQueue — Pi fallback failed", {
        message:
          serverErr instanceof Error ? serverErr.message : String(serverErr),
      });
    }

    patch({
      phase: "error",
      running: false,
      error: msg,
      message: msg,
    });
    return { gamesDone, error: msg };
  }
}

export function isQueueRunning(): boolean {
  return state.running;
}
