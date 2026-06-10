import { createTheme, alpha } from "@mui/material/styles";

export const palette = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceRaised: "#1a1a1a",
  border: "#2a2a2a",
  borderSubtle: "#1f1f1f",
  text: "#e8e8e8",
  textMuted: "#737373",
  accent: "#e8b923",
  accentHover: "#f5c842",
  accentDark: "#c9a01e",
} as const;

export const createVoltChessTheme = () =>
  createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: palette.accent,
        light: palette.accentHover,
        dark: palette.accentDark,
        contrastText: "#0a0a0a",
      },
      secondary: {
        main: palette.surfaceRaised,
        light: palette.surface,
        dark: palette.bg,
      },
      background: {
        default: palette.bg,
        paper: palette.surfaceRaised,
      },
      text: {
        primary: palette.text,
        secondary: palette.textMuted,
      },
      divider: palette.border,
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
            backgroundColor: palette.bg,
            scrollbarColor: `${palette.border} ${palette.bg}`,
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
            color: palette.bg,
            "&:hover": { backgroundColor: palette.accentHover },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${palette.border}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: palette.surface,
              "& fieldset": { borderColor: palette.border },
              "&:hover fieldset": { borderColor: palette.textMuted },
              "&.Mui-focused fieldset": { borderColor: palette.accent },
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

export const cardSx = {
  bgcolor: palette.surfaceRaised,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  p: 3,
  transition: "border-color 0.15s ease",
  "&:hover": {
    borderColor: alpha(palette.accent, 0.35),
  },
} as const;
