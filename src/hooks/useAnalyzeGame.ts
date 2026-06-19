import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getEvaluateGameParams } from "@/lib/chess";
import { useEngine } from "@/hooks/useEngine";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { usePlayersData } from "@/hooks/usePlayersData";
import { logAnalyticsEvent } from "@/lib/firebase";
import { syncAnalysisResult } from "@/lib/gameSync";
import { SavedEvals } from "@/types/eval";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  engineWorkersNbAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
} from "@/sections/analysis/states";

export function useAnalyzeGame() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  const engineWorkersNb = useAtomValue(engineWorkersNbAtom);
  const [evaluationProgress, setEvaluationProgress] = useAtom(
    evaluationProgressAtom
  );
  const engineDepth = useAtomValue(engineDepthAtom);
  const engineMultiPv = useAtomValue(engineMultiPvAtom);
  const { setGameEval, gameFromUrl, serverGameFromUrl } = useGameDatabase();
  const [gameEval, setEval] = useAtom(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  const { white, black } = usePlayersData(gameAtom);

  const readyToAnalyse =
    !!engine?.getIsReady() && game.history().length > 0 && !evaluationProgress;

  const analyzeGame = useCallback(
    async (force = false) => {
      const params = getEvaluateGameParams(game);
      if (
        !engine?.getIsReady() ||
        params.fens.length === 0 ||
        evaluationProgress
      ) {
        return false;
      }

      if (gameEval && !force) return false;

      if (force) {
        setEval(undefined);
      }

      try {
        const newGameEval = await engine.evaluateGame({
          ...params,
          depth: engineDepth,
          multiPv: engineMultiPv,
          setEvaluationProgress,
          playersRatings: {
            white: white?.rating,
            black: black?.rating,
          },
          workersNb: engineWorkersNb,
        });

        setEval(newGameEval);
        setEvaluationProgress(0);

        if (gameFromUrl) {
          setGameEval(gameFromUrl.id, newGameEval);
        }

        void syncAnalysisResult(
          game,
          newGameEval,
          gameFromUrl?.id,
          serverGameFromUrl?.serverId
        ).catch((err) => console.warn("Server sync failed:", err));

        const gameSavedEvals: SavedEvals = params.fens.reduce(
          (acc, fen, idx) => {
            acc[fen] = { ...newGameEval.positions[idx], engine: engineName };
            return acc;
          },
          {} as SavedEvals
        );
        setSavedEvals((prev) => ({
          ...prev,
          ...gameSavedEvals,
        }));

        logAnalyticsEvent("analyze_game", {
          engine: engineName,
          depth: engineDepth,
          multiPv: engineMultiPv,
          nbPositions: params.fens.length,
        });

        return true;
      } catch (error) {
        console.error(error);
        setEvaluationProgress(0);
        return false;
      }
    },
    [
      engine,
      engineName,
      engineWorkersNb,
      game,
      engineDepth,
      engineMultiPv,
      evaluationProgress,
      setEvaluationProgress,
      setEval,
      gameEval,
      gameFromUrl,
      serverGameFromUrl,
      setGameEval,
      setSavedEvals,
      white?.rating,
      black?.rating,
    ]
  );

  const reanalyzeGame = useCallback(async () => {
    setEval(undefined);
    return analyzeGame(true);
  }, [analyzeGame, setEval]);

  return {
    analyzeGame,
    reanalyzeGame,
    readyToAnalyse,
    gameEval,
    evaluationProgress,
    engineReady: !!engine?.getIsReady(),
    // Synced games are analyzed once in the background and their report is
    // saved on the server, so opening one should never kick off a fresh
    // foreground analysis.
    isServerGame: !!serverGameFromUrl,
  };
}
