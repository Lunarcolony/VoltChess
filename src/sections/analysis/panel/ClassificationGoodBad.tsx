import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { MoveClassification, Color } from "@/types/enums";
import { palette } from "@/theme/voltchessTheme";
import { useChessActions } from "@/hooks/useChessActions";
import {
  BAD_CLASSIFICATIONS,
  CLASSIFICATION_DISPLAY_LABELS,
  GOOD_CLASSIFICATIONS,
} from "./classificationLabels";

function countFor(
  positions: { moveClassification?: MoveClassification }[],
  classification: MoveClassification,
  isWhite: boolean
) {
  return positions.filter(
    (p, idx) =>
      p.moveClassification === classification &&
      (isWhite ? idx % 2 !== 0 : idx % 2 === 0)
  ).length;
}

function ClassificationColumn({
  title,
  dotColor,
  classifications,
}: {
  title: string;
  dotColor: string;
  classifications: readonly MoveClassification[];
}) {
  const gameEval = useAtomValue(gameEvalAtom);
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const { goToMove } = useChessActions(boardAtom);

  if (!gameEval) return null;

  const handleClick = (classification: MoveClassification, color: Color) => {
    const isWhite = color === Color.White;
    const moveIdx = board.history().length;
    const nextIdx = gameEval.positions.findIndex(
      (p, idx) =>
        p.moveClassification === classification &&
        (isWhite ? idx % 2 !== 0 : idx % 2 === 0) &&
        idx > moveIdx
    );
    if (nextIdx > 0) goToMove(nextIdx, game);
    else {
      const first = gameEval.positions.findIndex(
        (p, idx) =>
          p.moveClassification === classification &&
          (isWhite ? idx % 2 !== 0 : idx % 2 === 0)
      );
      if (first > 0) goToMove(first, game);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderBottom: `1px solid ${palette.borderSubtle}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: dotColor,
          }}
        />
        <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
          {title}
        </Typography>
      </Box>

      <Box sx={{ py: 0.5 }}>
        {classifications.map((classification) => {
          const whiteNb = countFor(gameEval.positions, classification, true);
          const blackNb = countFor(gameEval.positions, classification, false);
          if (!whiteNb && !blackNb) return null;

          return (
            <Box
              key={classification}
              sx={{
                display: "grid",
                gridTemplateColumns: "2rem 1fr 2rem",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.45,
                "&:hover": { bgcolor: palette.surfaceRaised },
              }}
            >
              <Typography
                align="center"
                fontSize="0.8rem"
                sx={{
                  cursor: whiteNb ? "pointer" : "default",
                  fontWeight: 500,
                }}
                onClick={() => whiteNb && handleClick(classification, Color.White)}
              >
                {whiteNb}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                }}
              >
                <Box
                  component="img"
                  src={`/icons/${classification}.png`}
                  alt=""
                  sx={{ width: 18, height: 18, flexShrink: 0 }}
                />
                <Typography fontSize="0.78rem" noWrap>
                  {CLASSIFICATION_DISPLAY_LABELS[classification]}
                </Typography>
              </Box>

              <Typography
                align="center"
                fontSize="0.8rem"
                sx={{
                  cursor: blackNb ? "pointer" : "default",
                  fontWeight: 500,
                }}
                onClick={() => blackNb && handleClick(classification, Color.Black)}
              >
                {blackNb}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function ClassificationGoodBad() {
  const gameEval = useAtomValue(gameEvalAtom);
  if (!gameEval?.positions.length) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.25,
        mb: 2,
        width: "100%",
      }}
    >
      <ClassificationColumn
        title="Good"
        dotColor="#22ac38"
        classifications={GOOD_CLASSIFICATIONS}
      />
      <ClassificationColumn
        title="Bad"
        dotColor="#df5353"
        classifications={BAD_CLASSIFICATIONS}
      />
    </Box>
  );
}
