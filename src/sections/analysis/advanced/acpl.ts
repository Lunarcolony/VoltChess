import { MoveClassification } from "@/types/enums";
import type { PositionEval } from "@/types/eval";
import { ceilsNumber } from "@/lib/math";

export interface PlayerJudgments {
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  acpl: number;
}

export interface JudgmentSummary {
  white: PlayerJudgments;
  black: PlayerJudgments;
}

const lineCp = (position: PositionEval | undefined): number => {
  const line = position?.lines?.[0];
  if (!line) return 0;
  if (line.mate !== undefined && line.mate !== 0) {
    return line.mate > 0 ? 1000 : -1000;
  }
  return ceilsNumber(line.cp ?? 0, -1000, 1000);
};

/**
 * Lichess-style advice summary: judgment counts plus average centipawn loss
 * (AccuracyCP.scala — cp ceiled at ±1000, losses from the mover's POV).
 */
export const computeJudgmentSummary = (
  positions: PositionEval[]
): JudgmentSummary => {
  const empty = (): PlayerJudgments => ({
    inaccuracies: 0,
    mistakes: 0,
    blunders: 0,
    acpl: 0,
  });
  const summary: JudgmentSummary = { white: empty(), black: empty() };
  const losses = { white: [] as number[], black: [] as number[] };

  for (let i = 1; i < positions.length; i++) {
    const isWhiteMove = i % 2 === 1;
    const side = isWhiteMove ? "white" : "black";

    const cpBefore = lineCp(positions[i - 1]);
    const cpAfter = lineCp(positions[i]);
    const loss = isWhiteMove
      ? Math.max(0, cpBefore - cpAfter)
      : Math.max(0, cpAfter - cpBefore);
    losses[side].push(loss);

    switch (positions[i].moveClassification) {
      case MoveClassification.Inaccuracy:
        summary[side].inaccuracies++;
        break;
      case MoveClassification.Mistake:
        summary[side].mistakes++;
        break;
      case MoveClassification.Blunder:
        summary[side].blunders++;
        break;
    }
  }

  for (const side of ["white", "black"] as const) {
    const sideLosses = losses[side];
    summary[side].acpl = sideLosses.length
      ? Math.round(
          sideLosses.reduce((acc, loss) => acc + loss, 0) / sideLosses.length
        )
      : 0;
  }

  return summary;
};
