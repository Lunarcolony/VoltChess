import { Box, IconButton, Switch, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtom, useAtomValue } from "jotai";
import {
  currentPositionAtom,
  engineDepthAtom,
  engineNameAtom,
  showBestMoveArrowAtom,
} from "../states";
import { usePalette } from "@/hooks/usePalette";
import { ENGINE_LABELS } from "@/constants";
import { getLineEvalLabel } from "@/lib/chess";
import { useState } from "react";
import EngineSettingsDialog from "@/sections/engineSettings/engineSettingsDialog";

export default function EngineEvalBar() {
  const palette = usePalette();
  const position = useAtomValue(currentPositionAtom);
  const engineName = useAtomValue(engineNameAtom);
  const engineDepth = useAtomValue(engineDepthAtom);
  const [showArrow, setShowArrow] = useAtom(showBestMoveArrowAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const line = position?.eval?.lines?.[0];
  const evalLabel = line ? getLineEvalLabel(line) : "—";
  const depth = line?.depth ?? engineDepth;
  const engineLabel = ENGINE_LABELS[engineName]?.small ?? "Stockfish";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.25,
          flexWrap: "wrap",
        }}
      >
        <Switch
          size="small"
          checked={showArrow}
          onChange={(_, v) => setShowArrow(v)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: palette.accent },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              bgcolor: palette.accent,
            },
          }}
        />

        <Typography
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            minWidth: 64,
          }}
        >
          {evalLabel}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
          Depth{" "}
          <Box component="span" sx={{ color: palette.accent, fontWeight: 600 }}>
            {depth}
          </Box>
        </Typography>

        <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
          {engineLabel}
        </Typography>

        <IconButton
          size="small"
          onClick={() => setSettingsOpen(true)}
          sx={{ color: palette.textMuted }}
        >
          <Icon icon="mdi:cog-outline" width={18} />
        </IconButton>
      </Box>

      <EngineSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
