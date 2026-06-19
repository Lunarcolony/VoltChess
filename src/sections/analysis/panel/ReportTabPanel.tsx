import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import EvaluationProgress from "../EvaluationProgress";
import EvaluationGraphSection from "../EvaluationGraphSection";
import PlayerStatsPanel from "./PlayerStatsPanel";
import ClassificationGoodBad from "./ClassificationGoodBad";
import EvalLeadPanel from "./EvalLeadPanel";
import CriticalAnalysis from "./CriticalAnalysis";
import ReportSection from "./ReportSection";
import AnalysisEmptyState from "../AnalysisEmptyState";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useChessActions } from "@/hooks/useChessActions";
import { useRouter } from "@/hooks/useRouter";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";
import {
  boardAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import MoveAnnotations from "./MoveAnnotations";

export default function ReportTabPanel() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const { reanalyzeGame, engineReady, isServerGame } = useAnalyzeGame();
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const { user } = useAuth();
  const showCoachNotes =
    user?.role === UserRole.Coach || user?.role === UserRole.Admin;

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  const hasMoves = game.history().length > 0;
  const isAnalyzing = progress > 0;
  // A synced game whose report hasn't been saved yet: it's being generated in
  // the background, so show a "preparing" notice (the page polls the server and
  // fills in automatically) rather than the generic "load a game" empty state.
  const serverReportPending = isServerGame && hasMoves && !gameEval;
  const needsReanalysis =
    hasMoves && !gameEval && !isAnalyzing && !isServerGame;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <EvaluationProgress />

      {serverReportPending && !isAnalyzing && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            mb: 1.5,
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
              This game is being analyzed in the background. The report and move
              classifications will appear here automatically — no need to
              re-analyze.
            </Typography>
          </Box>
        </Box>
      )}

      {!gameEval && !isAnalyzing && !serverReportPending && (
        <AnalysisEmptyState />
      )}

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

          {showCoachNotes && (
            <ReportSection title="Coach notes">
              <MoveAnnotations />
            </ReportSection>
          )}
        </>
      )}

      {!gameEval && !isAnalyzing && !serverReportPending && (
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

      <LoadGameButton
        label={isAnalyzing ? "Analyzing…" : "Load new game"}
        setGame={async (loadedGame: Chess) => {
          const pgn = loadedGame.pgn();
          resetAndSetGamePgn(pgn);
          prepareNewAnalysisSession(pgn);
          await router.push("/analysis");
        }}
        sx={{
          width: "100%",
          py: 1.1,
          mb: 1,
          pointerEvents: isAnalyzing ? "none" : undefined,
          opacity: isAnalyzing ? 0.6 : 1,
        }}
      />
    </Box>
  );
}
