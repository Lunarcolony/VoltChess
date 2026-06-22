import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { getEvaluateGameParams } from "@/lib/chess";
import { useEngine } from "@/hooks/useEngine";
import { useAnalysisQueue } from "@/contexts/AnalysisQueueContext";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import {
  engineNameAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";

function progressToCompleted(progress: number, total: number): number {
  if (progress <= 0 || total <= 0) return 0;
  const ratio = -Math.log(1 - Math.min(progress, 98.5) / 99) / 4;
  return Math.min(total, Math.max(0, Math.round(total * ratio)));
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function useAnalysisOverlay() {
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  const { serverGameFromUrl } = useGameDatabase();
  const { state: queueState } = useAnalysisQueue();

  const hasMoves = game.history().length > 0;
  const engineReady = !!engine?.getIsReady();
  const engineLoading = hasMoves && !gameEval && !engineReady && progress <= 0;
  const isServerPending =
    !!serverGameFromUrl?.serverId && !serverGameFromUrl.eval;
  const queueAnalyzing = isServerPending && queueState.running;
  const isAnalyzing = progress > 0 || queueAnalyzing;

  const visible = (engineLoading || isAnalyzing) && !gameEval;

  const totalPositions = useMemo(() => {
    if (!hasMoves) return 0;
    try {
      return getEvaluateGameParams(game).fens.length;
    } catch {
      return game.history().length + 1;
    }
  }, [game, hasMoves]);

  const analyzedPositions = progressToCompleted(progress, totalPositions);
  const remainingPositions = Math.max(0, totalPositions - analyzedPositions);

  const startRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!visible) {
      startRef.current = null;
      setElapsedSeconds(0);
      return;
    }

    if (startRef.current === null) {
      startRef.current = Date.now();
    }

    const tick = () => {
      if (startRef.current !== null) {
        setElapsedSeconds((Date.now() - startRef.current) / 1000);
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [visible]);

  const estimatedRemainingSeconds = useMemo(() => {
    if (engineLoading || analyzedPositions <= 0 || progress <= 0) return null;
    const rate = analyzedPositions / Math.max(elapsedSeconds, 0.5);
    if (rate <= 0) return null;
    return remainingPositions / rate;
  }, [
    engineLoading,
    analyzedPositions,
    remainingPositions,
    elapsedSeconds,
    progress,
  ]);

  const displayProgress = engineLoading
    ? 0
    : queueAnalyzing && progress <= 0
      ? 5
      : progress;

  return {
    visible,
    engineLoading,
    isAnalyzing,
    progress: displayProgress,
    totalPositions,
    analyzedPositions,
    remainingPositions,
    elapsedSeconds,
    estimatedRemainingSeconds,
    engineName,
    queueMessage: queueState.message,
    formatDuration,
  };
}
