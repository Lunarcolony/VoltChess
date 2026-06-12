import { Box, Button } from "@mui/material";
import { Icon } from "@iconify/react";
import EvaluationProgress from "../EvaluationProgress";
import EvaluationGraphSection from "../EvaluationGraphSection";
import PlayerStatsPanel from "./PlayerStatsPanel";
import ClassificationGoodBad from "./ClassificationGoodBad";
import EvalLeadPanel from "./EvalLeadPanel";
import CriticalAnalysis from "./CriticalAnalysis";
import ReportSection from "./ReportSection";
import AnalysisEmptyState from "../AnalysisEmptyState";
import { useAtomValue } from "jotai";
import {
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";

interface Props {
  showReviewButton?: boolean;
  onOpenAnalysis?: () => void;
}

export default function ReportTabPanel({
  showReviewButton = true,
  onOpenAnalysis,
}: Props) {
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const { reanalyzeGame, engineReady } = useAnalyzeGame();

  const hasMoves = game.history().length > 0;
  const isAnalyzing = progress > 0;
  const needsReanalysis = hasMoves && !gameEval && !isAnalyzing;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <EvaluationProgress />

      {!gameEval && !isAnalyzing && <AnalysisEmptyState />}

      {gameEval && (
        <>
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
        </>
      )}

      {!gameEval && !isAnalyzing && (
        <ReportSection title="Evaluation graph" tourId="eval-graph" noPadding>
          <EvaluationGraphSection
            sticky={false}
            containerSx={{ mb: 0, p: 1.25 }}
          />
        </ReportSection>
      )}

      {needsReanalysis && (
        <Button
          variant="outlined"
          fullWidth
          disabled={!engineReady}
          onClick={() => reanalyzeGame()}
          sx={{ mb: 1.5 }}
        >
          {engineReady ? "Re-analyze this game" : "Loading engine…"}
        </Button>
      )}

      {showReviewButton && (
        <Button
          variant="contained"
          fullWidth
          disabled={!gameEval || isAnalyzing}
          onClick={() => gameEval && onOpenAnalysis?.()}
          endIcon={<Icon icon="mdi:arrow-right" width={18} />}
          sx={{ py: 1.1, mb: 1 }}
        >
          {isAnalyzing ? "Analyzing…" : "Open Game Review"}
        </Button>
      )}
    </Box>
  );
}
