import { Box, Switch, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtom } from "jotai";
import { advancedModeAtom } from "./states";
import { usePalette } from "@/hooks/usePalette";

/** Compact header row switching between the standard and advanced workspace */
export default function AdvancedModeToggle() {
  const palette = usePalette();
  const [advanced, setAdvanced] = useAtom(advancedModeAtom);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        pb: 0.75,
        mb: 0.5,
        borderBottom: `1px solid ${palette.borderSubtle}`,
        flexShrink: 0,
      }}
    >
      <Icon
        icon="mdi:lightning-bolt"
        width={16}
        color={advanced ? palette.accent : palette.textMuted}
      />
      <Typography
        fontSize="0.78rem"
        fontWeight={600}
        sx={{ color: advanced ? palette.text : palette.textMuted, flex: 1 }}
      >
        Advanced analysis
      </Typography>

      <Tooltip
        title={
          advanced
            ? "Back to the simple report view"
            : "Lichess-style deep analysis: engine lines, threat mode, variations, charts and more"
        }
      >
        <Switch
          size="small"
          checked={advanced}
          onChange={(_, value) => setAdvanced(value)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: palette.accent },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              bgcolor: palette.accent,
            },
          }}
        />
      </Tooltip>
    </Box>
  );
}
