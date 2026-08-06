export interface PuzzleData {
  id: string;
  fen: string;
  rating: number;
  themes: string[];
  /** UCI moves: player move, opponent reply, player move, … */
  solution: string[];
  description: string;
}

export const PUZZLE_BANK: PuzzleData[] = [
  {
    id: "back-rank-rook-mate",
    fen: "6k1/5ppp/8/8/8/8/6PP/3R3K w - - 0 1",
    rating: 700,
    themes: ["mate", "backRank", "rook"],
    solution: ["d1d8"],
    description: "Slide the rook to the back rank — the king has no escape.",
  },
  {
    id: "back-rank-queen-mate",
    fen: "6k1/5ppp/8/8/8/8/6PP/2Q4K w - - 0 1",
    rating: 750,
    themes: ["mate", "backRank", "queen"],
    solution: ["c1c8"],
    description: "The queen delivers mate along the open back rank.",
  },
  {
    id: "rook-ladder-mate",
    fen: "7k/R7/8/8/8/8/1R6/K7 w - - 0 1",
    rating: 800,
    themes: ["mate", "rookLadder", "endgame"],
    solution: ["b2b8"],
    description:
      "The a7 rook cuts off the seventh rank, so the other rook delivers a ladder mate.",
  },
  {
    id: "smothered-mate",
    fen: "6rk/6pp/8/4N3/8/8/8/K7 w - - 0 1",
    rating: 1400,
    themes: ["mate", "smotheredMate", "knight"],
    solution: ["e5f7"],
    description:
      "The king's own pieces box it in — a single knight hop delivers a smothered mate.",
  },
  {
    id: "supported-queen-mate",
    fen: "7k/8/8/7N/8/8/8/K5Q1 w - - 0 1",
    rating: 950,
    themes: ["mate", "queenMate", "knight"],
    solution: ["g1g7"],
    description:
      "The queen delivers mate on g7, protected by the knight on h5.",
  },
  {
    id: "knight-fork-king-queen",
    fen: "6k1/3q4/8/8/4N3/8/8/K7 w - - 0 1",
    rating: 1000,
    themes: ["fork", "knight"],
    solution: ["e4f6", "g8f8", "f6d7"],
    description:
      "Fork the king and queen with a knight move, then win the queen.",
  },
  {
    id: "pinned-knight-capture",
    fen: "4k3/8/4n3/8/8/8/8/K3R3 w - - 0 1",
    rating: 800,
    themes: ["pin", "removeDefender", "rook"],
    solution: ["e1e6"],
    description:
      "The knight is pinned to the king along the e-file — simply win it.",
  },
  {
    id: "e-file-skewer",
    fen: "4q3/8/4k3/8/8/8/8/K6R w - - 0 1",
    rating: 1000,
    themes: ["skewer", "rook"],
    solution: ["h1e1", "e6d6", "e1e8"],
    description:
      "Skewer the king and queen along the e-file — the king must move, then take the queen.",
  },
  {
    id: "discovered-check-queen-win",
    fen: "3k4/8/1q6/3N4/8/8/8/K2R4 w - - 0 1",
    rating: 1300,
    themes: ["discoveredAttack", "fork", "knight"],
    solution: ["d5b6"],
    description:
      "Capture the queen with the knight while uncovering a discovered check from the rook.",
  },
  {
    id: "overloaded-defender",
    fen: "r3k3/8/1n6/3B4/7K/8/8/R7 w - - 0 1",
    rating: 1400,
    themes: ["removeDefender", "overloading", "rook", "bishop"],
    solution: ["a1a8", "b6a8", "d5a8"],
    description:
      "Trade rooks, let the knight recapture, then win it with the bishop — the defender was overloaded.",
  },
  {
    id: "sixth-rank-double-attack",
    fen: "4k3/8/r6b/8/8/8/8/3Q3K w - - 0 1",
    rating: 1100,
    themes: ["doubleAttack", "queen"],
    solution: ["d1d6"],
    description:
      "One queen move attacks both undefended pieces on the sixth rank.",
  },
  {
    id: "hanging-knight",
    fen: "4k3/8/8/1n6/8/8/4B3/K7 w - - 0 1",
    rating: 650,
    themes: ["hangingPiece", "bishop"],
    solution: ["e2b5"],
    description:
      "The knight is undefended — simply capture it with the bishop.",
  },
  {
    id: "trapped-bishop",
    fen: "4k3/8/8/8/8/8/1pN5/b6K w - - 0 1",
    rating: 1200,
    themes: ["trappedPiece", "knight"],
    solution: ["c2a1"],
    description:
      "The bishop has no legal moves left — it's completely trapped. Win it with the knight.",
  },
  {
    id: "simple-promotion",
    fen: "4k3/P7/8/8/8/8/8/7K w - - 0 1",
    rating: 900,
    themes: ["promotion", "endgame"],
    solution: ["a7a8q"],
    description: "Promote the pawn to a brand-new queen.",
  },
  {
    id: "knight-fork-two-rooks",
    fen: "r1r1k3/8/8/3N4/8/8/8/7K w - - 0 1",
    rating: 1050,
    themes: ["fork", "knight", "doubleAttack"],
    solution: ["d5b6"],
    description:
      "One knight move attacks both rooks — you'll win at least one.",
  },
  {
    id: "diagonal-pin-capture",
    fen: "7k/8/5r2/8/8/8/8/B6K w - - 0 1",
    rating: 850,
    themes: ["pin", "bishop"],
    solution: ["a1f6"],
    description:
      "The rook is pinned to the king on the long diagonal and can't escape — win it with the bishop.",
  },
  {
    id: "queen-check-and-attack",
    fen: "4k3/8/8/8/b6Q/8/8/K7 w - - 0 1",
    rating: 1150,
    themes: ["doubleAttack", "check", "queen"],
    solution: ["h4e4"],
    description:
      "One queen move both checks the king and attacks the bishop on the same rank.",
  },
  {
    id: "rook-fork-file",
    fen: "k7/8/3b4/8/7R/8/3n4/7K w - - 0 1",
    rating: 950,
    themes: ["fork", "rook", "doubleAttack"],
    solution: ["h4d4"],
    description:
      "The rook slides to the d-file, attacking the bishop and knight at the same time.",
  },
  {
    id: "discovered-check-bishop",
    fen: "6k1/2r5/4N3/8/8/1B6/8/7K w - - 0 1",
    rating: 1250,
    themes: ["discoveredAttack", "fork", "knight"],
    solution: ["e6c7"],
    description:
      "Capture the rook with the knight, uncovering a discovered check from the bishop.",
  },
  {
    id: "back-rank-hanging-rook",
    fen: "7r/8/8/k7/8/8/8/K6R w - - 0 1",
    rating: 700,
    themes: ["hangingPiece", "backRank", "rook"],
    solution: ["h1h8"],
    description:
      "Nothing defends the rook on the back rank and the king is too far away — take it.",
  },
  {
    id: "double-check-knight-rook",
    fen: "4k3/8/8/8/4N3/8/8/K3R3 w - - 0 1",
    rating: 1300,
    themes: ["discoveredAttack", "doubleCheck", "knight", "rook"],
    solution: ["e4d6"],
    description:
      "This knight move delivers a double check — from the knight and the rook behind it.",
  },
  {
    id: "promotion-capture",
    fen: "r3k3/1P6/8/8/8/8/8/7K w - - 0 1",
    rating: 950,
    themes: ["promotion", "hangingPiece"],
    solution: ["b7a8q"],
    description:
      "Promote by capturing the undefended rook — a brand-new queen for the price of a pawn.",
  },
  {
    id: "knight-fork-king-rook",
    fen: "2r5/8/2N3k1/8/8/8/8/K7 w - - 0 1",
    rating: 1000,
    themes: ["fork", "knight"],
    solution: ["c6e7"],
    description: "Fork the king and rook with a single knight move.",
  },
  {
    id: "queen-fork-check",
    fen: "1k6/8/8/4r2Q/8/8/8/K7 w - - 0 1",
    rating: 1150,
    themes: ["fork", "queen", "check"],
    solution: ["h5e8"],
    description:
      "One queen move checks the king and attacks the rook at the same time.",
  },
  {
    id: "rook-and-king-mate",
    fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1",
    rating: 800,
    themes: ["mate", "backRank", "endgame"],
    solution: ["h1h8"],
    description:
      "The rook delivers mate along the back rank while your king guards the escape squares.",
  },
];

export default PUZZLE_BANK;
