import { Box, Button } from "@mui/material";
import { Icon } from "@iconify/react";
import EvaluationProgress from "../EvaluationProgress";
import EvaluationGraphSection from "../EvaluationGraphSection";
import AccuracyOverview from "./AccuracyOverview";
import EloOverview from "./EloOverview";
import ClassificationGoodBad from "./ClassificationGoodBad";
import CriticalAnalysis from "./CriticalAnalysis";
import AnalysisEmptyState from "../AnalysisEmptyState";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom, gameAtom, gameEvalAtom } from "../states";
import { useRouter } from "@/hooks/useRouter";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";

interface Props {
  showReviewButton?: boolean;
}

export default function ReportTabPanel({ showReviewButton = true }: Props) {
  const router = useRouter();
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
          <AccuracyOverview />
          <EloOverview />
        </>
      )}

      <EvaluationGraphSection sticky={false} />

      {gameEval && <ClassificationGoodBad />}

      {gameEval && <CriticalAnalysis />}

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
          onClick={() => gameEval && router.push("/reanalysis")}
          endIcon={<Icon icon="mdi:arrow-right" width={18} />}
          sx={{ py: 1.1, mb: 1 }}
        >
          {isAnalyzing ? "Analyzing…" : "Open Game Review"}
        </Button>
      )}
    </Box>
  );
}
