import { Box, Button } from "@mui/material";
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
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";
import MoveAnnotations from "./MoveAnnotations";

function isGameLoaded(game: Chess) {
  return (
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0
  );
}

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

  const loadGame = useCallback(
    async (loadedGame: Chess) => {
      const pgn = loadedGame.pgn();
      resetAndSetGamePgn(pgn);
      prepareNewAnalysisSession(pgn);
      await router.push("/analysis");
    },
    [resetAndSetGamePgn, router]
  );

  const hasMoves = game.history().length > 0;
  const gameLoaded = isGameLoaded(game);
  const isAnalyzing = progress > 0;
  const needsReanalysis =
    hasMoves && !gameEval && !isAnalyzing && !isServerGame;
  const showInlineLoader = !gameEval && !isAnalyzing;
  const fillPanel = showInlineLoader && !gameLoaded;

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

      {showInlineLoader && gameLoaded && <AnalysisEmptyState />}

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

      {!gameEval && !isAnalyzing && gameLoaded && (
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
    </Box>
  );
}
