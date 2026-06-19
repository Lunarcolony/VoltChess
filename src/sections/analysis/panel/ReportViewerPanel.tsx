import { Box, CircularProgress, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import EvaluationGraphSection from "../EvaluationGraphSection";
import PlayerStatsPanel from "./PlayerStatsPanel";
import ClassificationGoodBad from "./ClassificationGoodBad";
import EvalLeadPanel from "./EvalLeadPanel";
import CriticalAnalysis from "./CriticalAnalysis";
import ReportSection from "./ReportSection";
import MoveAnnotations from "./MoveAnnotations";
import { gameAtom, gameEvalAtom } from "../states";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";

/**
 * Read-only report panel for the Review page. It renders the exact same report
 * sections as the analysis page but purely from the saved evaluation — there is
 * no Stockfish engine, no "analyze"/"re-analyze" actions, and no live position
 * evaluation. Used to display a synced game's stored report + per-move
 * classifications.
 */
export default function ReportViewerPanel() {
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { user } = useAuth();
  const showCoachNotes =
    user?.role === UserRole.Coach || user?.role === UserRole.Admin;
  const hasMoves = game.history().length > 0;

  if (!gameEval) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          borderRadius: 1.5,
          border: (t) => `1px dashed ${t.palette.divider}`,
        }}
      >
        <CircularProgress size={22} />
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Preparing your report…
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hasMoves
              ? "This game is being analyzed in the background. The report and move classifications appear here automatically once it's ready."
              : "Loading game…"}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <ReportSection title="Evaluation graph" tourId="eval-graph" noPadding>
        <EvaluationGraphSection
          sticky={false}
          containerSx={{ mb: 0, p: 1.25 }}
        />
      </ReportSection>

      <ReportSection title="Accuracy & ELO" tourId="accuracy">
        <PlayerStatsPanel />
      </ReportSection>

      <Box data-tour-id="classification" sx={{ mb: 1.5 }}>
        <ClassificationGoodBad />
      </Box>

      <EvalLeadPanel />
      <CriticalAnalysis />

      {showCoachNotes && (
        <ReportSection title="Coach notes">
          <MoveAnnotations />
        </ReportSection>
      )}
    </Box>
  );
}
