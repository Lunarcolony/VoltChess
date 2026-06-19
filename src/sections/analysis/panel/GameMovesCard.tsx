import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameAtom } from "../states";
import { usePlayersData } from "@/hooks/usePlayersData";
import MovesPanel from "../panelBody/classificationTab/movesPanel";
import { usePalette } from "@/hooks/usePalette";

export default function GameMovesCard() {
  const palette = usePalette();
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const headers = game.getHeaders();
  const result = headers.Result || "?";

  if (!game.history().length) return null;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 1,
          px: 1.25,
          py: 1,
          borderBottom: `1px solid ${palette.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <Typography fontSize="0.78rem" fontWeight={600} noWrap textAlign="left">
          {white.name}
          {white.rating ? ` (${white.rating})` : ""}
        </Typography>

        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 0.75,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Typography fontSize="0.75rem" fontWeight={700}>
            {result}
          </Typography>
        </Box>

        <Typography
          fontSize="0.78rem"
          fontWeight={600}
          noWrap
          textAlign="right"
        >
          {black.name}
          {black.rating ? ` (${black.rating})` : ""}
        </Typography>
      </Box>

      <Box
        id="moves-panel"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 0.5,
          py: 0.5,
          maxHeight: { xs: "28vh", sm: "32vh", md: "none" },
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: palette.border,
            borderRadius: 2,
          },
        }}
      >
        <MovesPanel />
      </Box>
    </Box>
  );
}
