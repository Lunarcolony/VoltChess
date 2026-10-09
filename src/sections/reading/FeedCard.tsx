import { Box, Chip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { usePalette } from "@/hooks/usePalette";
import { getReadingSource } from "@/data/readingSources";
import type { FeedItem } from "@/lib/reading/types";

interface Props {
  item: FeedItem;
  read?: boolean;
  saved?: boolean;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FeedCard({ item, read = false, saved = false }: Props) {
  const palette = usePalette();
  const source = getReadingSource(item.sourceId);

  return (
    <Box
      component={RouterLink}
      to={`/reading/view?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}&source=${encodeURIComponent(item.sourceId)}`}
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        bgcolor: palette.surfaceRaised,
        transition: "border-color 0.15s ease, transform 0.15s ease",
        "&:hover": {
          borderColor: alpha(palette.accent, 0.45),
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: read ? palette.textMuted : palette.accent,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: palette.textMuted,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {source?.name || item.sourceId}
        </Typography>
        <Typography
          sx={{ fontSize: "0.75rem", color: palette.textMuted, ml: "auto" }}
        >
          {formatDate(item.publishedAt)}
        </Typography>
        {saved && (
          <Chip
            label="Saved"
            size="small"
            sx={{
              height: 22,
              fontSize: "0.7rem",
              bgcolor: alpha(palette.accent, 0.12),
              color: palette.accent,
            }}
          />
        )}
      </Box>
      <Typography
        component="h2"
        sx={{
          fontSize: "1.05rem",
          fontWeight: 700,
          lineHeight: 1.35,
          mb: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {item.title}
      </Typography>
      {item.excerpt && (
        <Typography
          sx={{
            fontSize: "0.92rem",
            lineHeight: 1.6,
            color: palette.textMuted,
          }}
        >
          {item.excerpt}
        </Typography>
      )}
    </Box>
  );
}
