import { EngineName } from "@/types/enums";

/** Lightweight browser defaults — minimum compute for in-tab Stockfish */
export const ENGINE_DEFAULTS = {
  engine: EngineName.Stockfish17Lite,
  depth: 10,
  multiPv: 2,
  workers: 1,
  boardHue: 0,
} as const;

// bump version so existing users receive the new default engine on next load
export const ENGINE_SETTINGS_VERSION = 2;
export const ENGINE_SETTINGS_VERSION_KEY = "voltchess-engine-settings-v";
