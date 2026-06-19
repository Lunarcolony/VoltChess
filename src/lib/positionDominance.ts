import { getPositionWinPercentage } from "@/lib/engine/helpers/winPercentage";
import type { PositionEval } from "@/types/eval";
import { MoveClassification } from "@/types/enums";

export type PhaseId = "opening" | "middlegame" | "endgame";

export interface PhaseStats {
  moves: number;
  /** Average win % after this player's moves in the phase */
  avgWinPct: number;
  /** Share of combined phase quality (0–100, sums with opponent per phase) */
  phaseShare: number;
}

export interface PlayerDominanceProfile {
  /** Share of positional quality (0–100, both players sum to 100) */
  dominanceShare: number;
  /** % of own moves after which win chance was ≥ 55% */
  controlShare: number;
  /** Average win-% on positions after their moves */
  avgWinPct: number;
  /** Net eval change per move (player perspective, in win-% points) */
  avgMoveSwing: number;
  /** % of bad moves (≥8% leak) followed by recovery within 2 own moves */
  recoveryRate: number;
  /** Highest win-% reached after any of their moves */
  peakWinPct: number;
  /** Ply index of their single worst eval drop */
  worstLeakMoveIdx: number | null;
  worstLeakPct: number;
  phases: Record<PhaseId, PhaseStats>;
  criticalErrors: number;
}

function phaseForPly(ply: number): PhaseId {
  if (ply <= 12) return "opening";
  if (ply <= 35) return "middlegame";
  return "endgame";
}

