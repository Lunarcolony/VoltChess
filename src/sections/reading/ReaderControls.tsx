import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtom } from "jotai";
import { colorThemeAtom } from "@/theme/colorThemeAtom";
import { usePalette } from "@/hooks/usePalette";
import {
  fontSizeToPx,
  getReadingPrefs,
  lineWidthToMaxWidth,
  setReadingPrefs,
} from "@/lib/reading/storage";
import type { FontSizePref, LineWidthPref } from "@/lib/reading/types";

const LIGHT_READING_THEME = "ivory";
const DARK_READING_THEME = "obsidian";

interface Props {
  onPrefsChange?: () => void;
}

export default function ReaderControls({ onPrefsChange }: Props) {
  const palette = usePalette();
  const [themeId, setThemeId] = useAtom(colorThemeAtom);
  const prefs = getReadingPrefs();
  const isDarkTheme = themeId === DARK_READING_THEME;

  const updatePrefs = (partial: Parameters<typeof setReadingPrefs>[0]) => {
    setReadingPrefs(partial);
    onPrefsChange?.();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={prefs.fontSize}
        onChange={(_, value: FontSizePref | null) => {
          if (value) updatePrefs({ fontSize: value });
        }}
        sx={{
          "& .MuiToggleButton-root": {
            px: 1,
            py: 0.25,
            fontSize: "0.72rem",
            color: palette.textMuted,
            borderColor: palette.border,
          },
        }}
      >
        {(["S", "M", "L", "XL"] as FontSizePref[]).map((size) => (
          <ToggleButton key={size} value={size}>
            {size}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={prefs.lineWidth}
        onChange={(_, value: LineWidthPref | null) => {
          if (value) updatePrefs({ lineWidth: value });
        }}
        sx={{
          ml: 0.5,
          "& .MuiToggleButton-root": {
            px: 0.75,
            py: 0.25,
            fontSize: "0.72rem",
            color: palette.textMuted,
            borderColor: palette.border,
          },
        }}
      >
        <ToggleButton value="narrow">N</ToggleButton>
        <ToggleButton value="medium">M</ToggleButton>
        <ToggleButton value="wide">W</ToggleButton>
      </ToggleButtonGroup>

      <Tooltip title={isDarkTheme ? "Light mode" : "Dark mode"}>
        <IconButton
          size="small"
          onClick={() =>
            setThemeId(isDarkTheme ? LIGHT_READING_THEME : DARK_READING_THEME)
          }
          sx={{ color: palette.textMuted }}
        >
          <Icon
            icon={isDarkTheme ? "mdi:weather-sunny" : "mdi:weather-night"}
            width={18}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export function useReaderStyles(revision = 0): {
  fontSize: number;
  maxWidth: number;
} {
  void revision;
  const prefs = getReadingPrefs();
  return {
    fontSize: fontSizeToPx(prefs.fontSize),
    maxWidth: lineWidthToMaxWidth(prefs.lineWidth),
  };
}
