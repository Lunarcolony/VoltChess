import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ReactNode } from "react";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

export function CoachStatCard({
  label,
  value,
  icon,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  hint?: string;
  accent?: string;
}) {
  const palette = usePalette();
  const color = accent ?? palette.accent;

  return (
    <Box
      sx={{
        flex: "1 1 140px",
        minWidth: 130,
        p: 2,
        borderRadius: 2,
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${palette.border}`,
        transition: "border-color 0.15s",
        "&:hover": { borderColor: alpha(color, 0.45) },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(color, 0.12),
          }}
        >
          <Icon icon={icon} width={18} color={color} />
        </Box>
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block" }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function CoachPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

export function CoachEmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const palette = usePalette();
  return (
    <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
      <Icon icon={icon} width={40} color={palette.textMuted} />
      <Typography fontWeight={600} sx={{ mt: 1.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  );
}
