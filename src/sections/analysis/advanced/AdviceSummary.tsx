import { Box, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { usePalette } from "@/hooks/usePalette";
import { useChessActions } from "@/hooks/useChessActions";
import { usePlayersData } from "@/hooks/usePlayersData";
import { MoveClassification } from "@/types/enums";
import { computeJudgmentSummary } from "./acpl";
import { CLASSIFICATION_GLYPHS, LICHESS_COLORS } from "./lichess";

const JUDGMENT_ROWS = [
  {
    classification: MoveClassification.Inaccuracy,
    label: (n: number) => (n === 1 ? "Inaccuracy" : "Inaccuracies"),
  },
  {
    classification: MoveClassification.Mistake,
    label: (n: number) => (n === 1 ? "Mistake" : "Mistakes"),
  },
  {
    classification: MoveClassification.Blunder,
    label: (n: number) => (n === 1 ? "Blunder" : "Blunders"),
  },
] as const;

function PlayerSummary({ isWhite }: { isWhite: boolean }) {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const { goToMove } = useChessActions(boardAtom);
  const { white, black } = usePlayersData(gameAtom);

  const summary = useMemo(
    () => (gameEval ? computeJudgmentSummary(gameEval.positions) : undefined),
    [gameEval]
  );

  if (!gameEval || !summary) return null;

  const player = isWhite ? white : black;
  const side = isWhite ? summary.white : summary.black;
  const accuracy = isWhite ? gameEval.accuracy.white : gameEval.accuracy.black;

  const counts: Record<
    (typeof JUDGMENT_ROWS)[number]["classification"],
    number
  > = {
    [MoveClassification.Inaccuracy]: side.inaccuracies,
    [MoveClassification.Mistake]: side.mistakes,
    [MoveClassification.Blunder]: side.blunders,
  };

  const jumpToNext = (classification: MoveClassification) => {
    const matches = (idx: number) =>
      gameEval.positions[idx]?.moveClassification === classification &&
      (isWhite ? idx % 2 === 1 : idx % 2 === 0);

    const currentIdx = board.history().length;
    let target = -1;
    for (let i = currentIdx + 1; i < gameEval.positions.length; i++) {
      if (matches(i)) {
        target = i;
        break;
      }
    }
    if (target === -1) {
      for (let i = 1; i < gameEval.positions.length; i++) {
        if (matches(i)) {
          target = i;
          break;
        }
      }
    }
    if (target > 0) goToMove(target, game);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1,
          py: 0.75,
          borderBottom: `1px solid ${palette.borderSubtle}`,
        }}
      >
        <Box
          component="img"
          src={`/piece/maestro/${isWhite ? "wK" : "bK"}.svg`}
          alt=""
          sx={{ width: 16, height: 16 }}
        />
        <Typography fontSize="0.78rem" fontWeight={700} noWrap>
          {player.name}
          {player.rating ? ` (${player.rating})` : ""}
        </Typography>
      </Box>

      <Box sx={{ px: 1, py: 0.5 }}>
        {JUDGMENT_ROWS.map(({ classification, label }) => {
          const count = counts[classification];
          const glyph = CLASSIFICATION_GLYPHS[classification];

          return (
            <Box
              key={classification}
              onClick={() => count > 0 && jumpToNext(classification)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                py: 0.35,
                px: 0.5,
                borderRadius: 0.75,
                cursor: count > 0 ? "pointer" : "default",
                opacity: count > 0 ? 1 : 0.45,
                "&:hover":
                  count > 0
                    ? { bgcolor: alpha(glyph?.color ?? "#888", 0.12) }
                    : undefined,
              }}
            >
              <Typography
                fontSize="0.82rem"
                fontWeight={700}
                sx={{ minWidth: 18, textAlign: "center" }}
              >
                {count}
              </Typography>
              <Typography fontSize="0.78rem" sx={{ flex: 1 }} noWrap>
                {label(count)}
              </Typography>
              <Typography
                fontSize="0.82rem"
                fontWeight={700}
                sx={{ color: glyph?.color }}
              >
                {glyph?.symbol}
              </Typography>
            </Box>
          );
        })}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            py: 0.35,
            px: 0.5,
          }}
        >
          <Typography
            fontSize="0.82rem"
            fontWeight={700}
            sx={{ minWidth: 18, textAlign: "center" }}
          >
            {side.acpl}
          </Typography>
          <Tooltip title="Average centipawn loss — lower is better">
            <Typography fontSize="0.78rem" color="text.secondary" noWrap>
              Avg. centipawn loss
            </Typography>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            py: 0.35,
            px: 0.5,
          }}
        >
          <Typography
            fontSize="0.82rem"
            fontWeight={700}
            sx={{
              minWidth: 18,
              textAlign: "center",
              color: LICHESS_COLORS.goodMove,
            }}
          >
            {Math.round(accuracy)}%
          </Typography>
          <Tooltip title="Based on the lichess accuracy formula (win-percentage swings)">
            <Typography fontSize="0.78rem" color="text.secondary" noWrap>
              Accuracy
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

/** Lichess-style computer analysis summary: judgments, ACPL, accuracy. */
export default function AdviceSummary() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);

  if (!gameEval) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
        "& > *:first-of-type": {
          borderRight: { sm: `1px solid ${palette.borderSubtle}` },
          borderBottom: {
            xs: `1px solid ${palette.borderSubtle}`,
            sm: "none",
          },
        },
      }}
    >
      <PlayerSummary isWhite />
      <PlayerSummary isWhite={false} />
    </Box>
  );
}
