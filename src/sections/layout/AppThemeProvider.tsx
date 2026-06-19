import { PropsWithChildren, useMemo, useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useAtomValue } from "jotai";
import { colorThemeAtom } from "@/theme/colorThemeAtom";
import { getPalette } from "@/theme/themes";
import { createAppTheme } from "@/theme/voltchessTheme";

export default function AppThemeProvider({ children }: PropsWithChildren) {
  const themeId = useAtomValue(colorThemeAtom);
  const colorPalette = useMemo(() => getPalette(themeId), [themeId]);
  const muiTheme = useMemo(() => createAppTheme(colorPalette), [colorPalette]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", colorPalette.bg);
  }, [colorPalette.bg]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
