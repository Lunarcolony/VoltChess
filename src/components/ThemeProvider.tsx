import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useState, createContext, useContext, ReactNode } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const createVoltChessTheme = (mode: ThemeMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#3b9ac6",
        light: "#7fddff",
        dark: "#3385ad",
      },
      secondary: {
        main: mode === "dark" ? "#282c34" : "#f5f5f5",
        light: mode === "dark" ? "#3a3f4b" : "#ffffff",
        dark: mode === "dark" ? "#1e2025" : "#e0e0e0",
      },
      background: {
        default: mode === "dark" ? "#232526" : "#f8f9fa",
        paper: mode === "dark" ? "rgba(40, 44, 52, 0.85)" : "rgba(255, 255, 255, 0.9)",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#000000",
        secondary: mode === "dark" ? "#b0b3b8" : "#6c757d",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 700,
      },
      h3: {
        fontSize: "1.8rem",
        fontWeight: 600,
      },
      h5: {
        fontSize: "1.2rem",
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: "blur(8px)",
            border: mode === "dark" ? "1.5px solid #3a3f4b" : "1px solid #e0e0e0",
          },
        },
      },
    },
  });

interface VoltChessThemeProviderProps {
  children: ReactNode;
}

export function VoltChessThemeProvider({ children }: VoltChessThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "dark" ? "light" : "dark"));
  };

  const theme = createVoltChessTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}