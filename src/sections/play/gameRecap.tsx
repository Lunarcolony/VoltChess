import { useAtomValue, useSetAtom } from "jotai";
import {
  gameAtom as playGameAtom,
  isGameInProgressAtom,
  playerColorAtom,
} from "./states";
import { Button, Grid2 as Grid, Typography } from "@mui/material";
import { Color } from "@/types/enums";
import { setGameHeaders } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "@/hooks/useRouter";
import { useChessActions } from "@/hooks/useChessActions";
import {
  boardAtom as analysisBoardAtom,
  boardOrientationAtom,
  gameAtom as analysisGameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";

export default function GameRecap() {
  const game = useAtomValue(playGameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();
  const { setPgn: setAnalysisPgn } = useChessActions(analysisGameAtom);
  const { resetToStartingPosition: resetAnalysisBoard } =
    useChessActions(analysisBoardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  if (isGameInProgress || !game.history().length) return null;

  const getResultLabel = () => {
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
      const winnerLabel = winnerColor === playerColor ? "You" : "Stockfish";
      return `${winnerLabel} won by checkmate`;
    }
    if (game.isInsufficientMaterial()) return "Draw by insufficient material";
    if (game.isStalemate()) return "Draw by stalemate";
    if (game.isThreefoldRepetition()) return "Draw by threefold repetition";
    if (game.isDraw()) return "Draw by fifty-move rule";

    return "You resigned";
  };

  const handleOpenGameAnalysis = async () => {
    const gameToAnalysis = setGameHeaders(game, {
      resigned: !game.isGameOver() ? playerColor : undefined,
    });
    const pgn = gameToAnalysis.pgn();
    const orientation = playerColor === Color.White;

    resetAnalysisBoard(pgn);
    setAnalysisPgn(pgn);
    setEval(undefined);
    setBoardOrientation(orientation);
    prepareNewAnalysisSession(pgn, orientation);

    await addGame(gameToAnalysis);
    router.push("/analysis");
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={2}
      size={12}
    >
      <Grid container justifyContent="center" size={12}>
        <Typography align="center">{getResultLabel()}</Typography>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenGameAnalysis}
      >
        Analyze this game
      </Button>
    </Grid>
  );
}
