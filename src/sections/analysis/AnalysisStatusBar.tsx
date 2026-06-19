import { Box, Button, Chip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom, gameAtom } from "./states";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import { useAnalyzeGame } from "@/hooks/useAnalyzeGame";

type Step = "load" | "analyze" | "review";

function getActiveStep(
  hasMoves: boolean,
  isAnalyzing: boolean,
  hasEval: boolean
): Step {
  if (hasEval) return "review";
  if (isAnalyzing || hasMoves) return "analyze";
  return "load";
}

export default function AnalysisStatusBar() {
  const palette = usePalette();
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const { gameEval, reanalyzeGame, engineReady } = useAnalyzeGame();

  const hasMoves = game.history().length > 0;
  const isAnalyzing = progress > 0;
  const step = getActiveStep(hasMoves, isAnalyzing, !!gameEval);
  const engineLoading = !engineReady && hasMoves && !gameEval;
  const needsReanalysis = hasMoves && !gameEval && !isAnalyzing;

  const handleGameReview = () => {
    if (isAnalyzing || engineLoading) return;
    if (gameEval) router.push("/reanalysis");
  };

  const reviewDisabled = !gameEval || isAnalyzing || engineLoading;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        <Chip
          size="small"
          icon={<Icon icon="mdi:upload" width={14} />}
          label="Game loaded"
          color={hasMoves ? "primary" : "default"}
          variant={step === "load" ? "filled" : "outlined"}
        />
        <Chip
          size="small"
          icon={<Icon icon="mdi:cog" width={14} />}
          label={
            isAnalyzing
              ? `Analyzing ${Math.round(progress)}%`
              : "Engine analysis"
          }
          color={step === "analyze" ? "primary" : "default"}
          variant={step === "analyze" ? "filled" : "outlined"}
        />
        <Chip
          size="small"
          icon={<Icon icon="mdi:clipboard-text" width={14} />}
          label="Game review"
          color={step === "review" ? "primary" : "default"}
          variant={step === "review" ? "filled" : "outlined"}
        />
      </Box>

      {engineLoading && !isAnalyzing && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Loading Stockfish engine…
        </Typography>
      )}

      {!hasMoves && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Load a game to start analysis.
        </Typography>
      )}

      {needsReanalysis && (
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          size="medium"
          disabled={!engineReady}
          onClick={() => reanalyzeGame()}
          sx={{ mb: 1.5, py: 1 }}
        >
          {engineReady ? "Re-analyze this game" : "Loading engine…"}
        </Button>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={reviewDisabled}
        onClick={handleGameReview}
        endIcon={<Icon icon="mdi:arrow-right" width={18} />}
        sx={{ py: 1.25 }}
      >
        {isAnalyzing
          ? "Analyzing…"
          : engineLoading
            ? "Preparing engine…"
            : gameEval
              ? "Open Game Review"
              : "Game Review"}
      </Button>

      {reviewDisabled && hasMoves && !needsReanalysis && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          {isAnalyzing
            ? "Please wait while we analyze every move."
            : engineLoading
              ? "The engine is starting up."
              : "Analysis will start automatically."}
        </Typography>
      )}

      {gameEval && !isAnalyzing && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            textAlign: "center",
            color: palette.accent,
            fontWeight: 600,
          }}
        >
          Analysis complete — open move-by-move review.
        </Typography>
      )}
    </Box>
  );
}
