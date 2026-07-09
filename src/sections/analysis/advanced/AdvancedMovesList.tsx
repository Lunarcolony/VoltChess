import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess, Move } from "chess.js";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { usePalette } from "@/hooks/usePalette";
import { useChessActions } from "@/hooks/useChessActions";
import { moveLineUciToSan, uciMoveParams } from "@/lib/chess";
import { playSoundFromMove } from "@/lib/sounds";
import type { GameEval } from "@/types/eval";
import PrettyMoveSan from "@/components/prettyMoveSan";
import {
  CLASSIFICATION_GLYPHS,
  buildSanTokens,
  renderLichessEval,
  type SanToken,
} from "./lichess";

const MAX_VARIATION_MOVES = 12;

interface MoveCell {
  san: string;
  color: "w" | "b";
  /** history length after this move — the goToMove target */
  moveIdx: number;
  glyphSymbol?: string;
  glyphColor?: string;
  evalLabel?: string;
}

interface InterruptData {
  key: string;
  judgment?: { label: string; bestSan: string; color: string };
  commentText?: string;
  variation?: {
    tokens: SanToken[];
    baseMoveIdx: number;
    isLive?: boolean;
    activeTokenIdx?: number;
  };
}

type RenderItem =
  | {
      type: "row";
      moveNumber: number;
      white?: MoveCell;
      black?: MoveCell;
      whiteEmpty?: boolean;
      blackEmpty?: boolean;
    }
  | { type: "interrupt"; data: InterruptData };

