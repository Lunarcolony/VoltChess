import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import { useEngine } from "@/hooks/useEngine";
import { engineNameAtom } from "../states";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import { advancedEngineOnAtom, threatModeAtom } from "./states";
import { useThreatEval } from "./useThreatEval";
import AdvancedEnginePanel from "./AdvancedEnginePanel";
import AdvancedMovesList from "./AdvancedMovesList";
import AdvancedBoardArrows from "./AdvancedBoardArrows";

/** Live engine wiring for the advanced workspace (deepens stored evals). */
function AdvancedEngineTracker() {
  const engineName = useAtomValue(engineNameAtom);
  const engineOn = useAtomValue(advancedEngineOnAtom);
  const threatMode = useAtomValue(threatModeAtom);
  const engine = useEngine(engineOn ? engineName : undefined);

  // While threat mode runs, the engine works on the flipped position instead
  useCurrentPosition(engine, {
    enabled: engineOn && !threatMode,
    deepen: true,
  });
  useThreatEval(engine);

  return null;
}

export default function AdvancedAnalysisTab() {
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
      <AdvancedEngineTracker />
      <AdvancedBoardArrows />
      <AdvancedEnginePanel />
      <AdvancedMovesList />
    </Box>
  );
}