function playerWinPct(whiteWinPct: number, isWhite: boolean): number {
  return isWhite ? whiteWinPct : 100 - whiteWinPct;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildProfile(
  isWhite: boolean,
  positions: PositionEval[]
): Omit<PlayerDominanceProfile, "dominanceShare" | "phases"> & {
  qualityRaw: number;
  phaseRaw: Record<PhaseId, number>;
  phases: Record<
    PhaseId,
    Omit<PhaseStats, "phaseShare"> & { qualityRaw: number }
  >;
} {
  const afterWinPcts: number[] = [];
  const moveSwings: number[] = [];
  const phaseWinSums: Record<PhaseId, number> = {
    opening: 0,
    middlegame: 0,
    endgame: 0,
  };
  const phaseMoveCounts: Record<PhaseId, number> = {
    opening: 0,
    middlegame: 0,
    endgame: 0,
  };

  let controlMoves = 0;
  let recoveries = 0;
  let badMoveOpportunities = 0;
  let peakWinPct = 0;
  let worstLeakMoveIdx: number | null = null;
  let worstLeakPct = 0;
  let criticalErrors = 0;

  const leaks: { ply: number; before: number }[] = [];

  for (let i = 1; i < positions.length; i++) {
    const isPlayerMove = isWhite ? i % 2 === 1 : i % 2 === 0;
    if (!isPlayerMove) continue;

    const whiteBefore = getPositionWinPercentage(positions[i - 1]);
    const whiteAfter = getPositionWinPercentage(positions[i]);
    const before = playerWinPct(whiteBefore, isWhite);
    const after = playerWinPct(whiteAfter, isWhite);
    const leak = Math.max(0, before - after);
    const swing = after - before;

    afterWinPcts.push(after);
    moveSwings.push(swing);
    if (after >= 55) controlMoves++;
    peakWinPct = Math.max(peakWinPct, after);

    const phase = phaseForPly(i);
    phaseWinSums[phase] += after;
    phaseMoveCounts[phase]++;

    const cls = positions[i].moveClassification;
    if (
      cls === MoveClassification.Mistake ||
      cls === MoveClassification.Blunder
    ) {
      criticalErrors++;
    }

    if (leak > worstLeakPct) {
      worstLeakPct = leak;
      worstLeakMoveIdx = i;
    }

    if (leak >= 8) {
      leaks.push({ ply: i, before });
    }
  }

  for (const entry of leaks) {
    badMoveOpportunities++;
    const target = entry.before - 5;
    let ownMovesChecked = 0;
    for (
      let j = entry.ply + 1;
      j < positions.length && ownMovesChecked < 2;
      j++
    ) {
      const isPlayerMove = isWhite ? j % 2 === 1 : j % 2 === 0;
      if (!isPlayerMove) continue;
      ownMovesChecked++;
      const win = playerWinPct(getPositionWinPercentage(positions[j]), isWhite);
      if (win >= target) {
        recoveries++;
        break;
      }
    }
  }

  const moveCount = afterWinPcts.length || 1;
  const avgWinPct = afterWinPcts.reduce((s, v) => s + v, 0) / moveCount;
  const avgMoveSwing =
    moveSwings.reduce((s, v) => s + v, 0) / (moveSwings.length || 1);
  const controlShare = (controlMoves / moveCount) * 100;
  const recoveryRate =
    badMoveOpportunities > 0 ? (recoveries / badMoveOpportunities) * 100 : 100;

  const phaseRaw = { opening: 0, middlegame: 0, endgame: 0 } as Record<
    PhaseId,
    number
  >;
  const phases = (["opening", "middlegame", "endgame"] as PhaseId[]).reduce(
    (acc, id) => {
      const moves = phaseMoveCounts[id];
      const phaseAvg = moves ? phaseWinSums[id] / moves : 0;
      const qualityRaw = moves ? phaseAvg : 0;
      phaseRaw[id] = qualityRaw;
      acc[id] = {
        moves,
        avgWinPct: phaseAvg,
        qualityRaw,
      };
      return acc;
    },
    {} as Record<
      PhaseId,
      Omit<PhaseStats, "phaseShare"> & { qualityRaw: number }
    >
  );

  const swingScore = clamp(50 + avgMoveSwing * 2.5, 0, 100);
  const leakPenalty = clamp(100 - worstLeakPct * 1.5, 0, 100);

  const qualityRaw =
    avgWinPct * 0.35 +
    controlShare * 0.25 +
    recoveryRate * 0.15 +
    peakWinPct * 0.1 +
    swingScore * 0.1 +
    leakPenalty * 0.05;

  return {
    qualityRaw,
    phaseRaw,
    controlShare,
    avgWinPct,
    avgMoveSwing,
    recoveryRate,
    peakWinPct,
    worstLeakMoveIdx,
    worstLeakPct,
    phases,
    criticalErrors,
  };
}

function normalizeShare(
  whiteRaw: number,
  blackRaw: number
): { white: number; black: number } {
  const total = whiteRaw + blackRaw;
  if (total <= 0) return { white: 50, black: 50 };
  const white = (whiteRaw / total) * 100;
  return { white, black: 100 - white };
}

export function computePositionDominance(positions: PositionEval[]): {
  white: PlayerDominanceProfile;
  black: PlayerDominanceProfile;
} {
  const whiteBuilt = buildProfile(true, positions);
  const blackBuilt = buildProfile(false, positions);
  const dominance = normalizeShare(
    whiteBuilt.qualityRaw,
    blackBuilt.qualityRaw
  );

  const phases = (["opening", "middlegame", "endgame"] as PhaseId[]).reduce(
    (acc, id) => {
      const phaseShare = normalizeShare(
        whiteBuilt.phases[id].qualityRaw,
        blackBuilt.phases[id].qualityRaw
      );
      acc[id] = {
        moves: whiteBuilt.phases[id].moves,
        avgWinPct: whiteBuilt.phases[id].avgWinPct,
        phaseShare: phaseShare.white,
      };
      return acc;
    },
    {} as Record<PhaseId, PhaseStats>
  );

  const blackPhases = (
    ["opening", "middlegame", "endgame"] as PhaseId[]
  ).reduce(
    (acc, id) => {
      const phaseShare = normalizeShare(
        whiteBuilt.phases[id].qualityRaw,
        blackBuilt.phases[id].qualityRaw
      );
      acc[id] = {
        moves: blackBuilt.phases[id].moves,
        avgWinPct: blackBuilt.phases[id].avgWinPct,
        phaseShare: phaseShare.black,
      };
      return acc;
    },
    {} as Record<PhaseId, PhaseStats>
  );

  return {
    white: {
      dominanceShare: dominance.white,
      controlShare: whiteBuilt.controlShare,
      avgWinPct: whiteBuilt.avgWinPct,
      avgMoveSwing: whiteBuilt.avgMoveSwing,
      recoveryRate: whiteBuilt.recoveryRate,
      peakWinPct: whiteBuilt.peakWinPct,
      worstLeakMoveIdx: whiteBuilt.worstLeakMoveIdx,
      worstLeakPct: whiteBuilt.worstLeakPct,
      phases,
      criticalErrors: whiteBuilt.criticalErrors,
    },
    black: {
      dominanceShare: dominance.black,
      controlShare: blackBuilt.controlShare,
      avgWinPct: blackBuilt.avgWinPct,
      avgMoveSwing: blackBuilt.avgMoveSwing,
      recoveryRate: blackBuilt.recoveryRate,
      peakWinPct: blackBuilt.peakWinPct,
      worstLeakMoveIdx: blackBuilt.worstLeakMoveIdx,
      worstLeakPct: blackBuilt.worstLeakPct,
      phases: blackPhases,
      criticalErrors: blackBuilt.criticalErrors,
    },
  };
}
