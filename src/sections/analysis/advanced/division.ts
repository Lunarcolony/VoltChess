import { Chess, type Move } from "chess.js";

export interface GameDivision {
  /** Position index (ply) where the middlegame starts */
  middlegame?: number;
  /** Position index (ply) where the endgame starts */
  endgame?: number;
}

const majorsAndMinors = (chess: Chess): number => {
  let count = 0;
  for (const row of chess.board()) {
    for (const square of row) {
      if (square && square.type !== "p" && square.type !== "k") count++;
    }
  }
  return count;
};

/** A sparse back rank indicates that pieces have been developed/traded. */
const isBackrankSparse = (chess: Chess): boolean => {
  const board = chess.board();
  const backRankCount = (rankIdx: number, color: "w" | "b") =>
    board[rankIdx].filter((sq) => sq && sq.color === color).length;

  // board()[0] is rank 8 (black's back rank), board()[7] is rank 1
  return backRankCount(7, "w") < 4 || backRankCount(0, "b") < 4;
};

/**
 * Simplified port of lichess's game phase divider (scalachess Divider):
 * middlegame when majors+minors <= 10 or a back rank goes sparse,
 * endgame when majors+minors <= 6.
 */
export const computeDivision = (history: Move[]): GameDivision => {
  const division: GameDivision = {};

  for (let i = 0; i < history.length; i++) {
    const chess = new Chess(history[i].after);
    const material = majorsAndMinors(chess);

    if (
      division.middlegame === undefined &&
      (material <= 10 || isBackrankSparse(chess))
    ) {
      division.middlegame = i + 1;
    }

    if (division.endgame === undefined && material <= 6) {
      division.endgame = i + 1;
      break;
    }
  }

  return division;
};
