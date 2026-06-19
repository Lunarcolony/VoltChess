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
  sendSyncPresence,
  triggerSync,
} from "@/lib/api/sync";
import { UserRole } from "@/types/user";
import { evaluationProgressAtom } from "@/sections/analysis/states";
import { useAtomValue } from "jotai";

const PRESENCE_MS = 45_000;
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const ANALYSIS_POLL_MS = 20_000;
const LAST_SYNC_KEY = "voltchess-last-platform-sync";

/**
 * Background worker for students: heartbeat, periodic import, browser-side analysis
 * when the tab is open and Stockfish is idle.
 */
export default function PlatformSyncOrchestrator() {
  const { user, isAuthenticated } = useAuth();
  const engine = useEngine(ENGINE_DEFAULTS.engine);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const analyzingRef = useRef(false);
  const qc = useQueryClient();

  const isStudent =
    isAuthenticated && user?.role === UserRole.Student && ENABLE_AUTHENTICATION;

  useEffect(() => {
    if (!isStudent) return;

    const tickPresence = () => {
      void sendSyncPresence(analyzingRef.current || !!evaluationProgress);
    };

    tickPresence();
    const presenceId = window.setInterval(tickPresence, PRESENCE_MS);
    return () => window.clearInterval(presenceId);
  }, [isStudent, evaluationProgress]);

  useEffect(() => {
    if (!isStudent) return;

    const maybeSync = () => {
      const last = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
      if (Date.now() - last < SYNC_INTERVAL_MS) return;
      void triggerSync()
        .then(() => {
          localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
          qc.invalidateQueries({ queryKey: ["sync-overview"] });
          qc.invalidateQueries({ queryKey: ["my-games"] });
        })
        .catch(() => {
          /* coach may not have set platform yet */
        });
    };

    maybeSync();
    const syncId = window.setInterval(maybeSync, SYNC_INTERVAL_MS);
    return () => window.clearInterval(syncId);
  }, [isStudent, qc]);

  useEffect(() => {
    if (!isStudent || !engine?.getIsReady()) return;
    if (evaluationProgress || analyzingRef.current) return;

    let cancelled = false;

    const runQueue = async () => {
      if (cancelled || analyzingRef.current || evaluationProgress) return;
      if (!engine?.getIsReady()) return;

      try {
        const pending = await fetchPendingAnalysis(1);
        const game = pending[0];
        if (!game?.pgn) return;

        analyzingRef.current = true;
        await claimGameAnalysis(game.id);

        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const params = getEvaluateGameParams(chess);

        const evalResult = await engine.evaluateGame({
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
      } catch {
        /* skip failed game; server queue may pick it up */
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
