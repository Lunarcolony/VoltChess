import { PropsWithChildren } from "react";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import AppThemeProvider from "./AppThemeProvider";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "@/hooks/useRouter";

/** Routes that render edge-to-edge without page padding */
const FULL_BLEED_ROUTES = ["/analysis", "/reanalysis"];

function MainContent({ children }: PropsWithChildren) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const router = useRouter();
  const isFullBleed = FULL_BLEED_ROUTES.some((route) =>
    router.pathname.startsWith(route)
  );

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: "100vh",
        ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
        pt: isFullBleed ? { xs: "52px", md: 0 } : { xs: "52px", md: 0 },
        px: isFullBleed ? 0 : { xs: 1.5, sm: 2, md: 2.5 },
        py: isFullBleed ? 0 : { xs: 1.5, md: 2 },
        maxWidth: isMobile ? "100%" : `calc(100vw - ${SIDEBAR_WIDTH}px)`,
        ...(isFullBleed && {
          height: { md: "100dvh" },
          overflow: { md: "hidden" },
        }),
      }}
    >
      {children}
    </Box>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Sidebar />
        <MainContent>{children}</MainContent>
      </Box>
    </AppThemeProvider>
  );
}
