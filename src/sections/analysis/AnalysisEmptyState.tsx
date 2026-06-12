import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom, gameEvalAtom, gameAtom } from "./states";
import { usePalette } from "@/hooks/usePalette";

export default function AnalysisEmptyState() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);
  const game = useAtomValue(gameAtom);

  if (gameEval || progress > 0 || game.history().length === 0) return null;

  return (
    <Box
      sx={{
        py: 3,
        px: 2,
        textAlign: "center",
        borderRadius: 1.5,
        border: `1px dashed ${palette.border}`,
        bgcolor: palette.surface,
        mb: 2,
      }}
    >
      <Icon
        icon="mdi:chart-timeline-variant"
        width={32}
        color={palette.textMuted}
        style={{ marginBottom: 8 }}
      />
      <Typography variant="body2" color="text.secondary">
        Analysis results will appear here once Stockfish finishes evaluating
        your game.
      </Typography>
    </Box>
  );
}
