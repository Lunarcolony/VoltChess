import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "./states";
import GraphTab from "./panelBody/graphTab";
import { usePalette } from "@/hooks/usePalette";
import type { Grid2Props as GridProps, SxProps, Theme } from "@mui/material";

interface Props extends GridProps {
  sticky?: boolean;
  containerSx?: SxProps<Theme>;
}

export default function EvaluationGraphSection({
  sticky = true,
  containerSx,
  ...graphProps
}: Props) {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);

  return (
    <Box
      sx={{
        mb: 1.5,
        width: "100%",
        ...(sticky && {
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: palette.surfaceRaised,
        }),
        ...containerSx,
      }}
    >
      {gameEval ? (
        <GraphTab
          {...graphProps}
          sx={{
            minHeight: { xs: 80, sm: 100 },
            height: { xs: 88, sm: 108 },
            maxHeight: { xs: 110, sm: 130 },
            width: "100%",
            ...graphProps.sx,
          }}
        />
      ) : (
        <Box
          sx={{
            height: { xs: 88, sm: 108 },
            borderRadius: 1.5,
            border: `1px dashed ${palette.border}`,
            bgcolor: palette.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Evaluation chart appears after analysis finishes.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
