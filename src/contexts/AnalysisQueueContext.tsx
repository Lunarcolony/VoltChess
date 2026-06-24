import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { debug } from "@/lib/debug";
import { UserRole } from "@/types/user";
import {
  getQueueState,
  runAnalysisQueue,
  subscribeQueue,
  type QueueState,
} from "@/services/analysisQueue";
import {
  fetchSyncOverview,
  processServerAnalysisQueue,
  sendSyncPresence,
  triggerSync,
} from "@/lib/api/sync";

type AnalysisQueueContextValue = {
  state: QueueState;
  startAnalysis: (priorityGameId?: string) => Promise<void>;
};

const AnalysisQueueContext = createContext<AnalysisQueueContextValue | null>(
  null
);

const PRESENCE_MS = 45_000;

export function AnalysisQueueProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<QueueState>(getQueueState);

  const isStudent =
    !authLoading &&
    isAuthenticated &&
    user?.role === UserRole.Student &&
    ENABLE_AUTHENTICATION;

  useEffect(() => subscribeQueue(setState), []);

  useEffect(() => {
    debug.log("queue", "state update", {
      phase: state.phase,
      running: state.running,
      gamesDone: state.gamesDone,
      message: state.message,
      error: state.error,
    });
  }, [state]);

  const invalidate = useCallback(() => {
    debug.log("sync", "invalidating sync-overview + my-games queries");
    qc.invalidateQueries({ queryKey: ["sync-overview"] });
    qc.invalidateQueries({ queryKey: ["my-games"] });
  }, [qc]);

  const startAnalysis = useCallback(
    async (priorityGameId?: string) => {
      debug.log("queue", "startAnalysis called", { priorityGameId });
      const result = await runAnalysisQueue({
        priorityGameId,
        maxGames: 30,
      });
      debug.log("queue", "startAnalysis finished", result);
      if (result.gamesDone > 0) {
        invalidate();
      }
    },
    [invalidate]
  );

  const { data: overview } = useQuery({
    queryKey: ["sync-overview"],
    queryFn: () => fetchSyncOverview(),
    enabled: isStudent,
    refetchInterval: 20_000,
  });

  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!isStudent || !overview) return;
    const pending = overview.games_pending ?? 0;
    const inProgress = overview.games_in_progress ?? 0;
    debug.log("sync", "overview poll", {
      pending,
      inProgress,
      analyzed: overview.games_analyzed,
      total: overview.games_total,
      autoStarted: autoStartedRef.current,
      queueRunning: state.running,
    });
    if (pending === 0 && inProgress === 0) {
      autoStartedRef.current = false;
      return;
    }
    if (autoStartedRef.current || state.running) return;
    if (pending > 0) {
      debug.log("queue", "auto-starting analysis for pending games", {
        pending,
      });
      autoStartedRef.current = true;
      void startAnalysis();
    }
  }, [isStudent, overview, state.running, startAnalysis]);

  useEffect(() => {
    if (!isStudent) return;
    debug.log("sync", "presence heartbeat started", {
      intervalMs: PRESENCE_MS,
    });
    const tick = () => {
      debug.log("sync", "sendSyncPresence tick", {
        browserBusy: state.running,
      });
      void sendSyncPresence(state.running).catch((err) => {
        debug.warn("sync", "sendSyncPresence failed", {
          message: err instanceof Error ? err.message : String(err),
        });
      });
    };
    tick();
    const id = window.setInterval(tick, PRESENCE_MS);
    return () => {
      debug.log("sync", "presence heartbeat stopped");
      window.clearInterval(id);
    };
  }, [isStudent, state.running]);

  useEffect(() => {
    if (!isStudent) return;
    debug.log("sync", "periodic triggerSync timer started (15 min)");
    const id = window.setInterval(
      () => {
        debug.log("sync", "triggerSync timer tick");
        void triggerSync()
          .then((r) => {
            debug.log("sync", "triggerSync result", {
              fetched: r.fetched,
              created: r.created,
              updated: r.updated,
              pending_analysis: r.pending_analysis,
              error: r.error,
            });
            invalidate();
          })
          .catch((err) => {
            debug.warn("sync", "triggerSync failed", {
              message: err instanceof Error ? err.message : String(err),
            });
          });
      },
      15 * 60 * 1000
    );
    return () => {
      debug.log("sync", "periodic triggerSync timer stopped");
      window.clearInterval(id);
    };
  }, [isStudent, invalidate]);

  useEffect(() => {
    if (!isStudent) return;

    const onVisibility = () => {
      if (!document.hidden) return;
      debug.log("sync", "tab hidden — requesting Pi server analysis fallback");
      void processServerAnalysisQueue(2)
        .then((r) => {
          debug.log("sync", "processServerAnalysisQueue result", {
            processed: r.processed,
          });
          if ((r.processed ?? 0) > 0) invalidate();
        })
        .catch((err) => {
          debug.warn("sync", "processServerAnalysisQueue failed", {
            message: err instanceof Error ? err.message : String(err),
          });
        });
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isStudent, invalidate]);

  useEffect(() => {
    debug.log("queue", "AnalysisQueueProvider student gate", {
      authLoading,
      isAuthenticated,
      role: user?.role,
      isStudent,
    });
  }, [authLoading, isAuthenticated, user?.role, isStudent]);

  const value = useMemo(
    () => ({ state, startAnalysis }),
    [state, startAnalysis]
  );

  return (
    <AnalysisQueueContext.Provider value={value}>
      {children}
    </AnalysisQueueContext.Provider>
  );
}

export function useAnalysisQueue(): AnalysisQueueContextValue {
  const ctx = useContext(AnalysisQueueContext);
  if (!ctx) {
    throw new Error(
      "useAnalysisQueue must be used within AnalysisQueueProvider"
    );
  }
  return ctx;
}
