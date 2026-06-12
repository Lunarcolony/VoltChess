import { Box } from "@mui/material";
import AccuracyOverview from "./AccuracyOverview";
import EloOverview from "./EloOverview";

/** Accuracy + estimated ELO in one report block */
export default function PlayerStatsPanel() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <AccuracyOverview />
      <EloOverview />
    </Box>
  );
}
