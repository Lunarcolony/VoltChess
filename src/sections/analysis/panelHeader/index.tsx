import { Box, Typography } from "@mui/material";
import LoadGame from "./loadGame";
import AnalyzeButton from "./analyzeButton";
import { usePlayersData } from "@/hooks/usePlayersData";
import { gameAtom } from "../states";

export default function PanelHeader() {
  const { white, black } = usePlayersData(gameAtom);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h3" noWrap sx={{ mb: 1.5 }}>
        {white.name} vs {black.name}
      </Typography>
      <LoadGame />
      <AnalyzeButton />
    </Box>
  );
}
