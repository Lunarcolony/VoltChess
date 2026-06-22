import { getChessComUserRecentGames } from "@/lib/chessCom";
import { getLichessUserRecentGames } from "@/lib/lichess";
import type { LoadedGame } from "@/types/game";

export type PlatformId = "chesscom" | "lichess";

export interface PlatformConfig {
  id: PlatformId;
  label: string;
  shortLabel: string;
  icon: string;
  storageKey: string;
  placeholder: string;
  description: string;
  accent: string;
  fetchGames: (username: string, signal?: AbortSignal) => Promise<LoadedGame[]>;
}

export const PLATFORM_CONFIG: Record<PlatformId, PlatformConfig> = {
  chesscom: {
    id: "chesscom",
    label: "Chess.com",
    shortLabel: "Chess.com",
    icon: "mdi:chess-pawn",
    storageKey: "chesscom-username",
    placeholder: "Search Chess.com username…",
    description: "Import recent games by username — no Premium required.",
    accent: "#4ade80",
    fetchGames: getChessComUserRecentGames,
  },
  lichess: {
    id: "lichess",
    label: "Lichess",
    shortLabel: "Lichess",
    icon: "mdi:horse",
    storageKey: "lichess-username",
    placeholder: "Search Lichess username…",
    description: "Pull your latest Lichess games for instant Stockfish review.",
    accent: "#ffffff",
    fetchGames: getLichessUserRecentGames,
  },
};
