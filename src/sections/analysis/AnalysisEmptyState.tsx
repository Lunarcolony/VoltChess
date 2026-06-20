import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom, gameEvalAtom } from "./states";
import { usePalette } from "@/hooks/usePalette";

/** Shown when a game is loaded but has no report yet (and not currently analyzing). */
export default function AnalysisEmptyState() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);

  if (gameEval || progress > 0) return null;

  return (
    <Box
      sx={{
        py: 2.5,
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
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
        Not analyzed
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Stockfish will evaluate this game automatically. Results appear here
        when analysis finishes.
      </Typography>
    </Box>
  );
}
