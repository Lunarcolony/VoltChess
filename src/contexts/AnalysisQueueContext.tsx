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

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["sync-overview"] });
    qc.invalidateQueries({ queryKey: ["my-games"] });
  }, [qc]);

  const startAnalysis = useCallback(
    async (priorityGameId?: string) => {
      const result = await runAnalysisQueue({
        priorityGameId,
        maxGames: 30,
      });
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
    if (pending === 0 && inProgress === 0) {
      autoStartedRef.current = false;
      return;
    }
    if (autoStartedRef.current || state.running) return;
    if (pending > 0) {
      autoStartedRef.current = true;
      void startAnalysis();
    }
  }, [isStudent, overview, state.running, startAnalysis]);

  useEffect(() => {
    if (!isStudent) return;
    const tick = () => {
      void sendSyncPresence(state.running).catch(() => {});
    };
    tick();
    const id = window.setInterval(tick, PRESENCE_MS);
    return () => window.clearInterval(id);
  }, [isStudent, state.running]);

  useEffect(() => {
    if (!isStudent) return;
    const id = window.setInterval(
      () => {
        void triggerSync()
          .then(invalidate)
          .catch(() => {});
      },
      15 * 60 * 1000
    );
    return () => window.clearInterval(id);
  }, [isStudent, invalidate]);

  useEffect(() => {
    if (!isStudent) return;

    const onVisibility = () => {
      if (!document.hidden) return;
      void processServerAnalysisQueue(2)
        .then((r) => {
          if ((r.processed ?? 0) > 0) invalidate();
        })
        .catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isStudent, invalidate]);

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
