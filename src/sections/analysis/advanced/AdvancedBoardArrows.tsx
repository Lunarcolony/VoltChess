import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { alpha } from "@mui/material/styles";
import type { Arrow } from "react-chessboard/dist/chessboard/types";
import type { Square } from "chess.js";
import {
  boardAtom,
  currentPositionAtom,
  showBestMoveArrowAtom,
} from "../states";
import {
  advancedArrowsAtom,
  advancedEngineOnAtom,
  hoveredLineUciAtom,
  threatEvalAtom,
  threatModeAtom,
} from "./states";
import { LICHESS_COLORS, getWinningChances } from "./lichess";
import type { LineEval } from "@/types/eval";

const uciToArrow = (uci: string, color: string): Arrow | null => {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  if (from.length !== 2 || to.length !== 2 || from === to) return null;
  return [from, to, color];
};

const buildLineArrows = (
  lines: LineEval[],
  isWhiteToMove: boolean,
  baseColor: string
): Arrow[] => {
  if (!lines.length) return [];

  const arrows: Arrow[] = [];
  const seen = new Set<string>();
  const bestChances = getWinningChances(lines[0]) * (isWhiteToMove ? 1 : -1);

  lines.forEach((line, index) => {
    const uci = line.pv[0];
    if (!uci || seen.has(uci.slice(0, 4))) return;

    // Lichess hides alternatives that are >= 0.2 winning chances worse
    const chances = getWinningChances(line) * (isWhiteToMove ? 1 : -1);
    const shift = (bestChances - chances) / 2;
    if (index > 0 && shift >= 0.2) return;

    const color =
      index === 0
        ? baseColor
        : alpha(baseColor, Math.max(0.25, 0.6 - shift * 2));
    const arrow = uciToArrow(uci, color);
    if (!arrow) return;

    seen.add(uci.slice(0, 4));
    arrows.push(arrow);
  });

  return arrows;
};

/**
 * Computes the board arrows for the advanced workspace: multi-PV best-move
 * arrows, threat arrows and the hovered-line preview. Renders nothing.
 */
export default function AdvancedBoardArrows() {
  const board = useAtomValue(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const threatMode = useAtomValue(threatModeAtom);
  const threatEval = useAtomValue(threatEvalAtom);
  const engineOn = useAtomValue(advancedEngineOnAtom);
  const showArrows = useAtomValue(showBestMoveArrowAtom);
  const hoveredUci = useAtomValue(hoveredLineUciAtom);
  const setArrows = useSetAtom(advancedArrowsAtom);

  const isWhiteToMove = board.turn() === "w";

  const arrows = useMemo(() => {
    const result: Arrow[] = [];

    if (threatMode && threatEval) {
      // Threat lines: the opponent is the one moving in the flipped position
      result.push(
        ...buildLineArrows(
          threatEval.lines,
          !isWhiteToMove,
          LICHESS_COLORS.threat
        )
      );
    } else if (engineOn && showArrows && position?.eval?.lines?.length) {
      result.push(
        ...buildLineArrows(
          position.eval.lines,
          isWhiteToMove,
          LICHESS_COLORS.primary
        )
      );
    }

    if (hoveredUci) {
      const hoverArrow = uciToArrow(hoveredUci, LICHESS_COLORS.primary);
      if (hoverArrow) {
        const existingIdx = result.findIndex(
          ([from, to]) => from === hoverArrow[0] && to === hoverArrow[1]
        );
        if (existingIdx >= 0) result.splice(existingIdx, 1);
        result.push(hoverArrow);
      }
    }

    return result;
  }, [
    threatMode,
    threatEval,
    engineOn,
    showArrows,
    position,
    hoveredUci,
    isWhiteToMove,
  ]);

  useEffect(() => {
    setArrows(arrows);
  }, [arrows, setArrows]);

  // Restore default board arrows when leaving the advanced workspace
  useEffect(() => {
    return () => setArrows(null);
  }, [setArrows]);

  return null;
}
