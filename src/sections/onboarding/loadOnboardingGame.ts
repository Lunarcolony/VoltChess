import { Chess } from "chess.js";
import { getGameFromPgn } from "@/lib/chess";
import { getChessComUserRecentGames } from "@/lib/chessCom";
import { getLichessUserRecentGames } from "@/lib/lichess";
import type { LoadedGame } from "@/types/game";
import type { OnboardingPlatform } from "./constants";

export interface OnboardingGameResult {
  game: Chess;
  boardOrientation: boolean;
}

export async function loadGamesForUser(
  username: string,
  platform: OnboardingPlatform,
  signal?: AbortSignal
): Promise<LoadedGame[]> {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error("Please enter a username.");
  }

  const games =
    platform === "chesscom"
      ? await getChessComUserRecentGames(trimmed, signal)
      : await getLichessUserRecentGames(trimmed, signal);

  if (!games.length) {
    throw new Error("No recent games found for that username.");
  }

  return games;
}

export function loadedGameToChess(
  loaded: LoadedGame,
  username: string
): OnboardingGameResult {
  const game = getGameFromPgn(loaded.pgn);
  const boardOrientation =
    username.trim().toLowerCase() !== loaded.black?.name?.toLowerCase();
  return { game, boardOrientation };
}

export async function loadFirstGameForUser(
  username: string,
  platform: OnboardingPlatform,
  signal?: AbortSignal
): Promise<OnboardingGameResult> {
  const games = await loadGamesForUser(username, platform, signal);
  return loadedGameToChess(games[0], username);
}
