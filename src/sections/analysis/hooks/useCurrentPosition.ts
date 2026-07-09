import {
  boardAtom,
  currentPositionAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
} from "@/sections/analysis/states";
import { CurrentPosition, PositionEval } from "@/types/eval";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { getEvaluateGameParams } from "@/lib/chess";
import { getMovesClassification } from "@/lib/engine/helpers/moveClassification";
import { openings } from "@/data/openings";
import { UciEngine } from "@/lib/engine/uciEngine";

export interface UseCurrentPositionOptions {
  /** When false the engine never runs; stored evals are still displayed */
  enabled?: boolean;
  /** Keep searching stored positions whose depth/lines are below the target */
  deepen?: boolean;
}

export const useCurrentPosition = (
  engine: UciEngine | null,
  options?: UseCurrentPositionOptions
) => {
  const enabled = options?.enabled ?? true;
  const deepen = options?.deepen ?? false;
  const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const depth = useAtomValue(engineDepthAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const [savedEvals, setSavedEvals] = useAtom(savedEvalsAtom);

  useEffect(() => {
    const boardHistory = board.history({ verbose: true });
    const position: CurrentPosition = {
      lastMove: boardHistory.at(-1),
    };

    const gameHistory = game.history();

    if (
      boardHistory.length <= gameHistory.length &&
      gameHistory.slice(0, boardHistory.length).join() ===
        boardHistory.map((m) => m.san).join()
    ) {
      position.currentMoveIdx = boardHistory.length;

      if (gameEval) {
        const evalIndex = boardHistory.length;

        position.eval = {
          ...gameEval.positions[evalIndex],
          lines: gameEval.positions[evalIndex].lines.slice(0, multiPv),
        };
        position.lastEval =
          evalIndex > 0
            ? {
                ...gameEval.positions[evalIndex - 1],
                lines: gameEval.positions[evalIndex - 1].lines.slice(
                  0,
                  multiPv
                ),
              }
            : undefined;
      }
    }

    if (!position.eval?.opening) {
      for (const move of boardHistory.slice().reverse()) {
        const moveFen = move.after.split(" ")[0];
        const opening = openings.find((opening) => opening.fen === moveFen);
        if (opening) {
          position.opening = opening.name;
          break;
        }
      }
    }

    setCurrentPosition(position);

    const engineUsable =
      enabled &&
      !evaluationProgress &&
      !!engine?.getIsReady() &&
      !!engine?.name &&
      !board.isCheckmate() &&
      !board.isStalemate();

    const storedDepth = position.eval?.lines?.[0]?.depth ?? 0;
    const storedLinesNb = position.eval?.lines?.length ?? 0;
    const needsDeepening =
      deepen &&
      !!position.eval &&
      (storedDepth < depth || storedLinesNb < multiPv);

    if (engineUsable && engine && !position.eval) {
      const getFenEngineEval = async (
        fen: string,
        setPartialEval?: (positionEval: PositionEval) => void
      ) => {
        if (!engine.getIsReady()) {
          throw new Error("Engine not ready");
        }
        const savedEval = savedEvals[fen];
        if (
          savedEval &&
          savedEval.engine === engine.name &&
          (savedEval.lines?.length ?? 0) >= multiPv &&
          (savedEval.lines[0].depth ?? 0) >= depth
        ) {
          const positionEval: PositionEval = {
            ...savedEval,
            lines: savedEval.lines.slice(0, multiPv),
          };
          setPartialEval?.(positionEval);
          return positionEval;
        }

        const rawPositionEval = await engine.evaluatePositionWithUpdate({
          fen,
          depth,
          multiPv,
          setPartialEval,
        });

        setSavedEvals((prev) => ({
          ...prev,
          [fen]: { ...rawPositionEval, engine: engine.name },
        }));

        return rawPositionEval;
      };

      const getPositionEval = async () => {
        const setPartialEval = (positionEval: PositionEval) => {
          setCurrentPosition({ ...position, eval: positionEval });
        };
        const rawPositionEval = await getFenEngineEval(
          board.fen(),
          setPartialEval
        );

        if (boardHistory.length === 0) return;

        const params = getEvaluateGameParams(board);
        const fens = params.fens.slice(board.turn() === "w" ? -3 : -4);
        const uciMoves = params.uciMoves.slice(board.turn() === "w" ? -2 : -3);

        const lastRawEval = await getFenEngineEval(fens.slice(-2)[0]);
        const rawPositions: PositionEval[] = fens.map((_, idx) => {
          if (idx === fens.length - 2) return lastRawEval;
          if (idx === fens.length - 1) return rawPositionEval;
          return {
            lines: [
              {
                pv: [],
                depth: 0,
                multiPv: 1,
                cp: 1,
              },
            ],
          };
        });

        const positionsWithMoveClassification = getMovesClassification(
          rawPositions,
          uciMoves,
          fens
        );

        setCurrentPosition({
          ...position,
          eval: positionsWithMoveClassification.slice(-1)[0],
          lastEval: positionsWithMoveClassification.slice(-2)[0],
        });
      };

      getPositionEval();
    }

    if (engineUsable && engine && needsDeepening && position.eval) {
      const storedEval = position.eval;
      const fen = board.fen();

      const mergePartial = (positionEval: PositionEval) => {
        const partialDepth = positionEval.lines?.[0]?.depth ?? 0;
        if (partialDepth < storedDepth || !positionEval.lines.length) return;
        setCurrentPosition({
          ...position,
          eval: {
            ...positionEval,
            moveClassification: storedEval.moveClassification,
            opening: storedEval.opening,
          },
        });
      };

      const deepenPosition = async () => {
        const savedEval = savedEvals[fen];
        if (
          savedEval &&
          savedEval.engine === engine.name &&
          (savedEval.lines?.length ?? 0) >= multiPv &&
          (savedEval.lines[0].depth ?? 0) >= depth
        ) {
          mergePartial({
            ...savedEval,
            lines: savedEval.lines.slice(0, multiPv),
          });
          return;
        }

        const rawPositionEval = await engine.evaluatePositionWithUpdate({
          fen,
          depth,
          multiPv,
          setPartialEval: mergePartial,
        });

        setSavedEvals((prev) => ({
          ...prev,
          [fen]: { ...rawPositionEval, engine: engine.name },
        }));
        mergePartial(rawPositionEval);
      };

      deepenPosition().catch(() => {
        // Navigation away stops the search mid-flight; nothing to recover.
      });
    }

    return () => {
      if (engine?.getIsReady() && !evaluationProgress) {
        void engine.stopAllCurrentJobs();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameEval,
    board,
    game,
    engine,
    depth,
    multiPv,
    evaluationProgress,
    enabled,
    deepen,
  ]);

  return currentPosition;
};
