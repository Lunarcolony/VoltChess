import { createTheme, alpha } from "@mui/material/styles";
import { COLOR_THEMES, DEFAULT_COLOR_THEME } from "./themes";
import type { ColorPalette } from "./themes";

/** @deprecated Use usePalette() or getPalette() */
export const palette = COLOR_THEMES[DEFAULT_COLOR_THEME];

export const createAppTheme = (colorPalette: ColorPalette) =>
  createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: colorPalette.accent,
        light: colorPalette.accentHover,
        dark: colorPalette.accentDark,
        contrastText: colorPalette.onAccent,
      },
      secondary: {
        main: colorPalette.surfaceRaised,
        light: colorPalette.surface,
        dark: colorPalette.bg,
      },
      background: {
        default: colorPalette.bg,
        paper: colorPalette.surfaceRaised,
      },
      text: {
        primary: colorPalette.text,
        secondary: colorPalette.textMuted,
      },
      divider: colorPalette.border,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" },
      h2: { fontSize: "1.35rem", fontWeight: 600, letterSpacing: "-0.01em" },
      h3: { fontSize: "1.15rem", fontWeight: 600 },
      h5: { fontSize: "1rem", fontWeight: 600 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colorPalette.bg,
            scrollbarColor: `${colorPalette.border} ${colorPalette.bg}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            color: colorPalette.onAccent,
            "&:hover": { backgroundColor: colorPalette.accentHover },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${colorPalette.border}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: colorPalette.surface,
              "& fieldset": { borderColor: colorPalette.border },
              "&:hover fieldset": { borderColor: colorPalette.textMuted },
              "&.Mui-focused fieldset": { borderColor: colorPalette.accent },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { display: "none" },
        },
      },
    },
  });

/** @deprecated Use createAppTheme */
export const createVoltChessTheme = () =>
  createAppTheme(COLOR_THEMES[DEFAULT_COLOR_THEME]);

export function getCardSx(colorPalette: ColorPalette) {
  return {
    bgcolor: colorPalette.surfaceRaised,
    border: `1px solid ${colorPalette.border}`,
    borderRadius: 2,
    p: 3,
    transition: "border-color 0.15s ease",
    "&:hover": {
      borderColor: alpha(colorPalette.accent, 0.35),
    },
  } as const;
}

/** @deprecated Use useCardSx() */
export const cardSx = getCardSx(COLOR_THEMES[DEFAULT_COLOR_THEME]);
