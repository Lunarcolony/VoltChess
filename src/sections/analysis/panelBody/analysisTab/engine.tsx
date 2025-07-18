import {
  Grid2 as Grid,
  Grid2Props as GridProps,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../states";
import EngineLines from "./engineLines";

export default function AnalysisTab(props: GridProps) {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const boardHistory = board.history();
  const gameHistory = game.history();

  const isGameOver =
    boardHistory.length > 0 &&
    (board.isCheckmate() ||
      board.isDraw() ||
      boardHistory.join() === gameHistory.join());

  return (
    <Grid
      container
      size={12}
      justifyContent={{ xs: "center", lg: gameEval ? "center" : "center" }}
      alignItems="center"
      flexWrap={{ lg: gameEval ? "nowrap" : undefined }}
      gap={2}
      marginY={{ lg: gameEval ? 1 : undefined }}
      paddingX={{ xs: 0, lg: "calc(4% - 2rem)" }}
      {...props}
      sx={props.hidden ? { display: "none" } : props.sx}
    >


      <EngineLines size={{ lg: gameEval ? undefined : 12 }} />
    </Grid>
  );
}

        //<MoveInfo />

        //<Opening />