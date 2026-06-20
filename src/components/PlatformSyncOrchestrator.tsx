import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { SYNC_ANALYSIS_DEFAULTS } from "@/constants/engineDefaults";
import { useEngine } from "@/hooks/useEngine";
import { getEvaluateGameParams } from "@/lib/chess";
import {
  claimGameAnalysis,
  completeGameAnalysis,
  fetchPendingAnalysis,
  fetchSyncOverview,
  releaseGameAnalysis,
  sendSyncPresence,
  triggerSync,
} from "@/lib/api/sync";
import { UserRole } from "@/types/user";
import { evaluationProgressAtom } from "@/sections/analysis/states";
import { useAtomValue } from "jotai";

const LOG = "[voltchess-sync]";
const PRESENCE_MS = 45_000;
const SYNC_CHECK_MS = 5 * 60 * 1000;
const SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
const ANALYSIS_POLL_MS = 4_000;
const LAST_SYNC_KEY_PREFIX = "voltchess-last-platform-sync";

/**
 * Browser background analysis for synced games — one game at a time,
 * lowest Stockfish settings. Keep any VoltChess tab open while games import.
 */
export default function PlatformSyncOrchestrator() {
  const { user, isAuthenticated } = useAuth();
  const engine = useEngine(SYNC_ANALYSIS_DEFAULTS.engine);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const analyzingRef = useRef(false);
  const qc = useQueryClient();
  const [engineReady, setEngineReady] = useState(false);

  const isStudent =
    isAuthenticated && user?.role === UserRole.Student && ENABLE_AUTHENTICATION;
  const userId = user?.id;

  const { data: overview } = useQuery({
    queryKey: ["sync-overview"],
    queryFn: () => fetchSyncOverview(),
    enabled: isStudent,
    refetchInterval: 10_000,
  });

  const hasPending =
    (overview?.games_pending ?? 0) + (overview?.games_in_progress ?? 0) > 0;

  const postPresence = useCallback((busy: boolean) => {
    void sendSyncPresence(busy).catch(() => {});
  }, []);

  useEffect(() => {
    if (!engine) {
      setEngineReady(false);
      return;
    }
    const id = window.setInterval(() => {
      setEngineReady(engine.getIsReady());
    }, 1500);
    setEngineReady(engine.getIsReady());
    return () => window.clearInterval(id);
  }, [engine]);

  useEffect(() => {
    if (!isStudent || !overview) return;
    const piBusy =
      (overview.games_in_progress ?? 0) > 0 && !analyzingRef.current;
    if (piBusy && hasPending) {
      console.warn(
        `${LOG} ${overview.games_in_progress} game(s) marked in progress ` +
          `but this tab is idle — stale claim or Pi fallback may be running.`
      );
    }
  }, [isStudent, overview?.games_in_progress, hasPending]);

  useEffect(() => {
    if (!isStudent) return;

    const busy = () => analyzingRef.current || !!evaluationProgress;

    const tickPresence = () => postPresence(busy());

    tickPresence();
    const presenceId = window.setInterval(tickPresence, PRESENCE_MS);
    return () => window.clearInterval(presenceId);
  }, [isStudent, evaluationProgress, postPresence]);

  useEffect(() => {
    if (!isStudent) return;
    postPresence(analyzingRef.current || !!evaluationProgress);
  }, [isStudent, evaluationProgress, postPresence]);

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
        .catch(() => {});
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
    if (!isStudent) return;

    let cancelled = false;

    const analyzeGame = async (): Promise<"done" | "empty" | "stop"> => {
      const pending = await fetchPendingAnalysis(1);
      const game = pending[0];
      if (!game?.pgn) return "empty";

      try {
        await claimGameAnalysis(game.id);
      } catch {
        console.debug(`${LOG} could not claim game ${game.id} (another worker?)`);
        return "stop";
      }

      const label = `${(game.white as { username?: string })?.username ?? game.white?.name ?? "?"} vs ${
        (game.black as { username?: string })?.username ?? game.black?.name ?? "?"
      }`;

      analyzingRef.current = true;
      postPresence(true);

      console.log(
        `${LOG} analyzing (depth ${SYNC_ANALYSIS_DEFAULTS.depth}): ${label}`
      );

      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const params = getEvaluateGameParams(chess);

        const evalResult = await engine!.evaluateGame({
          ...params,
          depth: SYNC_ANALYSIS_DEFAULTS.depth,
          multiPv: SYNC_ANALYSIS_DEFAULTS.multiPv,
          workersNb: SYNC_ANALYSIS_DEFAULTS.workers,
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

        console.log(`${LOG} finished: ${label}`);
        qc.invalidateQueries({ queryKey: ["sync-overview"] });
        qc.invalidateQueries({ queryKey: ["my-games"] });
        return "done";
      } catch (err) {
        console.warn(`${LOG} analysis failed for ${game.id}`, err);
        await releaseGameAnalysis(game.id).catch(() => {});
        return "stop";
      } finally {
        analyzingRef.current = false;
        postPresence(!!evaluationProgress);
      }
    };

    const runWorker = async () => {
      if (cancelled || analyzingRef.current || evaluationProgress) return;

      if (!engineReady || !engine) {
        if (hasPending) {
          console.debug(`${LOG} waiting for Stockfish (lite) engine…`);
        }
        return;
      }

      let safety = 0;
      while (!cancelled && !evaluationProgress && safety < 5) {
        safety += 1;
        const result = await analyzeGame();
        if (result === "empty" || result === "stop") break;
      }
    };

    const pollMs = hasPending ? ANALYSIS_POLL_MS : ANALYSIS_POLL_MS * 3;
    const id = window.setInterval(() => void runWorker(), pollMs);
    void runWorker();

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    isStudent,
    engine,
    engineReady,
    evaluationProgress,
    hasPending,
    qc,
    postPresence,
  ]);

  return null;
}
