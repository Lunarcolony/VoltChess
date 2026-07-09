import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import type { UciEngine } from "@/lib/engine/uciEngine";
import {
  boardAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  evaluationProgressAtom,
} from "../states";
import { advancedEngineOnAtom, threatEvalAtom, threatModeAtom } from "./states";

/** Flip the side to move so the engine reveals the opponent's threat. */
export const getFlippedFen = (fen: string): string | null => {
  const parts = fen.split(" ");
  if (parts.length < 4) return null;

  parts[1] = parts[1] === "w" ? "b" : "w";
  parts[3] = "-"; // en passant no longer applies
  if (parts[4] !== undefined) parts[4] = "0";
  const flipped = parts.join(" ");

  try {
    const probe = new Chess(flipped);
    if (probe.isCheck() || probe.isGameOver()) return null;
    return flipped;
  } catch {
    return null;
  }
};

/**
 * Evaluates the current position with the side to move flipped while threat
 * mode is active. The result lands in threatEvalAtom (white POV evals).
 */
export const useThreatEval = (engine: UciEngine | null) => {
  const board = useAtomValue(boardAtom);
  const [threatMode, setThreatMode] = useAtom(threatModeAtom);
  const engineOn = useAtomValue(advancedEngineOnAtom);
  const depth = useAtomValue(engineDepthAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const setThreatEval = useSetAtom(threatEvalAtom);

  useEffect(() => {
    setThreatEval(undefined);
    if (!threatMode) return;

    if (!engineOn || !engine?.getIsReady() || evaluationProgress) {
      setThreatMode(false);
      return;
    }

    const flippedFen = getFlippedFen(board.fen());
    if (!flippedFen) {
      setThreatMode(false);
      return;
    }

    let cancelled = false;

    engine
      .evaluatePositionWithUpdate({
        fen: flippedFen,
        depth,
        multiPv,
        setPartialEval: (positionEval) => {
          if (!cancelled) setThreatEval(positionEval);
        },
      })
      .then((positionEval) => {
        if (!cancelled) setThreatEval(positionEval);
      })
      .catch(() => {
        // Search interrupted by navigation — safe to ignore.
      });

    return () => {
      cancelled = true;
      if (engine.getIsReady()) void engine.stopAllCurrentJobs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threatMode, board, engine, engineOn, depth, multiPv]);
};
