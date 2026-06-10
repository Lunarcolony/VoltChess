import { useEffect } from "react";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import { useEngine } from "@/hooks/useEngine";
import { engineNameAtom } from "../states";
import { useAtomValue, useSetAtom } from "jotai";
import { evaluationProgressAtom } from "../states";

export default function AnalyzeButton() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);
  const { analyzeGame, readyToAnalyse, gameEval } = useAnalyzeGame();

  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);

  useEffect(() => {
    if (!gameEval && readyToAnalyse) {
      analyzeGame();
    }
  }, [gameEval, readyToAnalyse, analyzeGame]);

  return null;
}
