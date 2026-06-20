import { useEffect, useRef } from "react";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import { useEngine } from "@/hooks/useEngine";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAnalysisQueue } from "@/contexts/AnalysisQueueContext";
import { engineNameAtom, gameAtom } from "../states";
import { useAtomValue } from "jotai";

/** Auto-starts analysis when a game loads without a report. */
export default function AnalyzeButton() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const game = useAtomValue(gameAtom);
  const { analyzeGame, readyToAnalyse, gameEval } = useAnalyzeGame();
  const { serverGameFromUrl } = useGameDatabase();
  const { startAnalysis, state: queueState } = useAnalysisQueue();

  const autoStartedKeyRef = useRef<string | null>(null);

  const gameKey =
    serverGameFromUrl?.serverId ??
    (game.history().length > 0 ? game.pgn() : "");

  const isServerPending =
    !!serverGameFromUrl?.serverId && !serverGameFromUrl.eval;

  useEffect(() => {
    autoStartedKeyRef.current = null;
  }, [gameKey]);

  useEffect(() => {
    if (gameEval) return;
    if (!gameKey) return;
    if (autoStartedKeyRef.current === gameKey) return;

    if (isServerPending && serverGameFromUrl?.serverId) {
      if (queueState.running) return;
      autoStartedKeyRef.current = gameKey;
      console.log("[voltchess] queueing server game for analysis");
      void startAnalysis(serverGameFromUrl.serverId);
      return;
    }

    if (!readyToAnalyse) return;

    autoStartedKeyRef.current = gameKey;
    console.log("[voltchess] starting browser analysis for loaded game");
    void analyzeGame().then((ok) => {
      if (ok) {
        console.log("[voltchess] browser analysis complete");
      } else {
        console.warn("[voltchess] browser analysis did not start or failed");
        autoStartedKeyRef.current = null;
      }
    });
  }, [
    gameEval,
    readyToAnalyse,
    analyzeGame,
    gameKey,
    isServerPending,
    serverGameFromUrl?.serverId,
    startAnalysis,
    queueState.running,
  ]);

  return null;
}
