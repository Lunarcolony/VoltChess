import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { usePalette } from "@/hooks/usePalette";

interface Props {
  title: string;
  dotColor?: string;
  children: ReactNode;
  tourId?: string;
  noPadding?: boolean;
  headerExtra?: ReactNode;
}

export default function ReportSection({
  title,
  dotColor,
  children,
  tourId,
  noPadding = false,
  headerExtra,
}: Props) {
  const palette = usePalette();

  return (
    <Box
      {...(tourId ? { "data-tour-id": tourId } : {})}
      sx={{
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
        mb: 1.5,
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderBottom: `1px solid ${palette.borderSubtle}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: dotColor ?? palette.accent,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          fontWeight={600}
          fontSize="0.8rem"
          sx={{ flex: 1 }}
        >
          {title}
        </Typography>
        {headerExtra}
      </Box>
      <Box sx={noPadding ? undefined : { p: 1.5 }}>{children}</Box>
    </Box>
  );
}
