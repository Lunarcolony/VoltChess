import { ThemeProvider } from "@mui/material";
import { PropsWithChildren } from "react";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import { createVoltChessTheme } from "@/theme/voltchessTheme";
import { CssBaseline, Box, useMediaQuery, useTheme } from "@mui/material";

const theme = createVoltChessTheme();

function MainContent({ children }: PropsWithChildren) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: "100vh",
        ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
        pt: { xs: "52px", md: 0 },
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2.5, md: 3.5 },
        maxWidth: isMobile ? "100%" : `calc(100vw - ${SIDEBAR_WIDTH}px)`,
      }}
    >
      {children}
    </Box>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Sidebar />
        <MainContent>{children}</MainContent>
      </Box>
    </ThemeProvider>
  );
}
