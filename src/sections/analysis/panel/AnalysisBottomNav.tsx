import { Box, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { useCallback, useEffect } from "react";
import { palette } from "@/theme/voltchessTheme";

const navBtnSx = {
  flex: 1,
  minWidth: 0,
  height: { xs: 40, sm: 44 },
  borderRadius: 1.5,
  bgcolor: palette.accent,
  color: "#0a0a0a",
  "&:hover": { bgcolor: palette.accentHover },
  "&.Mui-disabled": {
    bgcolor: "rgba(232, 185, 35, 0.35)",
    color: "rgba(10, 10, 10, 0.45)",
  },
};

export default function AnalysisBottomNav() {
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const { resetToStartingPosition, undoMove, setPgn, playMove } =
    useChessActions(boardAtom);

  const boardHistory = board.history();
  const gameHistory = game.history();

  const canGoBack = boardHistory.length > 0;
  const canGoForward =
    boardHistory.length < gameHistory.length &&
    gameHistory.slice(0, boardHistory.length).join() === boardHistory.join();
  const canGoEnd = boardHistory.length < gameHistory.length;

  const goToStart = useCallback(
    () => resetToStartingPosition(),
    [resetToStartingPosition]
  );
  const goBack = useCallback(() => undoMove(), [undoMove]);

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    const nextMove = game.history({ verbose: true })[boardHistory.length];
    const comment = game
      .getComments()
      .find((c) => c.fen === nextMove.after)?.comment;
    playMove({
      from: nextMove.from,
      to: nextMove.to,
      promotion: nextMove.promotion,
      comment,
    });
  }, [canGoForward, boardHistory.length, game, playMove]);

  const goToEnd = useCallback(() => {
    if (!canGoEnd) return;
    setPgn(game.pgn());
  }, [canGoEnd, setPgn, game]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goBack();
      else if (e.key === "ArrowRight") handleGoForward();
      else if (e.key === "ArrowDown") goToStart();
      else if (e.key === "ArrowUp") goToEnd();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, handleGoForward, goToStart, goToEnd]);

  return (
    <Box
      data-tour-id="bottom-nav"
      sx={{ display: "flex", gap: 0.75, alignItems: "center", width: "100%" }}
    >
      <Tooltip title="Start">
        <IconButton onClick={goToStart} disabled={!canGoBack} sx={navBtnSx}>
          <Icon icon="mdi:chevron-double-left" width={22} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Previous">
        <IconButton onClick={goBack} disabled={!canGoBack} sx={navBtnSx}>
          <Icon icon="mdi:chevron-left" width={24} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Next">
        <IconButton
          onClick={handleGoForward}
          disabled={!canGoForward}
          sx={navBtnSx}
        >
          <Icon icon="mdi:chevron-right" width={24} />
        </IconButton>
      </Tooltip>
      <Tooltip title="End">
        <IconButton onClick={goToEnd} disabled={!canGoEnd} sx={navBtnSx}>
          <Icon icon="mdi:chevron-double-right" width={22} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
