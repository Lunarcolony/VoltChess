import { Stack, Button } from "@mui/material";
import LoadGameButton from "../../loadGame/loadGameButton";
import { useCallback } from "react";
import { useChessActions } from "@/hooks/useChessActions";
import {
  boardAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useRouter } from "@/hooks/useRouter";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import { clearAnalysisSession } from "@/hooks/useAnalysisSession";

export default function LoadGame() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const { reanalyzeGame, gameEval, evaluationProgress, engineReady } =
    useAnalyzeGame();

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  const isGameLoaded =
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  const needsReanalysis = isGameLoaded && !gameEval && !evaluationProgress;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
      <LoadGameButton
        label={isGameLoaded ? "Load new game" : "Load game"}
        size="small"
        setGame={async (loadedGame: Chess) => {
          clearAnalysisSession();
          await router.push("/analysis");
          resetAndSetGamePgn(loadedGame.pgn());
        }}
      />

      {needsReanalysis && (
        <Button
          variant="outlined"
          size="small"
          disabled={!engineReady || evaluationProgress > 0}
          onClick={() => reanalyzeGame()}
        >
          {engineReady ? "Re-analyze game" : "Loading engine…"}
        </Button>
      )}
    </Stack>
  );
}
