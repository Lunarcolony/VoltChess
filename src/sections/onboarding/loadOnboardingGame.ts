import { Chess } from "chess.js";
import { getGameFromPgn } from "@/lib/chess";
import { getChessComUserRecentGames } from "@/lib/chessCom";
import { getLichessUserRecentGames } from "@/lib/lichess";
import type { OnboardingPlatform } from "./constants";

export interface OnboardingGameResult {
  game: Chess;
  boardOrientation: boolean;
}

export async function loadFirstGameForUser(
  username: string,
  platform: OnboardingPlatform,
  signal?: AbortSignal
): Promise<OnboardingGameResult> {
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

  const recent = games[0];
  const game = getGameFromPgn(recent.pgn);
  const boardOrientation =
    trimmed.toLowerCase() !== recent.black?.name?.toLowerCase();

  return { game, boardOrientation };
}
