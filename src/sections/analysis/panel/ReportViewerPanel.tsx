import { Box, Button, CircularProgress, Typography } from "@mui/material";
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
import { useRouter } from "@/hooks/useRouter";

/**
 * Read-only report panel for the Review page (saved eval only).
 */
export default function ReportViewerPanel() {
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const router = useRouter();
  const { user } = useAuth();
  const showCoachNotes =
    user?.role === UserRole.Coach || user?.role === UserRole.Admin;
  const hasMoves = game.history().length > 0;
  const gameId = router.query.gameId;

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
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {hasMoves ? "Loading report…" : "Loading game…"}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {hasMoves
              ? "Fetching the saved analysis from the server."
              : "Please wait."}
          </Typography>
          {typeof gameId === "string" && hasMoves && (
            <Button
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => router.push(`/analysis?gameId=${gameId}`)}
            >
              Analyze in browser instead
            </Button>
          )}
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
