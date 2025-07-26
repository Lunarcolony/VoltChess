import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import FlipBoardButton from "./flipBoardButton";
import NextMoveButton from "./nextMoveButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import { useEffect, useState } from "react";
import EngineSettingsDialog from "@/sections/engineSettings/engineSettingsDialog";

export default function PanelToolBar() {
  const board = useAtomValue(boardAtom);
  const { resetToStartingPosition: resetBoard, undoMove: undoBoardMove } =
    useChessActions(boardAtom);

  const boardHistory = board.history();
  const game = useAtomValue(gameAtom);
  const [openEngineSettings, setOpenEngineSettings] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (boardHistory.length === 0) return;
      if (e.key === "ArrowLeft") {
        undoBoardMove();
      } else if (e.key === "ArrowDown") {
        resetBoard();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [undoBoardMove, boardHistory, resetBoard, board]);

  return (
    <>
      <Grid container justifyContent="center" alignItems="center" size={12}>
        <FlipBoardButton />

        <Tooltip title="Reset board">
          <Grid>
            <IconButton
              onClick={() => resetBoard()}
              disabled={boardHistory.length === 0}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:skip-back-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <Tooltip title="Go to previous move">
          <Grid>
            <IconButton
              onClick={() => undoBoardMove()}
              disabled={boardHistory.length === 0}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:arrow-left-s-line" height={30} />
            </IconButton>
          </Grid>
        </Tooltip>

        <NextMoveButton />

        <GoToLastPositionButton />

        <Tooltip title="Copy pgn">
          <Grid>
            <IconButton
              disabled={game.history().length === 0}
              onClick={() => {
                navigator.clipboard?.writeText?.(game.pgn());
              }}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:clipboard-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <Tooltip title="Engine Settings">
          <Grid>
            <IconButton
              onClick={() => setOpenEngineSettings(true)}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="mdi:settings" />
            </IconButton>
          </Grid>
        </Tooltip>
      </Grid>

      <EngineSettingsDialog
        open={openEngineSettings}
        onClose={() => setOpenEngineSettings(false)}
      />
    </>
  );
}
