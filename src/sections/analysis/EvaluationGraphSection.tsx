import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "./states";
import GraphTab from "./panelBody/graphTab";
import { palette } from "@/theme/voltchessTheme";
import type { Grid2Props as GridProps } from "@mui/material";

interface Props extends GridProps {
  sticky?: boolean;
}

export default function EvaluationGraphSection({
  sticky = true,
  ...graphProps
}: Props) {
  const gameEval = useAtomValue(gameEvalAtom);

  return (
    <Box
      sx={{
        mb: 2,
        ...(sticky && {
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: palette.surfaceRaised,
          pt: 0.5,
          pb: 1,
        }),
      }}
    >
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.secondary"
        sx={{ mb: 1, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem" }}
      >
        Evaluation chart
      </Typography>

      {gameEval ? (
        <GraphTab
          {...graphProps}
          sx={{
            minHeight: { xs: 64, sm: 80 },
            height: { xs: 72, sm: 88 },
            maxHeight: 100,
            ...graphProps.sx,
          }}
        />
      ) : (
        <Box
          sx={{
            height: { xs: 72, sm: 88 },
            borderRadius: 1,
            border: `1px dashed ${palette.border}`,
            bgcolor: palette.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            The evaluation chart will appear here once analysis finishes.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
