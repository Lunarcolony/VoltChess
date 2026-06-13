import { PropsWithChildren, ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import VoltChessLogo from "@/components/VoltChessLogo";
import { usePalette } from "@/hooks/usePalette";

export default function AuthLayout({
  children,
  title,
  subtitle,
  banner,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  banner?: ReactNode;
}>) {
  const palette = usePalette();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: palette.bg,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -10%, ${alpha(palette.accent, 0.12)} 0%, transparent 70%)`,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {banner && <Box sx={{ mb: 2 }}>{banner}</Box>}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
            gap: 1,
          }}
        >
          <VoltChessLogo size={40} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: palette.text, letterSpacing: "-0.02em" }}
          >
            VoltChess Academy
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: palette.textMuted, textAlign: "center" }}
          >
            Coach dashboards, student progress, and synced game analysis
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            p: { xs: 2.5, sm: 3 },
            boxShadow: `0 8px 32px ${alpha(palette.bg, 0.4)}`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {subtitle}
            </Typography>
          )}
          {!subtitle && <Box sx={{ mb: 2 }} />}
          {children}
        </Box>
      </Box>
    </Box>
  );
}
