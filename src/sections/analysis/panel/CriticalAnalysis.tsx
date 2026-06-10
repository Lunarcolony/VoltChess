import { Avatar, Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { Color, MoveClassification } from "@/types/enums";
import { palette } from "@/theme/voltchessTheme";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useChessActions } from "@/hooks/useChessActions";

const CRITICAL = [MoveClassification.Mistake, MoveClassification.Blunder];

function countCritical(
  positions: { moveClassification?: MoveClassification }[],
  isWhite: boolean,
  classification: MoveClassification
) {
  return positions.filter(
    (p, idx) =>
      p.moveClassification === classification &&
      (isWhite ? idx % 2 !== 0 : idx % 2 === 0)
  ).length;
}

function CountBadge({
  classification,
  count,
}: {
  classification: MoveClassification;
  count: number;
}) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
      <Box
        component="img"
        src={`/icons/${classification}.png`}
        alt={classification}
        sx={{ width: 16, height: 16 }}
      />
      <Typography component="span" fontSize="0.8rem" fontWeight={700}>
        {count}
      </Typography>
    </Box>
  );
}

function PlayerCriticalChip({
  name,
  mistakes,
  blunders,
  onClick,
}: {
  name: string;
  mistakes: number;
  blunders: number;
  onClick: () => void;
}) {
  const hasCritical = mistakes + blunders > 0;

  return (
    <Box
      onClick={hasCritical ? onClick : undefined}
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.85,
        borderRadius: 1.5,
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${palette.border}`,
        cursor: hasCritical ? "pointer" : "default",
        "&:hover": hasCritical ? { borderColor: palette.accent } : undefined,
      }}
    >
      <Avatar
        sx={{
          width: 26,
          height: 26,
          fontSize: "0.75rem",
          bgcolor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
      >
        {name[0]?.toUpperCase()}
      </Avatar>
      <Typography fontSize="0.8rem" fontWeight={600} noWrap sx={{ flex: 1 }}>
        {name}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
        <CountBadge classification={MoveClassification.Mistake} count={mistakes} />
        <CountBadge classification={MoveClassification.Blunder} count={blunders} />
      </Box>
    </Box>
  );
}

export default function CriticalAnalysis() {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const orientation = useAtomValue(boardOrientationAtom);
  const { white, black } = usePlayersData(gameAtom);
  const { goToMove } = useChessActions(boardAtom);

  if (!gameEval?.positions.length) return null;

  const positions = gameEval.positions;
  const whiteMistakes = countCritical(positions, true, MoveClassification.Mistake);
  const whiteBlunders = countCritical(positions, true, MoveClassification.Blunder);
  const blackMistakes = countCritical(positions, false, MoveClassification.Mistake);
  const blackBlunders = countCritical(positions, false, MoveClassification.Blunder);

  // "You" = the side the board is oriented towards
  const youMistakes = orientation ? whiteMistakes : blackMistakes;
  const youBlunders = orientation ? whiteBlunders : blackBlunders;

  const goToNextCritical = (color: Color) => {
    const isWhite = color === Color.White;
    const moveIdx = board.history().length;

    const matches = (p: { moveClassification?: MoveClassification }, idx: number) =>
      !!p.moveClassification &&
      CRITICAL.includes(p.moveClassification) &&
      (isWhite ? idx % 2 !== 0 : idx % 2 === 0);

    const nextIdx = positions.findIndex((p, idx) => matches(p, idx) && idx > moveIdx);
    if (nextIdx > 0) {
      goToMove(nextIdx, game);
      return;
    }
    const firstIdx = positions.findIndex(matches);
    if (firstIdx > 0) goToMove(firstIdx, game);
  };

  return (
    <Box
      sx={{
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        p: 1.5,
        mb: 1.5,
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#df5353" }}
        />
        <Typography
          fontSize="0.72rem"
          fontWeight={700}
          sx={{ color: "#df5353", letterSpacing: "0.04em" }}
        >
          Critical Analysis
        </Typography>
      </Box>

      <Typography fontSize="1rem" fontWeight={700} sx={{ mb: 0.5 }}>
        Learn from your mistakes.
      </Typography>

      <Typography
        fontSize="0.82rem"
        color="text.secondary"
        sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}
      >
        You made
        <CountBadge classification={MoveClassification.Mistake} count={youMistakes} />
        and
        <CountBadge classification={MoveClassification.Blunder} count={youBlunders} />
        critical errors. Master these positions to improve.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
        }}
      >
        <PlayerCriticalChip
          name={white.name}
          mistakes={whiteMistakes}
          blunders={whiteBlunders}
          onClick={() => goToNextCritical(Color.White)}
        />
        <PlayerCriticalChip
          name={black.name}
          mistakes={blackMistakes}
          blunders={blackBlunders}
          onClick={() => goToNextCritical(Color.Black)}
        />
      </Box>
    </Box>
  );
}
