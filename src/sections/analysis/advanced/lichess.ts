import { Chess } from "chess.js";
import { MoveClassification } from "@/types/enums";
import type { LineEval } from "@/types/eval";
import { uciMoveParams } from "@/lib/chess";
import { ceilsNumber } from "@/lib/math";

/**
 * Exact colors used by lichess.org for analysis semantics
 * (ui/lib/css/theme/_theme.default.scss + ui/chart/src/index.ts).
 */
export const LICHESS_COLORS = {
  inaccuracy: "#53b2ea",
  mistake: "#e69f00",
  blunder: "#df5353",
  goodMove: "#629924",
  brilliant: "#21c43a",
  interesting: "#f075e1",
  chartLine: "#d85000",
  chartWhiteFill: "rgba(255, 255, 255, 0.28)",
  chartBlackFill: "rgba(0, 0, 0, 0.85)",
  chartDotBlunder: "#db3031",
  chartDotMistake: "#e69d00",
  chartDotInaccuracy: "#4da3d5",
  primary: "#3692e7",
  threat: "#cc3333",
} as const;

export interface MoveGlyph {
  symbol: string;
  color: string;
  /** Lichess judgment word used in inline comments */
  judgment?: string;
}

/** Lichess glyph mapping for our move classifications */
export const CLASSIFICATION_GLYPHS: Partial<
  Record<MoveClassification, MoveGlyph>
> = {
  [MoveClassification.Blunder]: {
    symbol: "??",
    color: LICHESS_COLORS.blunder,
    judgment: "Blunder",
  },
  [MoveClassification.Mistake]: {
    symbol: "?",
    color: LICHESS_COLORS.mistake,
    judgment: "Mistake",
  },
  [MoveClassification.Inaccuracy]: {
    symbol: "?!",
    color: LICHESS_COLORS.inaccuracy,
    judgment: "Inaccuracy",
  },
  [MoveClassification.Splendid]: {
    symbol: "!!",
    color: LICHESS_COLORS.brilliant,
  },
  [MoveClassification.Perfect]: {
    symbol: "!",
    color: LICHESS_COLORS.goodMove,
  },
};

export const JUDGED_CLASSIFICATIONS = [
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
] as const;

/** Lichess pearl format: cp rounded to 1 decimal ("+0.3"), mate as "#4" */
export const renderLichessEval = (
  line: Pick<LineEval, "cp" | "mate"> | undefined
): string => {
  if (!line) return "-";

  if (line.mate !== undefined && line.mate !== 0) {
    return `#${line.mate < 0 ? "-" : ""}${Math.abs(line.mate)}`;
  }

  if (line.cp !== undefined) {
    const rounded = ceilsNumber(Math.round(line.cp / 10) / 10, -99, 99);
    return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
  }

  return "-";
};

/**
 * Lichess winning chances, white POV, in [-1, 1].
 * winningChances(cp) = 2 / (1 + e^(-0.00368208 * cp)) - 1
 * Mate mapped like the lichess client: cp = (21 - min(10, |mate|)) * 100.
 */
export const getWinningChances = (
  line: Pick<LineEval, "cp" | "mate"> | undefined
): number => {
  if (!line) return 0;

  let cp: number;
  if (line.mate !== undefined && line.mate !== 0) {
    cp = Math.sign(line.mate) * (21 - Math.min(10, Math.abs(line.mate))) * 100;
  } else {
    cp = ceilsNumber(line.cp ?? 0, -1000, 1000);
  }

  const chances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return ceilsNumber(chances, -1, 1);
};

/** Format nodes-per-second like lichess: "512 kn/s" or "1.2 Mn/s" */
export const formatKnps = (nps: number | undefined): string | undefined => {
  if (!nps) return undefined;
  const knps = nps / 1000;
  if (knps >= 1000) return `${(knps / 1000).toFixed(1)} Mn/s`;
  return `${Math.round(knps)} kn/s`;
};

export interface SanToken {
  san: string;
  /** Number prefix rendered before the SAN, e.g. "12." or "12…" */
  numberLabel?: string;
  color: "w" | "b";
  /** UCI moves from the start position up to and including this move */
  uciSequence: string[];
}

/**
 * Convert a UCI line starting from `fen` into SAN tokens with move numbers,
 * lichess-style ("12. Nf3 d5 13. Qe2 …"). Stops at the first illegal move.
 */
export const buildSanTokens = (
  fen: string,
  uciMoves: string[],
  maxMoves = Infinity
): SanToken[] => {
  const chess = new Chess(fen);
  const tokens: SanToken[] = [];

  for (const [index, uci] of uciMoves.entries()) {
    if (index >= maxMoves) break;

    const moveNumber = chess.moveNumber();
    const color = chess.turn();

    let san: string;
    try {
      san = chess.move(uciMoveParams(uci)).san;
    } catch {
      break;
    }

    const numberLabel =
      color === "w"
        ? `${moveNumber}.`
        : index === 0
          ? `${moveNumber}…`
          : undefined;

    tokens.push({
      san,
      numberLabel,
      color,
      uciSequence: uciMoves.slice(0, index + 1),
    });
  }

  return tokens;
};
