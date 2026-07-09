import { Chess } from "chess.js";
import type { GameEval, LineEval } from "@/types/eval";
import { moveLineUciToSan } from "@/lib/chess";
import { CLASSIFICATION_GLYPHS, buildSanTokens } from "./lichess";

const MAX_VARIATION_MOVES = 10;

/** [%eval] tag value: pawns with 2 decimals, or #N for forced mates */
const evalTag = (line: LineEval | undefined): string | undefined => {
  if (!line) return undefined;
  if (line.mate !== undefined && line.mate !== 0) return `#${line.mate}`;
  if (line.cp !== undefined) return (line.cp / 100).toFixed(2);
  return undefined;
};

const shortEval = (line: LineEval | undefined): string => {
  if (!line) return "?";
  if (line.mate !== undefined && line.mate !== 0) {
    return `#${line.mate < 0 ? "-" : ""}${Math.abs(line.mate)}`;
  }
  const pawns = (line.cp ?? 0) / 100;
  return pawns.toFixed(2);
};

const buildVariationText = (startFen: string, pv: string[]): string => {
  const tokens = buildSanTokens(startFen, pv, MAX_VARIATION_MOVES);
  return tokens
    .map((token) => {
      const num = token.numberLabel?.replace("…", "...") ?? "";
      return `${num ? `${num} ` : ""}${token.san}`;
    })
    .join(" ");
};

const wrapMoveText = (text: string, width = 80): string => {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.join("\n");
};

/**
 * Lichess-style annotated PGN: glyph suffixes, [%eval]/[%clk] comment tags,
 * judgment comments ("Blunder. Bb3 was best.") and best-line variations.
 */
export const buildAnnotatedPgn = (game: Chess, gameEval: GameEval): string => {
  const headers = game.getHeaders();
  const headerLines = Object.entries(headers)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `[${key} "${value}"]`);

  const comments = new Map(
    game.getComments().map(({ fen, comment }) => [fen, comment])
  );
  const clkOf = (comment: string | undefined): string | undefined =>
    comment?.match(/\[%clk[^\]]*\]/)?.[0];

  const history = game.history({ verbose: true });
  const parts: string[] = [];
  let forceNumber = true;

  history.forEach((move, m) => {
    const isWhite = m % 2 === 0;
    const moveNumber = Math.floor(m / 2) + 1;
    const position = gameEval.positions[m + 1];
    const prevPosition = gameEval.positions[m];
    const classification = position?.moveClassification;
    const glyph = classification
      ? CLASSIFICATION_GLYPHS[classification]
      : undefined;

    if (isWhite) {
      parts.push(`${moveNumber}.`);
    } else if (forceNumber) {
      parts.push(`${moveNumber}...`);
    }
    forceNumber = false;

    parts.push(`${move.san}${glyph?.symbol ?? ""}`);

    // Comment: clock + eval + judgment
    const commentBits: string[] = [];
    const clk = clkOf(comments.get(move.after));
    if (clk) commentBits.push(clk);

    const tag = evalTag(position?.lines?.[0]);
    if (tag) commentBits.push(`[%eval ${tag}]`);

    let variationText: string | undefined;
    if (glyph?.judgment && prevPosition) {
      const bestUci = prevPosition.bestMove ?? prevPosition.lines[0]?.pv[0];
      const playedUci = move.from + move.to + (move.promotion ?? "");
      if (bestUci && bestUci !== playedUci) {
        const bestSan = moveLineUciToSan(move.before)(bestUci);
        commentBits.push(
          `(${shortEval(prevPosition.lines?.[0])} → ${shortEval(position?.lines?.[0])}) ${glyph.judgment}. ${bestSan} was best.`
        );
        const pv = prevPosition.lines[0]?.pv ?? [];
        if (pv.length) {
          variationText = buildVariationText(move.before, pv);
        }
      }
    }

    // Comments/variations interrupt the pair — black must restate "N..."
    if (commentBits.length) {
      parts.push(`{ ${commentBits.join(" ")} }`);
      if (isWhite) forceNumber = true;
    }

    if (variationText) {
      parts.push(`(${variationText})`);
      if (isWhite) forceNumber = true;
    }
  });

  const result =
    headers.Result && headers.Result !== "*" ? headers.Result : "*";
  parts.push(result);

  return `${headerLines.join("\n")}\n\n${wrapMoveText(parts.join(" "))}\n`;
};
