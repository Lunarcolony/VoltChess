import { Box } from "@mui/material";
import EnginePositionTracker from "./EnginePositionTracker";
import EngineEvalBar from "./EngineEvalBar";
import FollowBestLineButton from "./FollowBestLineButton";
import EngineLinesPanel from "./EngineLinesPanel";
import GameMovesCard from "./GameMovesCard";

export default function AnalysisTabPanel() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
      }}
    >
      <EnginePositionTracker />
      <Box sx={{ flexShrink: 0 }}>
        <EngineEvalBar />
        <FollowBestLineButton />
      </Box>
      <Box sx={{ flexShrink: 0 }}>
        <EngineLinesPanel />
      </Box>
      <GameMovesCard />
    </Box>
  );
}
