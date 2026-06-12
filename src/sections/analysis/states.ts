import { ENGINE_DEFAULTS } from "@/constants/engineDefaults";
import { EngineName } from "@/types/enums";
import { CurrentPosition, GameEval, SavedEvals } from "@/types/eval";
import { Chess } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

export const boardOrientationAtom = atom(true);
export const showBestMoveArrowAtom = atom(true);
export const showPlayerMoveIconAtom = atom(true);

export const engineNameAtom = atomWithStorage<EngineName>(
  "engine-name",
  ENGINE_DEFAULTS.engine
);
export const engineDepthAtom = atomWithStorage<number>(
  "engine-depth",
  ENGINE_DEFAULTS.depth
);
export const engineMultiPvAtom = atomWithStorage<number>(
  "engine-multi-pv",
  ENGINE_DEFAULTS.multiPv
);
export const engineWorkersNbAtom = atomWithStorage<number>(
  "engineWorkersNb",
  ENGINE_DEFAULTS.workers
);
export const evaluationProgressAtom = atom(0);

export const savedEvalsAtom = atom<SavedEvals>({});
