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

const LOG = "[voltchess-queue]";

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
    patch({
      phase: "loading_engine",
      running: true,
      error: null,
      message: "Loading Stockfish engine…",
    });
    engineLoadPromise = Stockfish17.create(true).then((eng) => {
      engine = eng;
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

  console.log(`${LOG} ${label}`);

  const chess = new Chess();
  chess.loadPgn(game.pgn);
  const params = getEvaluateGameParams(chess);

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

  console.log(`${LOG} finished ${label}`);
}

async function claimNext(
  priorityId?: string
): Promise<ServerGameDetail | null> {
  if (priorityId) {
    try {
      return await claimGameAnalysis(priorityId);
    } catch (err) {
      console.warn(`${LOG} could not claim ${priorityId}`, err);
    }
  }

  let pending: ServerGameDetail[];
  try {
    pending = await fetchPendingAnalysis(1);
  } catch (err) {
    throw new Error(formatQueueError(err));
  }

  const game = pending[0];
  if (!game?.pgn) return null;

  try {
    return await claimGameAnalysis(game.id);
  } catch (err) {
    console.warn(`${LOG} could not claim ${game.id}`, err);
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
    console.debug(`${LOG} already running`);
    return { gamesDone: 0, error: "Analysis already in progress" };
  }

  const jobId = ++activeJobId;
  const maxGames = opts.maxGames ?? 30;
  let gamesDone = 0;
  let priorityId = opts.priorityGameId;

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
        await releaseGameAnalysis(game.id).catch(() => {});
        throw err;
      }
    }

    const message =
      gamesDone > 0
        ? `Analyzed ${gamesDone} game${gamesDone === 1 ? "" : "s"}`
        : "No games waiting for analysis";

    patch({
      phase: gamesDone > 0 ? "done" : "idle",
      running: false,
      message,
      error: null,
    });

    return { gamesDone };
  } catch (err) {
    const msg = formatQueueError(err);
    console.error(`${LOG} browser queue failed:`, err);

    let serverDone = 0;
    try {
      patch({
        phase: "analyzing",
        message: "Browser failed — trying Pi server fallback…",
        error: null,
      });
      const serverResult = await processServerAnalysisQueue(3);
      serverDone = serverResult.processed ?? 0;
      if (serverDone > 0) {
        const doneMsg = `Pi analyzed ${serverDone} game${serverDone === 1 ? "" : "s"}`;
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
      console.warn(`${LOG} server fallback failed:`, serverErr);
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
