import { getPositionWinPercentage } from "@/lib/engine/helpers/winPercentage";
import type { PositionEval } from "@/types/eval";

export interface PlayerEvalLead {
  /** Share of game spent with the eval advantage (0–100, both players sum to 100) */
  leadShare: number;
  /** Highest win % reached while ahead */
  peakAdvantage: number;
  /** Longest consecutive stretch with >50% win chance */
  longestRun: number;
  /** Times the player climbed from <45% to >55% win chance */
  comebacks: number;
}

function playerWinPct(whiteWinPct: number, isWhite: boolean): number {
  return isWhite ? whiteWinPct : 100 - whiteWinPct;
}

function longestRunAbove(
  series: number[],
  threshold: number
): number {
  let best = 0;
  let current = 0;
  for (const value of series) {
    if (value > threshold) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function countComebacks(series: number[]): number {
  let comebacks = 0;
  let wasLosing = false;
  for (const value of series) {
    if (value < 45) wasLosing = true;
    else if (wasLosing && value > 55) {
      comebacks++;
      wasLosing = false;
    }
  }
  return comebacks;
}

function buildProfile(
  isWhite: boolean,
  positions: PositionEval[]
): Omit<PlayerEvalLead, "leadShare"> & { aheadMoves: number } {
  const winSeries: number[] = [];
  let aheadMoves = 0;
  let peakAdvantage = 0;

  for (let i = 1; i < positions.length; i++) {
    const win = playerWinPct(getPositionWinPercentage(positions[i]), isWhite);
    winSeries.push(win);
    if (win > 50) {
      aheadMoves++;
      peakAdvantage = Math.max(peakAdvantage, win);
    }
  }

  return {
    aheadMoves,
    peakAdvantage,
    longestRun: longestRunAbove(winSeries, 50),
    comebacks: countComebacks(winSeries),
  };
}

export function computeEvalLead(positions: PositionEval[]): {
  white: PlayerEvalLead;
  black: PlayerEvalLead;
} {
  if (positions.length < 2) {
    const empty: PlayerEvalLead = {
      leadShare: 50,
      peakAdvantage: 50,
      longestRun: 0,
      comebacks: 0,
    };
    return { white: empty, black: empty };
  }

  const whiteRaw = buildProfile(true, positions);
  const blackRaw = buildProfile(false, positions);

  const equalMoves =
    positions.length - 1 - whiteRaw.aheadMoves - blackRaw.aheadMoves;
  const totalMoves = positions.length - 1;
  const whiteLeadShare =
    ((whiteRaw.aheadMoves + equalMoves / 2) / totalMoves) * 100;
  const blackLeadShare = 100 - whiteLeadShare;

  return {
    white: {
      leadShare: whiteLeadShare,
      peakAdvantage: whiteRaw.peakAdvantage,
      longestRun: whiteRaw.longestRun,
      comebacks: whiteRaw.comebacks,
    },
    black: {
      leadShare: blackLeadShare,
      peakAdvantage: blackRaw.peakAdvantage,
      longestRun: blackRaw.longestRun,
      comebacks: blackRaw.comebacks,
    },
  };
}
