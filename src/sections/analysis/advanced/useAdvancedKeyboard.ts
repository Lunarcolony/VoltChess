import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  showBestMoveArrowAtom,
} from "../states";
import {
  advancedEngineOnAtom,
  shortcutsDialogOpenAtom,
  threatModeAtom,
} from "./states";
import { useChessActions } from "@/hooks/useChessActions";
import { uciMoveParams } from "@/lib/chess";
import { getFlippedFen } from "./useThreatEval";

const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
};

/**
 * Lichess analysis shortcuts: f = flip, l = engine, a = arrows,
 * x = threat, space = play best move, ? = help.
 * (Arrow-key navigation is handled by AnalysisBottomNav.)
 */
export const useAdvancedKeyboard = (enabled: boolean) => {
  const board = useAtomValue(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const setOrientation = useSetAtom(boardOrientationAtom);
  const [engineOn, setEngineOn] = useAtom(advancedEngineOnAtom);
  const setShowArrows = useSetAtom(showBestMoveArrowAtom);
  const setThreatMode = useSetAtom(threatModeAtom);
  const setShortcutsOpen = useSetAtom(shortcutsDialogOpenAtom);
  const { playMove } = useChessActions(boardAtom);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "f":
          setOrientation((prev) => !prev);
          break;
        case "l":
          setEngineOn((prev) => {
            if (prev) setThreatMode(false);
            return !prev;
          });
          break;
        case "a":
          setShowArrows((prev) => !prev);
          break;
        case "x": {
          const canThreat =
            engineOn &&
            !board.isGameOver() &&
            !board.inCheck() &&
            !!getFlippedFen(board.fen());
          if (canThreat) setThreatMode((prev) => !prev);
          break;
        }
        case " ": {
          e.preventDefault();
          const bestUci =
            position.eval?.bestMove ?? position.eval?.lines?.[0]?.pv[0];
          if (bestUci && !board.isGameOver()) {
            playMove(uciMoveParams(bestUci));
          }
          break;
        }
        case "?":
          setShortcutsOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    board,
    position,
    engineOn,
    setOrientation,
    setEngineOn,
    setShowArrows,
    setThreatMode,
    setShortcutsOpen,
    playMove,
  ]);
};
