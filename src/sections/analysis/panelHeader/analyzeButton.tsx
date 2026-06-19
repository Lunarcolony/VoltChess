import { useEffect, useRef } from "react";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import { useEngine } from "@/hooks/useEngine";
import { engineNameAtom, evaluationProgressAtom, gameAtom } from "../states";
import { useAtomValue, useSetAtom } from "jotai";

export default function AnalyzeButton() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);
  const game = useAtomValue(gameAtom);
  const { analyzeGame, readyToAnalyse, gameEval, isServerGame } =
    useAnalyzeGame();

  // Track which game we already kicked off analysis for, so a failed/aborted
  // run does NOT re-trigger on the next render. Previously any failure left
  // `gameEval` empty, which immediately satisfied the auto-analyze condition
  // again — spawning Stockfish workers in an infinite loop.
  const autoAnalyzedPgnRef = useRef<string | null>(null);

  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);

  useEffect(() => {
    if (gameEval) return;
    // Synced game reports are produced in the background and saved on the
    // server; opening one must never start a foreground re-analysis.
    if (isServerGame) return;
    if (!readyToAnalyse) return;

    const pgn = game.pgn();
    if (!pgn || autoAnalyzedPgnRef.current === pgn) return;
    autoAnalyzedPgnRef.current = pgn;
    void analyzeGame();
  }, [gameEval, isServerGame, readyToAnalyse, analyzeGame, game]);

  return null;
}
