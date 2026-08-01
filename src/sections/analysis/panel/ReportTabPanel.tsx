import { Box, Button, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
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
import LoadGameInlinePanel from "@/sections/loadGame/loadGameInlinePanel";
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
import { advancedModeAtom } from "../advanced/states";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAnalysisQueue } from "@/contexts/AnalysisQueueContext";
import { usePalette } from "@/hooks/usePalette";
import MoveAnnotations from "./MoveAnnotations";

function isGameLoaded(game: Chess) {
  return (
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0
  );
}

export default function ReportTabPanel() {
  const router = useRouter();
  const palette = usePalette();
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const { analyzeGame, engineReady } = useAnalyzeGame();
  const { serverGameFromUrl } = useGameDatabase();
  const { state: queueState, startAnalysis } = useAnalysisQueue();
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setAdvancedMode = useSetAtom(advancedModeAtom);
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

  const loadGame = useCallback(
    async (loadedGame: Chess) => {
      const pgn = loadedGame.pgn();
      resetAndSetGamePgn(pgn);
      prepareNewAnalysisSession(pgn);
      await router.push("/analysis");
    },
    [resetAndSetGamePgn, router]
  );

  const gameLoaded = isGameLoaded(game);
  const isServerPending =
    !!serverGameFromUrl?.serverId && !serverGameFromUrl.eval;
  const queueBusy = queueState.running;
  const isAnalyzing = progress > 0 || (isServerPending && queueBusy);
  const showInlineLoader = !gameEval && !isAnalyzing;
  const fillPanel = showInlineLoader && !gameLoaded;

  const handleAnalyze = useCallback(() => {
    if (isServerPending && serverGameFromUrl?.serverId) {
      void startAnalysis(serverGameFromUrl.serverId);
      return;
    }
    void analyzeGame(true);
  }, [
    analyzeGame,
    isServerPending,
    serverGameFromUrl?.serverId,
    startAnalysis,
  ]);

  const analyzeDisabled =
    isAnalyzing || (isServerPending ? queueBusy : !engineReady);

  const analyzeLabel = isAnalyzing
    ? queueBusy || (isServerPending && !progress)
      ? queueState.message || "Analyzing…"
      : `Analyzing… ${progress}%`
    : isServerPending
      ? "Analyze game"
      : engineReady
        ? "Analyze game"
        : "Loading engine…";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...(fillPanel
          ? { flex: 1, minHeight: 0, height: "100%" }
          : { flex: "none", minHeight: "min-content" }),
      }}
    >
      <EvaluationProgress />

      {showInlineLoader && !gameLoaded && (
        <LoadGameInlinePanel fillHeight onLoadGame={loadGame} />
      )}

      {showInlineLoader && gameLoaded && (
        <>
          <AnalysisEmptyState />
          <Button
            variant="contained"
            fullWidth
            disabled={analyzeDisabled}
            onClick={handleAnalyze}
            startIcon={
              isAnalyzing ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Icon icon="mdi:chart-timeline-variant" width={20} />
              )
            }
            sx={{
              mb: 2,
              bgcolor: palette.accent,
              color: palette.onAccent,
            }}
          >
            {analyzeLabel}
          </Button>
          {queueState.error && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "error.dark",
                color: "error.contrastText",
                fontSize: "0.85rem",
              }}
            >
              {queueState.error}
            </Box>
          )}
        </>
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

          <Button
            variant="outlined"
            fullWidth
            onClick={() => setAdvancedMode(true)}
            startIcon={<Icon icon="mdi:lightning-bolt" width={18} />}
            sx={{ mb: 1.5 }}
          >
            Try advanced analysis
          </Button>
        </>
      )}

      {!gameEval && !isAnalyzing && gameLoaded && (
        <ReportSection title="Evaluation graph" tourId="eval-graph" noPadding>
          <EvaluationGraphSection
            sticky={false}
            containerSx={{ mb: 0, p: 1.25 }}
          />
        </ReportSection>
      )}
    </Box>
  );
}
