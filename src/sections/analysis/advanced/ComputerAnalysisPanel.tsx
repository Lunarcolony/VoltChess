import { Box, Button, Divider, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "../states";
import { usePalette } from "@/hooks/usePalette";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import ReportTabPanel from "../panel/ReportTabPanel";
import PlayerStatsPanel from "../panel/PlayerStatsPanel";
import ClassificationGoodBad from "../panel/ClassificationGoodBad";
import EvalLeadPanel from "../panel/EvalLeadPanel";
import CriticalAnalysis from "../panel/CriticalAnalysis";
import LichessEvalChart from "./LichessEvalChart";
import AdviceSummary from "./AdviceSummary";
import LearnFromMistakes from "./LearnFromMistakes";

/**
 * Advanced "Computer analysis" tab: lichess-style chart + advice summary +
 * retro training on top, VoltChess's own report insights below.
 */
export default function ComputerAnalysisPanel() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const { reanalyzeGame, engineReady } = useAnalyzeGame();

  // No analysis yet — the standard report panel handles loading/empty/CTA
  if (!gameEval) {
    return <ReportTabPanel />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        width: "100%",
        pb: 1,
      }}
    >
      <LichessEvalChart />
      <AdviceSummary />
      <LearnFromMistakes />

      <Divider sx={{ borderColor: palette.borderSubtle }}>
        <Typography
          fontSize="0.68rem"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          VoltChess insights
        </Typography>
      </Divider>

      <PlayerStatsPanel />
      <ClassificationGoodBad />
      <EvalLeadPanel />
      <CriticalAnalysis />

      <Button
        variant="outlined"
        fullWidth
        size="small"
        disabled={!engineReady}
        onClick={() => reanalyzeGame()}
      >
        Re-analyze this game
      </Button>
    </Box>
  );
}
