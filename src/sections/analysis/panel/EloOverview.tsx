import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "../states";
import { usePalette } from "@/hooks/usePalette";

function EloCard({ value, side }: { value: number; side: "white" | "black" }) {
  const palette = usePalette();
  const isWhite = side === "white";
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        maxWidth: 110,
        py: 1.25,
        px: 1,
        borderRadius: 1.5,
        textAlign: "center",
        bgcolor: isWhite ? palette.playerLightBg : palette.surface,
        color: isWhite ? palette.playerLightText : palette.text,
        border: `1px solid ${palette.border}`,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "1.35rem", sm: "1.6rem" },
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function EloOverview() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  if (!gameEval?.estimatedElo) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        mb: 0,
        width: "100%",
      }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <EloCard value={Math.round(gameEval.estimatedElo.white)} side="white" />
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 72,
        }}
      >
        <Icon icon="mdi:chart-bar" width={22} color={palette.textMuted} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, fontWeight: 600, fontSize: "0.7rem" }}
        >
          ELO
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <EloCard value={Math.round(gameEval.estimatedElo.black)} side="black" />
      </Box>
    </Box>
  );
}
