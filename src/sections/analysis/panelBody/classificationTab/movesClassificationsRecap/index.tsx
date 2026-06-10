import { usePlayersData } from "@/hooks/usePlayersData";
import { Grid2 as Grid, Typography } from "@mui/material";
import { gameAtom, gameEvalAtom } from "../../../states";
import { MoveClassification } from "@/types/enums";
import ClassificationRow from "./classificationRow";
import { useAtomValue } from "jotai";

export default function MovesClassificationsRecap() {
  const { white, black } = usePlayersData(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);

  if (!gameEval?.positions.length) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      rowGap={0.7}
      sx={{ scrollbarWidth: "thin", overflowY: "auto" }}
      height="100%"
      maxHeight={{ xs: "16rem", sm: "20rem" }}
      size={12}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        wrap="nowrap"
        size={12}
        sx={{ px: 1 }}
      >
        <Typography
          flex={1}
          align="center"
          noWrap
          fontSize="0.85rem"
          fontWeight={600}
        >
          {white.name}
        </Typography>

        <Typography flex={0.6} align="center" fontSize="0.75rem" color="text.secondary">
          Moves
        </Typography>

        <Typography
          flex={1}
          align="center"
          noWrap
          fontSize="0.85rem"
          fontWeight={600}
        >
          {black.name}
        </Typography>
      </Grid>

      {sortedMoveClassfications.map((classification) => (
        <ClassificationRow
          key={classification}
          classification={classification}
        />
      ))}
    </Grid>
  );
}

export const sortedMoveClassfications = [
  MoveClassification.Splendid,
  MoveClassification.Perfect,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Okay,
  MoveClassification.Opening,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];
