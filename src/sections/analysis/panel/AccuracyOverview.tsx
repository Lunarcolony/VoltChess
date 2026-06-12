import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "../states";
import { usePalette } from "@/hooks/usePalette";
import { MoveClassification } from "@/types/enums";
import {
  BAD_CLASSIFICATIONS,
  GOOD_CLASSIFICATIONS,
} from "./classificationLabels";

function countMoves(
  positions: { moveClassification?: MoveClassification }[],
  isWhite: boolean,
  types: readonly MoveClassification[]
) {
  return positions.filter(
    (p, idx) =>
      (isWhite ? idx % 2 !== 0 : idx % 2 === 0) &&
      p.moveClassification &&
      types.includes(p.moveClassification)
  ).length;
}

function GoodBadBar({ good, bad }: { good: number; bad: number }) {
  const palette = usePalette();
  const total = good + bad || 1;
  const goodPct = (good / total) * 100;

  return (
    <Box sx={{ width: "100%", maxWidth: 120, mt: 0.75 }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ width: `${goodPct}%`, bgcolor: "#22ac38" }} />
        <Box sx={{ flex: 1, bgcolor: "#df5353" }} />
      </Box>
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          fontSize: "0.65rem",
          color: palette.textMuted,
          display: "flex",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        <span style={{ color: "#22ac38" }}>{good}</span>
        <span>vs</span>
        <span style={{ color: "#df5353" }}>{bad}</span>
      </Typography>
    </Box>
  );
}

function PlayerScoreCard({
  value,
  side,
  good,
  bad,
}: {
  value: string;
  side: "white" | "black";
  good: number;
  bad: number;
}) {
  const palette = usePalette();
  const isWhite = side === "white";

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 110,
          py: 1.25,
          px: 1,
          borderRadius: 1.5,
          textAlign: "center",
          bgcolor: isWhite ? palette.playerLightBg : palette.surface,
          color: isWhite ? palette.playerLightText : palette.text,
          border: `1px solid ${palette.border}`,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "1.35rem", sm: "1.6rem" },
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
      </Box>
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <GoodBadBar good={good} bad={bad} />
      </Box>
    </Box>
  );
}

export default function AccuracyOverview() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  if (!gameEval) return null;

  const positions = gameEval.positions;
  const whiteGood = countMoves(positions, true, GOOD_CLASSIFICATIONS);
  const whiteBad = countMoves(positions, true, BAD_CLASSIFICATIONS);
  const blackGood = countMoves(positions, false, GOOD_CLASSIFICATIONS);
  const blackBad = countMoves(positions, false, BAD_CLASSIFICATIONS);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: { xs: 1, sm: 1.5 },
        mb: 0,
        width: "100%",
      }}
    >
      <PlayerScoreCard
        value={gameEval.accuracy.white.toFixed(1)}
        side="white"
        good={whiteGood}
        bad={whiteBad}
      />

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 1.5,
          minWidth: 72,
        }}
      >
        <Icon icon="mdi:speedometer" width={22} color={palette.textMuted} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, fontWeight: 600, fontSize: "0.7rem" }}
        >
          Accuracy
        </Typography>
      </Box>

      <PlayerScoreCard
        value={gameEval.accuracy.black.toFixed(1)}
        side="black"
        good={blackGood}
        bad={blackBad}
      />
    </Box>
  );
}
