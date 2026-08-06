/** Standard Elo expected score and rating change helpers. */

export type GameResult = "win" | "draw" | "loss";

export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function scoreFromResult(result: GameResult): number {
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}

export function ratingChange(
  rating: number,
  opponentRating: number,
  result: GameResult,
  kFactor = 20
): number {
  const expected = expectedScore(rating, opponentRating);
  const actual = scoreFromResult(result);
  return kFactor * (actual - expected);
}

export function newRating(
  rating: number,
  opponentRating: number,
  result: GameResult,
  kFactor = 20
): number {
  return Math.round(
    rating + ratingChange(rating, opponentRating, result, kFactor)
  );
}

export function winProbability(rating: number, opponentRating: number): number {
  return expectedScore(rating, opponentRating);
}

/** Puzzle Elo update (similar to Lichess-style single-attempt rating). */
export function updatePuzzleElo(
  playerElo: number,
  puzzleElo: number,
  solved: boolean,
  kFactor = 32
): number {
  return newRating(playerElo, puzzleElo, solved ? "win" : "loss", kFactor);
}

export const K_FACTOR_PRESETS = [
  { id: "fide-new", label: "FIDE new (K=40)", k: 40 },
  { id: "fide-standard", label: "FIDE standard (K=20)", k: 20 },
  { id: "fide-master", label: "FIDE 2400+ (K=10)", k: 10 },
  { id: "online", label: "Online estimate (K=32)", k: 32 },
] as const;
