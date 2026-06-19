import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { ENGINE_DEFAULTS } from "@/constants/engineDefaults";
import { useEngine } from "@/hooks/useEngine";
import { getEvaluateGameParams } from "@/lib/chess";
import {
  claimGameAnalysis,
  completeGameAnalysis,
  fetchPendingAnalysis,
  releaseGameAnalysis,
  sendSyncPresence,
  triggerSync,
} from "@/lib/api/sync";
import { UserRole } from "@/types/user";
import { evaluationProgressAtom } from "@/sections/analysis/states";
import { useAtomValue } from "jotai";

const PRESENCE_MS = 45_000;
// Check for newly played games often so a student's latest games show up without
// waiting hours. We only actually hit the API when enough time has passed since
// the last successful sync, and also whenever the tab regains focus.
const SYNC_CHECK_MS = 5 * 60 * 1000;
const SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
const ANALYSIS_POLL_MS = 20_000;
const LAST_SYNC_KEY_PREFIX = "voltchess-last-platform-sync";
// Safety cap so a persistent claim conflict can't spin the drain loop forever.
const MAX_DRAIN_GAMES = 60;

/**
 * Background worker for students: presence heartbeat, prompt game import, and
 * browser-side analysis (the authoritative source of full reports) whenever the
 * tab is open and Stockfish is idle.
 */
export default function PlatformSyncOrchestrator() {
  const { user, isAuthenticated } = useAuth();
  const engine = useEngine(ENGINE_DEFAULTS.engine);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const analyzingRef = useRef(false);
  const qc = useQueryClient();

  const isStudent =
    isAuthenticated && user?.role === UserRole.Student && ENABLE_AUTHENTICATION;
  const userId = user?.id;

  useEffect(() => {
    if (!isStudent) return;

    const tickPresence = () => {
      void sendSyncPresence(analyzingRef.current || !!evaluationProgress);
    };

    tickPresence();
    const presenceId = window.setInterval(tickPresence, PRESENCE_MS);
    return () => window.clearInterval(presenceId);
  }, [isStudent, evaluationProgress]);

  // Prompt import of newly played games: on mount, whenever the tab becomes
  // visible/focused, and on a short timer (rate-limited to once per
  // SYNC_MIN_INTERVAL). Keyed per-user so multiple accounts on one browser
  // don't suppress each other's syncs.
  useEffect(() => {
    if (!isStudent) return;

    const lastSyncKey = `${LAST_SYNC_KEY_PREFIX}:${userId ?? "me"}`;

    const maybeSync = (force = false) => {
      const last = Number(localStorage.getItem(lastSyncKey) || 0);
      if (!force && Date.now() - last < SYNC_MIN_INTERVAL_MS) return;
      void triggerSync()
        .then(() => {
          localStorage.setItem(lastSyncKey, String(Date.now()));
          qc.invalidateQueries({ queryKey: ["sync-overview"] });
          qc.invalidateQueries({ queryKey: ["my-games"] });
        })
        .catch(() => {
          /* platform/username may not be set yet */
        });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") maybeSync();
    };

    maybeSync();
    const syncId = window.setInterval(maybeSync, SYNC_CHECK_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(syncId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [isStudent, userId, qc]);

  useEffect(() => {
    if (!isStudent || !engine?.getIsReady()) return;
    if (evaluationProgress || analyzingRef.current) return;

    let cancelled = false;

    const analyzeOne = async (): Promise<"done" | "empty" | "stop"> => {
      const pending = await fetchPendingAnalysis(1);
      const game = pending[0];
      if (!game?.pgn) return "empty";

      // Atomically claim the game; if another tab/worker beat us to it, the
      // server responds 409 and we just move on.
      try {
        await claimGameAnalysis(game.id);
      } catch {
        return "stop";
      }

      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const params = getEvaluateGameParams(chess);

        const evalResult = await engine!.evaluateGame({
          ...params,
          depth: ENGINE_DEFAULTS.depth,
          multiPv: ENGINE_DEFAULTS.multiPv,
          workersNb: ENGINE_DEFAULTS.workers,
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

        qc.invalidateQueries({ queryKey: ["sync-overview"] });
        qc.invalidateQueries({ queryKey: ["my-games"] });
        return "done";
      } catch {
        // Hand the game back so it's retried promptly instead of being stuck
        // as "in progress" until the claim times out.
        await releaseGameAnalysis(game.id).catch(() => {});
        return "stop";
      }
    };

    // Drain the queue: analyze pending games back-to-back while the tab is open
    // and the engine is idle, yielding immediately if the user starts a
    // foreground analysis.
    const runQueue = async () => {
      if (cancelled || analyzingRef.current || evaluationProgress) return;
      if (!engine?.getIsReady()) return;

      analyzingRef.current = true;
      try {
        for (let i = 0; i < MAX_DRAIN_GAMES; i++) {
          if (cancelled || evaluationProgress || !engine?.getIsReady()) break;
          const result = await analyzeOne();
          if (result !== "done") break;
        }
      } finally {
        analyzingRef.current = false;
      }
    };

    const id = window.setInterval(runQueue, ANALYSIS_POLL_MS);
    void runQueue();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isStudent, engine, evaluationProgress, qc]);

  return null;
}
