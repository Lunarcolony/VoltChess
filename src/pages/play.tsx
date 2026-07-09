import { PageTitle } from "@/components/pageTitle";
import Board from "@/sections/play/board";
import GameInProgress from "@/sections/play/gameInProgress";
import GameRecap from "@/sections/play/gameRecap";
import GameSettingsButton from "@/sections/play/gameSettings/gameSettingsButton";
import { isGameInProgressAtom } from "@/sections/play/states";
import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import PageContainer from "@/components/PageContainer";
import { useCardSx } from "@/hooks/usePalette";

function Play() {
  const cardSx = useCardSx();
  const isGameInProgress = useAtomValue(isGameInProgressAtom);

  return (
    <>
      <PageTitle title="Play vs Engine — VoltChess" noindex />

      <PageContainer
        title="Play vs Engine"
        subtitle="Challenge Stockfish at a rating that matches your level."
      >
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              bgcolor: "rgba(232,185,35,0.04)",
              border: "1px solid rgba(232,185,35,0.08)",
              color: "rgba(232,185,35,1)",
              px: 2,
              py: 1,
              borderRadius: 1,
            }}
          >
            Play feature is under development — coming soon.
          </Box>
        </Box>
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

export default Play;
