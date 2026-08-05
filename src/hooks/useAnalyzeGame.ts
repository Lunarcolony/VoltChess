import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getEvaluateGameParams } from "@/lib/chess";
import { useEngine } from "@/hooks/useEngine";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { usePlayersData } from "@/hooks/usePlayersData";
import { logAnalyticsEvent } from "@/lib/firebase";
import { syncAnalysisResult } from "@/lib/gameSync";
import { debug } from "@/lib/debug";
import { markAnalysisStart, recordGameAnalyzed } from "@/lib/telemetry";
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
        if (!engine?.getIsReady()) {
          debug.log("queue", "useAnalyzeGame — waiting for Stockfish");
        }
        return false;
      }

      if (gameEval && !force) return false;

      if (force) {
        setEval(undefined);
      }

      debug.log("queue", "useAnalyzeGame — starting evaluation", {
        force,
        moves: params.fens.length,
        depth: engineDepth,
        multiPv: engineMultiPv,
        serverGameId: serverGameFromUrl?.serverId,
        localGameId: gameFromUrl?.id,
      });

      const source = serverGameFromUrl?.serverId
        ? "server"
        : gameFromUrl?.id
          ? "local_db"
          : "session";

      markAnalysisStart();

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
        ).catch((err) =>
          debug.warn("sync", "syncAnalysisResult failed", {
            message: err instanceof Error ? err.message : String(err),
          })
        );

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

        recordGameAnalyzed({
          engine: engineName,
          depth: engineDepth,
          multiPv: engineMultiPv,
          workers: engineWorkersNb,
          nbPositions: params.fens.length,
          accuracy: newGameEval.accuracy ?? null,
          estimatedElo: newGameEval.estimatedElo ?? null,
          source,
          serverGameId: serverGameFromUrl?.serverId ?? null,
          localGameId: gameFromUrl?.id ?? null,
          reanalyze: force,
        });
        logAnalyticsEvent("analyze_game", {
          engine: engineName,
          depth: engineDepth,
          multiPv: engineMultiPv,
          nbPositions: params.fens.length,
        });

        debug.log("queue", "useAnalyzeGame — evaluation complete", {
          positions: newGameEval.positions.length,
        });
        return true;
      } catch (error) {
        debug.error("queue", "useAnalyzeGame — evaluation failed", {
          message: error instanceof Error ? error.message : String(error),
        });
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
    // True when viewing a synced server game that already has a saved report.
    isServerGame: !!serverGameFromUrl?.eval,
    serverGameId: serverGameFromUrl?.serverId,
  };
}
