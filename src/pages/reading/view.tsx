import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useSearchParams } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { fetchArticle } from "@/lib/reading/fetchArticle";
import {
  cacheArticleContent,
  getCachedArticleContent,
  getScrollPosition,
  isArticleRead,
  isArticleSaved,
  markArticleRead,
  removeSavedArticle,
  saveArticle,
  setScrollPosition,
} from "@/lib/reading/storage";
import type { FeedItem } from "@/lib/reading/types";
import ArticleBody from "@/sections/reading/ArticleBody";
import ReaderControls, {
  useReaderStyles,
} from "@/sections/reading/ReaderControls";
import ReadingShell from "@/sections/reading/ReadingShell";

export default function ReadingViewPage() {
  const [searchParams] = useSearchParams();
  const articleUrl = searchParams.get("url") || "";
  const queryTitle = searchParams.get("title") || "Article";
  const sourceId = searchParams.get("source") || "custom";

  const [title, setTitle] = useState(queryTitle);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [read, setRead] = useState(false);
  const [prefsTick, setPrefsTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const readerStyles = useReaderStyles(prefsTick);

  const loadArticle = useCallback(async () => {
    if (!articleUrl) {
      setError("No article URL provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cached = getCachedArticleContent(articleUrl);
    if (cached) {
      setTitle(cached.title);
      setContent(cached.content);
      setLoading(false);
      return;
    }

    try {
      const article = await fetchArticle(articleUrl);
      setTitle(article.title);
      setContent(article.content);
      cacheArticleContent(articleUrl, article.title, article.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load article.");
    } finally {
      setLoading(false);
    }
  }, [articleUrl]);

  useEffect(() => {
    setSaved(isArticleSaved(articleUrl));
    setRead(isArticleRead(articleUrl));
    void loadArticle();
  }, [articleUrl, loadArticle]);

  useEffect(() => {
    const savedScroll = getScrollPosition(articleUrl);
    if (savedScroll > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll;
    }
  }, [articleUrl, content]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !articleUrl) return;

    const onScroll = () => {
      setScrollPosition(articleUrl, node.scrollTop);
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [articleUrl, content]);

  const feedItem: FeedItem = {
    url: articleUrl,
    title,
    sourceId,
    excerpt: "",
    publishedAt: new Date().toISOString(),
  };

  const toggleSaved = () => {
    if (saved) {
      removeSavedArticle(articleUrl);
      setSaved(false);
      return;
    }
    saveArticle(feedItem);
    setSaved(true);
  };

  const toggleRead = () => {
    const next = !read;
    markArticleRead(articleUrl, next);
    setRead(next);
  };

  const headerActions = (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <ReaderControls
        onPrefsChange={() => setPrefsTick((value) => value + 1)}
      />
      <Tooltip title={saved ? "Remove from saved" : "Save for later"}>
        <IconButton onClick={toggleSaved} size="small">
          <Icon
            icon={saved ? "mdi:bookmark" : "mdi:bookmark-outline"}
            width={20}
          />
        </IconButton>
      </Tooltip>
      <Tooltip title={read ? "Mark unread" : "Mark read"}>
        <IconButton onClick={toggleRead} size="small">
          <Icon
            icon={read ? "mdi:check-circle" : "mdi:check-circle-outline"}
            width={20}
          />
        </IconButton>
      </Tooltip>
      <Button
        size="small"
        href={articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<Icon icon="mdi:open-in-new" width={16} />}
      >
        Original
      </Button>
    </Stack>
  );

  return (
    <ReadingShell backHref="/reading" title={title} actions={headerActions}>
      <PageTitle title={title} noindex />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box
          ref={scrollRef}
          sx={{
            height: "calc(100vh - 57px)",
            overflow: "auto",
          }}
        >
          {error && (
            <Alert
              severity="warning"
              sx={{ maxWidth: readerStyles.maxWidth, mx: "auto", mt: 2, px: 2 }}
              action={
                <Button
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open original
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {!error && (
            <ArticleBody
              content={content}
              fontSize={readerStyles.fontSize}
              maxWidth={readerStyles.maxWidth}
            />
          )}
        </Box>
      )}
    </ReadingShell>
  );
}
