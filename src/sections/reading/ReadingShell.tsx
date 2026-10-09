import { PropsWithChildren } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link as RouterLink } from "react-router-dom";
import { usePalette } from "@/hooks/usePalette";

interface Props extends PropsWithChildren {
  backHref?: string;
  backLabel?: string;
  title?: string;
  actions?: React.ReactNode;
}

export default function ReadingShell({
  children,
  backHref = "/reading",
  backLabel = "Library",
  title,
  actions,
}: Props) {
  const palette = usePalette();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: palette.bg,
        color: palette.text,
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderBottom: `1px solid ${palette.border}`,
          bgcolor: palette.bg,
          backdropFilter: "blur(8px)",
        }}
      >
        <IconButton
          component={RouterLink}
          to={backHref}
          aria-label={`Back to ${backLabel}`}
          sx={{ color: palette.textMuted }}
        >
          <Icon icon="mdi:arrow-left" width={22} />
        </IconButton>
        {title ? (
          <Typography
            sx={{
              flex: 1,
              fontWeight: 600,
              fontSize: "0.95rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
        ) : (
          <Typography
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Reading Room
          </Typography>
        )}
        {actions}
      </Box>
      {children}
    </Box>
  );
}