const stripPgnTags = (comment: string): string =>
  comment
    .replace(/\[%[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildRenderItems = (
  history: Move[],
  gameEval: GameEval | undefined,
  comments: Map<string, string>,
  fork: { idx: number; tokens: SanToken[]; activeTokenIdx: number } | null
): RenderItem[] => {
  const items: RenderItem[] = [];
  let row: Extract<RenderItem, { type: "row" }> | null = null;

  const closeRow = () => {
    if (row) items.push(row);
    row = null;
  };

  const interruptsFor = (m: number): InterruptData[] => {
    const result: InterruptData[] = [];
    const position = gameEval?.positions[m + 1];
    const prevPosition = gameEval?.positions[m];
    const classification = position?.moveClassification;
    const glyph = classification
      ? CLASSIFICATION_GLYPHS[classification]
      : undefined;

    const commentText = stripPgnTags(comments.get(history[m].after) ?? "");

    if (glyph?.judgment && prevPosition) {
      const bestUci = prevPosition.bestMove ?? prevPosition.lines[0]?.pv[0];
      const playedUci =
        history[m].from + history[m].to + (history[m].promotion ?? "");

      if (bestUci && bestUci !== playedUci) {
        const bestSan = moveLineUciToSan(history[m].before)(bestUci);
        const pv = prevPosition.lines[0]?.pv ?? [];
        result.push({
          key: `judgment-${m}`,
          judgment: {
            label: `${glyph.judgment}. ${bestSan} was best.`,
            bestSan,
            color: glyph.color,
          },
          commentText: commentText || undefined,
          variation: pv.length
            ? {
                tokens: buildSanTokens(
                  history[m].before,
                  pv,
                  MAX_VARIATION_MOVES
                ),
                baseMoveIdx: m,
              }
            : undefined,
        });
      }
    } else if (commentText) {
      result.push({ key: `comment-${m}`, commentText });
    }

    if (fork && fork.idx === m + 1) {
      result.push({
        key: `fork-${m}`,
        variation: {
          tokens: fork.tokens,
          baseMoveIdx: fork.idx - 1,
          isLive: true,
          activeTokenIdx: fork.activeTokenIdx,
        },
      });
    }

    return result;
  };

  for (let m = 0; m < history.length; m++) {
    const isWhite = m % 2 === 0;
    const moveNumber = Math.floor(m / 2) + 1;
    const position = gameEval?.positions[m + 1];
    const glyph = position?.moveClassification
      ? CLASSIFICATION_GLYPHS[position.moveClassification]
      : undefined;

    const cell: MoveCell = {
      san: history[m].san,
      color: isWhite ? "w" : "b",
      moveIdx: m + 1,
      glyphSymbol: glyph?.symbol,
      glyphColor: glyph?.color,
      evalLabel: position?.lines?.[0]
        ? renderLichessEval(position.lines[0])
        : undefined,
    };

    if (isWhite) {
      closeRow();
      row = { type: "row", moveNumber, white: cell };
    } else {
      if (!row) row = { type: "row", moveNumber, whiteEmpty: true };
      row.black = cell;
    }

    const interrupts = interruptsFor(m);
    if (interrupts.length) {
      if (isWhite && row) row.blackEmpty = true;
      closeRow();
      for (const data of interrupts) items.push({ type: "interrupt", data });
    }
  }

  closeRow();

  // Variation starting before the first move, or extending past the mainline
  if (fork && (fork.idx === 0 || fork.idx > history.length)) {
    items.push({
      type: "interrupt",
      data: {
        key: "fork-tail",
        variation: {
          tokens: fork.tokens,
          baseMoveIdx: Math.min(fork.idx - 1, history.length),
          isLive: true,
          activeTokenIdx: fork.activeTokenIdx,
        },
      },
    });
  }

  return items;
};

export default function AdvancedMovesList() {
  const palette = usePalette();
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const position = useAtomValue(currentPositionAtom);
  const setBoard = useSetAtom(boardAtom);
  const { goToMove } = useChessActions(boardAtom);
  const containerRef = useRef<HTMLDivElement>(null);

  const gameHistory = useMemo(() => game.history({ verbose: true }), [game]);
  const boardHistory = useMemo(() => board.history({ verbose: true }), [board]);
  const usingBoardAsMainline = gameHistory.length === 0;
  const history = usingBoardAsMainline ? boardHistory : gameHistory;
  const navGame = usingBoardAsMainline ? board : game;

  const comments = useMemo(() => {
    const map = new Map<string, string>();
    for (const { fen, comment } of navGame.getComments()) {
      map.set(fen, comment);
    }
    return map;
  }, [navGame]);

  // Divergence between the navigable board and the mainline game
  const fork = useMemo(() => {
    if (usingBoardAsMainline) return null;

    let idx = 0;
    while (
      idx < boardHistory.length &&
      idx < gameHistory.length &&
      boardHistory[idx].san === gameHistory[idx].san
    ) {
      idx++;
    }
    if (boardHistory.length <= idx) return null;

    const ucis = boardHistory
      .slice(idx)
      .map((m) => m.from + m.to + (m.promotion ?? ""));
    const tokens = buildSanTokens(boardHistory[idx].before, ucis);

    return {
      idx,
      tokens,
      activeTokenIdx: boardHistory.length - idx - 1,
    };
  }, [usingBoardAsMainline, boardHistory, gameHistory]);

  const renderItems = useMemo(
    () =>
      buildRenderItems(
        history,
        usingBoardAsMainline ? undefined : gameEval,
        comments,
        fork
      ),
    [history, gameEval, comments, fork, usingBoardAsMainline]
  );

  const currentMoveIdx = fork
    ? undefined
    : usingBoardAsMainline
      ? boardHistory.length
      : position.currentMoveIdx;

  const playVariation = useCallback(
    (baseMoveIdx: number, ucis: string[]) => {
      try {
        const newGame = new Chess();
        newGame.loadPgn(navGame.pgn());
        while (newGame.history().length > baseMoveIdx) newGame.undo();

        let lastMove: Move | null = null;
        for (const uci of ucis) {
          lastMove = newGame.move(uciMoveParams(uci));
        }
        setBoard(newGame);
        if (lastMove) playSoundFromMove(lastMove);
      } catch {
        // Illegal continuation (stale eval) — ignore the click
      }
    },
    [navGame, setBoard]
  );

  // Keep the active move visible without scrolling the page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const active = container.querySelector<HTMLElement>("[data-active-move]");
    if (!active) return;

    const offsetTop = active.offsetTop - container.offsetTop;
    const offsetBottom = offsetTop + active.offsetHeight;
    if (offsetTop < container.scrollTop) {
      container.scrollTop = offsetTop - container.clientHeight / 2;
    } else if (offsetBottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = offsetBottom - container.clientHeight / 2;
    }
  }, [currentMoveIdx, fork, boardHistory.length]);

  const openingName = position.eval?.opening ?? position.opening;
  const headers = navGame.getHeaders();
  const result = headers.Result && headers.Result !== "*" ? headers.Result : "";

  const renderCell = (
    cell: MoveCell | undefined,
    empty: boolean | undefined
  ) => {
    if (!cell) {
      return (
        <Box
          sx={{
            px: 0.75,
            py: 0.4,
            color: palette.textMuted,
            fontSize: "0.85rem",
          }}
        >
          {empty ? "…" : ""}
        </Box>
      );
    }

    const isActive = currentMoveIdx === cell.moveIdx;
    const textColor = cell.glyphColor ?? palette.text;

    return (
      <Box
        data-active-move={isActive ? "true" : undefined}
        onClick={() => !isActive && goToMove(cell.moveIdx, navGame)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.75,
          py: 0.4,
          cursor: isActive ? "default" : "pointer",
          bgcolor: isActive ? alpha(palette.accent, 0.18) : "transparent",
          borderLeft: isActive
            ? `2px solid ${palette.accent}`
            : "2px solid transparent",
          "&:hover": isActive ? undefined : { bgcolor: palette.surfaceRaised },
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          sx={{
            color: textColor,
            fontWeight: isActive ? 700 : 500,
            minWidth: 0,
          }}
        >
          <PrettyMoveSan
            san={cell.san}
            color={cell.color}
            typographyProps={{ fontSize: "0.85rem", color: "inherit" }}
          />
          {cell.glyphSymbol && (
            <Typography
              component="span"
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: cell.glyphColor,
                ml: 0.15,
              }}
            >
              {cell.glyphSymbol}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }} />

        {cell.evalLabel && (
          <Typography
            component="span"
            sx={{
              fontSize: "0.68rem",
              color: palette.textMuted,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {cell.evalLabel}
          </Typography>
        )}
      </Box>
    );
  };

  const renderVariationTokens = (
    variation: NonNullable<InterruptData["variation"]>,
    color: string
  ) =>
    variation.tokens.map((token, i) => {
      const isActive = variation.isLive && variation.activeTokenIdx === i;
      return (
        <Box
          key={`${token.san}-${i}`}
          component="span"
          data-active-move={isActive ? "true" : undefined}
          onClick={() =>
            playVariation(variation.baseMoveIdx, token.uciSequence)
          }
          sx={{
            cursor: "pointer",
            borderRadius: 0.5,
            px: 0.2,
            bgcolor: isActive ? alpha(color, 0.25) : "transparent",
            fontWeight: isActive ? 700 : 400,
            "&:hover": { bgcolor: alpha(color, 0.18) },
          }}
        >
          {token.numberLabel && (
            <Typography
              component="span"
              sx={{ fontSize: "0.72rem", color: palette.textMuted, mr: 0.2 }}
            >
              {token.numberLabel}
            </Typography>
          )}
          <PrettyMoveSan
            san={token.san}
            color={token.color}
            typographyProps={{
              fontSize: "0.78rem",
              fontStyle: "italic",
              color: "inherit",
            }}
          />{" "}
        </Box>
      );
    });

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      {openingName && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1,
            py: 0.6,
            borderBottom: `1px solid ${palette.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <Icon
            icon="mdi:book-open-variant"
            width={14}
            color={palette.textMuted}
          />
          <Typography fontSize="0.72rem" color="text.secondary" noWrap>
            {openingName}
          </Typography>
        </Box>
      )}

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          maxHeight: { xs: "38vh", md: "none" },
          position: "relative",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: palette.border,
            borderRadius: 3,
          },
        }}
      >
        {history.length === 0 ? (
          <Typography
            sx={{
              p: 2,
              fontSize: "0.82rem",
              color: palette.textMuted,
              textAlign: "center",
            }}
          >
            Play moves on the board or load a game to explore lines.
          </Typography>
        ) : (
          renderItems.map((item, itemIdx) => {
            if (item.type === "row") {
              return (
                <Box
                  key={`row-${itemIdx}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2.25rem 1fr 1fr",
                    alignItems: "stretch",
                    borderBottom: `1px solid ${alpha(palette.borderSubtle, 0.5)}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: palette.surfaceRaised,
                      color: palette.textMuted,
                      fontSize: "0.72rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.moveNumber}
                  </Box>
                  {renderCell(item.white, item.whiteEmpty)}
                  {renderCell(item.black, item.blackEmpty)}
                </Box>
              );
            }

            const { data } = item;
            const accentColor = data.judgment?.color ?? palette.accent;

            return (
              <Box
                key={data.key}
                sx={{
                  px: 1,
                  py: 0.6,
                  bgcolor: alpha(palette.surfaceRaised, 0.6),
                  borderBottom: `1px solid ${alpha(palette.borderSubtle, 0.5)}`,
                  borderLeft: `2px solid ${alpha(accentColor, 0.6)}`,
                }}
              >
                {data.judgment && (
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: data.judgment.color,
                      mb: data.variation ? 0.35 : 0,
                    }}
                  >
                    {data.judgment.label}
                  </Typography>
                )}

                {data.commentText && (
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: palette.textMuted,
                      fontStyle: "italic",
                      mb: data.variation ? 0.35 : 0,
                    }}
                  >
                    {data.commentText}
                  </Typography>
                )}

                {data.variation && (
                  <Box
                    sx={{
                      lineHeight: 1.7,
                      color: data.variation.isLive
                        ? palette.text
                        : palette.textMuted,
                    }}
                  >
                    {data.variation.isLive && (
                      <Icon
                        icon="mdi:source-branch"
                        width={12}
                        color={palette.accent}
                        style={{ marginRight: 4, verticalAlign: "middle" }}
                      />
                    )}
                    {renderVariationTokens(data.variation, accentColor)}
                  </Box>
                )}
              </Box>
            );
          })
        )}

        {result && history.length > 0 && (
          <Box sx={{ py: 1, textAlign: "center" }}>
            <Typography fontSize="0.85rem" fontWeight={700}>
              {result}
            </Typography>
            {headers.Termination && (
              <Typography fontSize="0.7rem" color="text.secondary">
                {headers.Termination}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
