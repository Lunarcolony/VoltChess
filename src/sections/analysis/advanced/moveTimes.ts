import { Chess } from "chess.js";

export interface MoveTimeItem {
  /** 1-based ply (history index + 1) — the goToMove target */
  ply: number;
  moveLabel: string;
  isWhite: boolean;
  /** Seconds spent on this move */
  seconds: number;
  /** Remaining clock after the move, in seconds */
  clockAfter: number;
}

export interface MoveTimesData {
  available: boolean;
  items: MoveTimeItem[];
  /** Total thinking time of both players, in seconds */
  durationSeconds: number;
}

const CLK_REGEX = /\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/;

const parseClkSeconds = (comment: string | undefined): number | undefined => {
  if (!comment) return undefined;
  const match = comment.match(CLK_REGEX);
  if (!match) return undefined;
  return (
    parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
  );
};

/** Parse "600+5" / "180" / "40/5400+30" style TimeControl headers */
const parseTimeControl = (
  header: string | undefined
): { base?: number; increment: number } => {
  if (!header) return { increment: 0 };
  const match = header.match(/(\d+)(?:\+(\d+))?\s*$/);
  if (!match) return { increment: 0 };
  return {
    base: parseInt(match[1]),
    increment: match[2] ? parseInt(match[2]) : 0,
  };
};

/** Extract per-move thinking times from PGN [%clk] annotations. */
export const computeMoveTimes = (game: Chess): MoveTimesData => {
  const history = game.history({ verbose: true });
  const comments = new Map(
    game.getComments().map(({ fen, comment }) => [fen, comment])
  );

  const { base, increment } = parseTimeControl(game.getHeaders().TimeControl);

  const clocks: (number | undefined)[] = history.map((move) =>
    parseClkSeconds(comments.get(move.after))
  );

  const clkCount = clocks.filter((clk) => clk !== undefined).length;
  if (clkCount < Math.min(4, history.length)) {
    return { available: false, items: [], durationSeconds: 0 };
  }

  const firstClk = {
    w: undefined as number | undefined,
    b: undefined as number | undefined,
  };
  history.forEach((move, i) => {
    const side = move.color;
    if (firstClk[side] === undefined && clocks[i] !== undefined) {
      firstClk[side] = clocks[i];
    }
  });

  const prevClock: Record<"w" | "b", number | undefined> = {
    w: base ?? firstClk.w,
    b: base ?? firstClk.b,
  };

  const items: MoveTimeItem[] = [];
  let durationSeconds = 0;

  history.forEach((move, i) => {
    const clk = clocks[i];
    if (clk === undefined) return;

    const side = move.color;
    const before = prevClock[side];
    const seconds =
      before !== undefined ? Math.max(0, before - clk + increment) : 0;
    prevClock[side] = clk;
    durationSeconds += seconds;

    const moveNumber = Math.floor(i / 2) + 1;
    items.push({
      ply: i + 1,
      moveLabel: `${moveNumber}${side === "w" ? "." : "…"} ${move.san}`,
      isWhite: side === "w",
      seconds,
      clockAfter: clk,
    });
  });

  return { available: items.length > 1, items, durationSeconds };
};

export const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/** Lichess move-time y transform: log-scaled so short moves stay visible */
export const moveTimeY = (seconds: number): number => {
  const centis = Math.min(seconds * 100, 12e4);
  const logC = Math.pow(Math.log(3), 2);
  return Math.pow(Math.log(0.005 * centis + 3), 2) - logC;
};
