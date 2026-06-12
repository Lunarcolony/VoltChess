import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import {
  boardAtom,
  evaluationProgressAtom,
  gameEvalAtom,
  gameAtom,
} from "./states";
import { usePalette } from "@/hooks/usePalette";
import { useChessActions } from "@/hooks/useChessActions";
import { useRouter } from "@/hooks/useRouter";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import LoadGameButton from "@/sections/loadGame/loadGameButton";

function isGameLoaded(game: Chess) {
  return (
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0
  );
}

export default function AnalysisEmptyState() {
  const palette = usePalette();
  const router = useRouter();
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  if (gameEval || progress > 0) return null;

  if (!isGameLoaded(game)) {
    return (
      <Box
        sx={{
          py: 3,
          px: 2,
          textAlign: "center",
          borderRadius: 1.5,
          border: `1px dashed ${palette.border}`,
          bgcolor: palette.surface,
          mb: 2,
        }}
      >
        <Icon
          icon="mdi:chess-pawn"
          width={36}
          color={palette.textMuted}
          style={{ marginBottom: 10 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Load a game to start analysis
        </Typography>
        <LoadGameButton
          label="Load game"
          setGame={async (loadedGame: Chess) => {
            const pgn = loadedGame.pgn();
            resetAndSetGamePgn(pgn);
            prepareNewAnalysisSession(pgn);
            await router.push("/analysis");
          }}
          sx={{ width: "100%" }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 3,
        px: 2,
        textAlign: "center",
        borderRadius: 1.5,
        border: `1px dashed ${palette.border}`,
        bgcolor: palette.surface,
        mb: 2,
      }}
    >
      <Icon
        icon="mdi:chart-timeline-variant"
        width={32}
        color={palette.textMuted}
        style={{ marginBottom: 8 }}
      />
      <Typography variant="body2" color="text.secondary">
        Analysis results will appear here once Stockfish finishes evaluating
        your game.
      </Typography>
    </Box>
  );
}
