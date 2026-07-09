import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { PositionEval } from "@/types/eval";
import type { Arrow } from "react-chessboard/dist/chessboard/types";

/** Master switch: swaps the analysis panel to the Lichess-style deep workspace */
export const advancedModeAtom = atomWithStorage<boolean>(
  "voltchess-advanced-analysis",
  false
);

/** Ceval toggle — when off the engine never runs, stored evals are still shown */
export const advancedEngineOnAtom = atomWithStorage<boolean>(
  "voltchess-advanced-engine-on",
  true
);

/** Threat mode ("x"): analyse the position with the side to move flipped */
export const threatModeAtom = atom(false);

/** Live eval of the flipped position while threat mode is active */
export const threatEvalAtom = atom<PositionEval | undefined>(undefined);

/**
 * Board arrows fully controlled by the advanced panel.
 * null = advanced mode inactive, Board falls back to its built-in arrow.
 */
export const advancedArrowsAtom = atom<Arrow[] | null>(null);

/** First move (uci) of the engine line currently hovered in the panel */
export const hoveredLineUciAtom = atom<string | undefined>(undefined);

/** Keyboard shortcuts help dialog */
export const shortcutsDialogOpenAtom = atom(false);
