import { Box, LinearProgress, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import {
  evaluationProgressAtom,
  gameEvalAtom,
  gameAtom,
  engineNameAtom,
} from "./states";
import { useEngine } from "@/hooks/useEngine";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

export default function EvaluationProgress() {
  const palette = usePalette();
  const progress = useAtomValue(evaluationProgressAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);

  const hasMoves = game.history().length > 0;
  const engineLoading =
    hasMoves && !gameEval && !engine?.getIsReady() && progress <= 0;
  const isAnalyzing = progress > 0;

  if (!engineLoading && !isAnalyzing) return null;

  const isFinishing = progress >= 95;
  const label = engineLoading
    ? "Loading Stockfish engine…"
    : isFinishing
      ? "Finishing analysis…"
      : "Analyzing your game…";

  const helper = engineLoading
    ? "Downloading and initializing the chess engine. This only happens once per session."
    : isFinishing
      ? "Almost done — preparing your game review."
      : "Stockfish is evaluating each position. Longer games take more time.";

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
        borderRadius: 1.5,
        bgcolor: alpha(palette.accent, 0.08),
        border: `1px solid ${alpha(palette.accent, 0.25)}`,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          gap: 2,
        }}
      >
        <Typography variant="body2" fontWeight={600} color="primary">
          {label}
        </Typography>
        {isAnalyzing && (
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>

      <LinearProgress
        variant={engineLoading ? "indeterminate" : "determinate"}
        value={engineLoading ? undefined : progress}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: palette.surface,
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            bgcolor: palette.accent,
          },
        }}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        {helper}
      </Typography>
    </Box>
  );
}
