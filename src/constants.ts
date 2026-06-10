import { EngineName, MoveClassification } from "./types/enums";
export const ACCESS_TOKEN = "access";
export const REFRESH_TOKEN = "refresh";
export const MAIN_THEME_COLOR = "#E8B923";
export const LINEAR_PROGRESS_BAR_COLOR = "#E8B923";

// Authentication Configuration
// Set this to false to disable authentication and allow users to access all pages without logging in
// Set this to true to enable authentication and require users to log in for protected routes
// Can be overridden by VITE_ENABLE_AUTHENTICATION environment variable
export const ENABLE_AUTHENTICATION = import.meta.env.VITE_ENABLE_AUTHENTICATION
  ? import.meta.env.VITE_ENABLE_AUTHENTICATION === "true"
  : true;

export const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  [MoveClassification.Opening]: "#dbac86",
  [MoveClassification.Forced]: "#dbac86",
  [MoveClassification.Splendid]: "#19d4af",
  [MoveClassification.Perfect]: "#3894eb",
  [MoveClassification.Best]: "#22ac38",
  [MoveClassification.Excellent]: "#22ac38",
  [MoveClassification.Okay]: "#74b038",
  [MoveClassification.Inaccuracy]: "#f2be1f",
  [MoveClassification.Mistake]: "#e69f00",
  [MoveClassification.Blunder]: "#df5353",
};

export const DEFAULT_ENGINE: EngineName = EngineName.Stockfish17Lite;
export const STRONGEST_ENGINE: EngineName = EngineName.Stockfish17;

export const ENGINE_LABELS: Record<
  EngineName,
  { small: string; full: string; sizeMb: number }
> = {
  [EngineName.Stockfish17]: {
    full: "Stockfish 17 (75MB)",
    small: "Stockfish 17",
    sizeMb: 75,
  },
  [EngineName.Stockfish17Lite]: {
    full: "Stockfish 17 Lite (6MB)",
    small: "Stockfish 17 Lite",
    sizeMb: 6,
  },
  [EngineName.Stockfish16_1]: {
    full: "Stockfish 16.1 (64MB)",
    small: "Stockfish 16.1",
    sizeMb: 64,
  },
  [EngineName.Stockfish16_1Lite]: {
    full: "Stockfish 16.1 Lite (6MB)",
    small: "Stockfish 16.1 Lite",
    sizeMb: 6,
  },
  [EngineName.Stockfish16NNUE]: {
    full: "Stockfish 16 (40MB)",
    small: "Stockfish 16",
    sizeMb: 40,
  },
  [EngineName.Stockfish16]: {
    full: "Stockfish 16 Lite (HCE)",
    small: "Stockfish 16 Lite",
    sizeMb: 2,
  },
  [EngineName.Stockfish11]: {
    full: "Stockfish 11 (HCE)",
    small: "Stockfish 11",
    sizeMb: 2,
  },
};

export const PIECE_SETS = ["maestro"] as const satisfies string[];
