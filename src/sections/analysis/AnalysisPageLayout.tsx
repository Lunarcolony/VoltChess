import { Box, Paper } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";
import { useAtomValue } from "jotai";
import { palette } from "@/theme/voltchessTheme";
import { ANALYSIS_PANEL_WIDTH, PLAYER_BAR_HEIGHT } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import { usePlayersData } from "@/hooks/usePlayersData";
import PlayerHeader from "@/components/board/playerHeader";
import { boardAtom, boardOrientationAtom, gameAtom } from "./states";
import Board from "./board";

interface Props extends PropsWithChildren {
  panelHeader?: ReactNode;
  panelFooter?: ReactNode;
  panelPinned?: ReactNode;
  useTabs?: boolean;
}

export const analysisPanelSx = {
  bgcolor: palette.surfaceRaised,
  border: `1px solid ${palette.border}`,
  borderRadius: 0,
  p: { xs: 1, sm: 1.25 },
  display: "flex",
  flexDirection: "column" as const,
  minHeight: 0,
  width: "100%",
};

/** Full-width rigid player bar (top/bottom of the board column) */
function PlayerBar({ position }: { position: "top" | "bottom" }) {
  const orientation = useAtomValue(boardOrientationAtom);
  const { white, black } = usePlayersData(gameAtom);

  const isTop = position === "top";
  const showWhite = isTop ? !orientation : orientation;
  const color = showWhite ? Color.White : Color.Black;
  const player = showWhite ? white : black;

  return (
    <Box
      sx={{
        flexShrink: 0,
        height: PLAYER_BAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        px: { xs: 1, md: 1.5 },
        bgcolor: palette.surface,
        borderBottom: isTop ? `1px solid ${palette.border}` : "none",
        borderTop: !isTop ? `1px solid ${palette.border}` : "none",
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "100%", minWidth: 0 }}>
        <PlayerHeader color={color} player={player} gameAtom={boardAtom} />
      </Box>
    </Box>
  );
}

export default function AnalysisPageLayout({
  panelHeader,
  panelFooter,
  panelPinned,
  useTabs = false,
  children,
}: Props) {
  return (
    <Box
      sx={{
        width: "100%",
        height: { xs: "auto", md: "100dvh" },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
        overflow: "hidden",
        bgcolor: palette.bg,
      }}
    >
      {/* Middle column: player bars + contained board */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: { md: `1px solid ${palette.border}` },
          minHeight: { xs: "auto", md: 0 },
        }}
      >
        <PlayerBar position="top" />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            p: { xs: 1, md: 1.5 },
          }}
        >
          <Board />
        </Box>

        <PlayerBar position="bottom" />
      </Box>

      {/* Right panel: fixed width, full height */}
      <Paper
        elevation={0}
        square
        sx={{
          width: { xs: "100%", md: ANALYSIS_PANEL_WIDTH },
          flexShrink: 0,
          height: { xs: "auto", md: "100%" },
          minHeight: { xs: 420, md: 0 },
          display: "flex",
          flexDirection: "column",
          bgcolor: palette.surfaceRaised,
          borderLeft: "none",
          p: { xs: 1, sm: 1.25 },
          overflow: "hidden",
        }}
      >
        {panelHeader}

        {panelPinned && !useTabs && (
          <Box
            sx={{
              flexShrink: 0,
              borderBottom: `1px solid ${palette.borderSubtle}`,
              pb: 1.25,
              mb: 1.25,
            }}
          >
            {panelPinned}
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: { xs: 360, md: 0 },
            overflow: useTabs ? "hidden" : "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {useTabs ? (
            children
          ) : (
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                pr: 0.25,
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: palette.border,
                  borderRadius: 3,
                },
              }}
            >
              {children}
            </Box>
          )}
        </Box>

        {panelFooter && (
          <Box
            sx={{
              pt: 1,
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
