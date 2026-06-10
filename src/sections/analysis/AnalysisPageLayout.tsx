import { Box, Paper } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";
import { palette } from "@/theme/voltchessTheme";
import Board from "./board";

interface Props extends PropsWithChildren {
  panelHeader?: ReactNode;
  panelFooter?: ReactNode;
  /** Content pinned above the scrollable panel area (e.g. progress + graph) */
  panelPinned?: ReactNode;
}

export const analysisPanelSx = {
  bgcolor: palette.surfaceRaised,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  p: { xs: 1.5, sm: 2.5 },
  display: "flex",
  flexDirection: "column" as const,
  minHeight: 0,
  width: "100%",
};

export default function AnalysisPageLayout({
  panelHeader,
  panelFooter,
  panelPinned,
  children,
}: Props) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1400,
        mx: "auto",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, sm: 2.5, md: 3 },
        alignItems: { xs: "stretch", md: "flex-start" },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: "100%", md: "auto" },
          display: "flex",
          justifyContent: "center",
          alignSelf: { xs: "center", md: "flex-start" },
          position: { md: "sticky" },
          top: { md: 12 },
        }}
      >
        <Board />
      </Box>

      <Paper
        elevation={0}
        sx={{
          ...analysisPanelSx,
          flex: 1,
          minWidth: 0,
          width: { xs: "100%", md: "auto" },
          maxWidth: { md: 520 },
          maxHeight: { md: "calc(100dvh - 88px)" },
        }}
      >
        {panelHeader}

        {panelPinned && (
          <Box
            sx={{
              flexShrink: 0,
              borderBottom: `1px solid ${palette.borderSubtle}`,
              pb: 1.5,
              mb: 1.5,
            }}
          >
            {panelPinned}
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: { xs: 200, md: 0 },
            pr: 0.5,
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: palette.border,
              borderRadius: 3,
            },
          }}
        >
          {children}
        </Box>

        {panelFooter && (
          <Box
            sx={{
              pt: 1.5,
              mt: "auto",
              flexShrink: 0,
              borderTop: `1px solid ${palette.borderSubtle}`,
            }}
          >
            {panelFooter}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
