import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { usePalette } from "@/hooks/usePalette";
import { READING_SOURCES } from "@/data/readingSources";
import { fetchAllFeeds } from "@/lib/reading/fetchFeed";
import type { FeedItem } from "@/lib/reading/types";
import {
  getSavedArticles,
  isArticleRead,
  isArticleSaved,
} from "@/lib/reading/storage";
import ReadingShell from "@/sections/reading/ReadingShell";
import FeedCard from "@/sections/reading/FeedCard";

type FilterId = "all" | "saved" | string;

export default function ReadingIndexPage() {
  const palette = usePalette();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [pasteUrl, setPasteUrl] = useState("");

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedItems = await fetchAllFeeds(READING_SOURCES);
      setItems(feedItems);
      if (feedItems.length === 0) {
        setError("No articles loaded. Try refreshing in a moment.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feeds.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeeds();
  }, [loadFeeds]);

  const filteredItems = useMemo(() => {
    if (filter === "saved") {
      return getSavedArticles().map((entry) => ({
        url: entry.url,
        title: entry.title,
        sourceId: entry.sourceId,
        excerpt: entry.excerpt,
        publishedAt: entry.publishedAt,
      }));
    }
    if (filter === "all") return items;
    return items.filter((item) => item.sourceId === filter);
  }, [filter, items]);

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: "All" },
    { id: "saved", label: "Saved" },
    ...READING_SOURCES.map((source) => ({ id: source.id, label: source.name })),
  ];

  const openPastedUrl = () => {
    const trimmed = pasteUrl.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      navigate(
        `/reading/view?url=${encodeURIComponent(parsed.href)}&title=${encodeURIComponent(parsed.hostname)}&source=custom`
      );
    } catch {
      setError("Enter a valid URL (including https://).");
    }
  };

  return (
    <ReadingShell>
      <PageTitle title="Reading Room" noindex />

      <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography
          sx={{
            fontSize: "1.35rem",
            fontWeight: 700,
            mb: 0.5,
            letterSpacing: "-0.02em",
          }}
        >
          Science reading
        </Typography>
        <Typography sx={{ color: palette.textMuted, mb: 3, lineHeight: 1.6 }}>
          Distraction-free articles from science news sources. Paste any URL or
          pick from the feeds below.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Paste article URL…"
            value={pasteUrl}
            onChange={(event) => setPasteUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") openPastedUrl();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:link-variant" width={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={openPastedUrl}
            sx={{ flexShrink: 0 }}
          >
            Open
          </Button>
        </Stack>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {filters.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.label}
              clickable
              color={filter === entry.id ? "primary" : "default"}
              variant={filter === entry.id ? "filled" : "outlined"}
              onClick={() => setFilter(entry.id)}
            />
          ))}
          <IconButton
            aria-label="Refresh feeds"
            onClick={() => void loadFeeds()}
            disabled={loading}
            sx={{ ml: "auto", color: palette.textMuted }}
          >
            <Icon icon="mdi:refresh" width={20} />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {filteredItems.length === 0 ? (
              <Typography
                sx={{ color: palette.textMuted, py: 4, textAlign: "center" }}
              >
                No articles in this view yet.
              </Typography>
            ) : (
              filteredItems.map((item) => (
                <FeedCard
                  key={item.url}
                  item={item}
                  read={isArticleRead(item.url)}
                  saved={isArticleSaved(item.url)}
                />
              ))
            )}
          </Stack>
        )}
      </Box>
    </ReadingShell>
  );
}
