import { PageTitle } from "@/components/pageTitle";
import Board from "@/sections/play/board";
import GameInProgress from "@/sections/play/gameInProgress";
import GameRecap from "@/sections/play/gameRecap";
import GameSettingsButton from "@/sections/play/gameSettings/gameSettingsButton";
import { isGameInProgressAtom } from "@/sections/play/states";
import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/PageContainer";
import { cardSx } from "@/theme/voltchessTheme";

function Play() {
  const isGameInProgress = useAtomValue(isGameInProgressAtom);

  return (
    <>
      <PageTitle title="Play vs Engine — VoltChess" />

      <PageContainer
        title="Play vs Engine"
        subtitle="Challenge Stockfish at a rating that matches your level."
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            alignItems: { xs: "center", md: "flex-start" },
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              width: { xs: "100%", md: "auto" },
            }}
          >
            <Board />
          </Box>

          <Box
            sx={{
              ...cardSx,
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            <GameInProgress />
            {!isGameInProgress && <GameSettingsButton />}
            <GameRecap />
          </Box>
        </Box>
      </PageContainer>
    </>
  );
}

export default function ProtectedPlay() {
  return (
    <ProtectedRoute>
      <Play />
    </ProtectedRoute>
  );
}
