import { Box, Chip, Typography, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { SchemaOrg } from "@/components/SchemaOrg";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_URL, TRUST_BULLETS } from "@/data/seo";
import { usePalette } from "@/hooks/usePalette";
import HomeGameLoader from "@/sections/home/HomeGameLoader";
import { useCallback, useEffect, useState } from "react";
import { Chess } from "chess.js";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "@/hooks/useRouter";
import { useChessActions } from "@/hooks/useChessActions";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import { ENGINE_DEFAULTS } from "@/constants/engineDefaults";
import { preloadEngine } from "@/lib/engine/sharedEngine";

function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  const palette = usePalette();
  const router = useRouter();
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  useEffect(() => {
    void preloadEngine(ENGINE_DEFAULTS.engine);
  }, []);

  const startAnalysis = useCallback(
    async (loadedGame: Chess, boardOrientation = true) => {
      const pgn = loadedGame.pgn();
      setBoardOrientation(boardOrientation);
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
      setEvaluationProgress(0);
      prepareNewAnalysisSession(pgn, boardOrientation);
      setLoadingMessage("Preparing your game analysis…");
      await router.push("/analysis");
    },
    [
      router,
      resetBoard,
      setGamePgn,
      setEval,
      setBoardOrientation,
      setEvaluationProgress,
    ]
  );

  if (loadingMessage || evaluationProgress) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography color="text.secondary">{loadingMessage}</Typography>
      </Box>
    );
  }

  return (
    <>
      <PageTitle
        title="Chess Game Review & Analysis Guides | VoltChess Blog"
        description="Free guides on chess game review, Chess.com analysis, Stockfish game analysis, blunder finding, and PGN review. Learn how to study your games on VoltChess."
        path="/blog"
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "VoltChess Guides",
          description:
            "Free chess game review and analysis guides powered by Stockfish.",
          url: `${SITE_URL}/blog`,
          publisher: { "@type": "Organization", name: "VoltChess" },
        }}
      />

      <Box sx={{ maxWidth: 960, mx: "auto", pb: 5 }}>
        <Box
          sx={{
            mb: 3.5,
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            bgcolor: palette.surface,
            border: `1px solid ${palette.border}`,
            backgroundImage: `radial-gradient(ellipse at top left, ${alpha(palette.accent, 0.14)}, transparent 55%)`,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 1,
              color: palette.text,
              fontSize: { xs: "1.75rem", sm: "2.15rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Chess Analysis Guides
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.65, maxWidth: 640 }}
          >
            Practical how-tos for reviewing your games: import from Chess.com or
            Lichess, read the eval graph, find blunders, and turn engine data
            into real improvement — free, unlimited Stockfish in your browser.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
            {TRUST_BULLETS.map((bullet) => (
              <Chip
                key={bullet}
                icon={<Icon icon="mdi:check-circle-outline" width={16} />}
                label={bullet}
                size="small"
                sx={{
                  height: "auto",
                  py: 0.75,
                  bgcolor: alpha(palette.accent, 0.08),
                  border: `1px solid ${alpha(palette.accent, 0.18)}`,
                  color: palette.textMuted,
                  "& .MuiChip-icon": { color: palette.accent },
                }}
              />
            ))}
          </Box>
          <HomeGameLoader onGameLoaded={startAnalysis} />
        </Box>

        <Typography
          component="h2"
          sx={{
            fontSize: "1.1rem",
            fontWeight: 700,
            mb: 1.5,
            color: palette.text,
          }}
        >
          All guides
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {BLOG_POSTS.map((post) => (
            <Box
              key={post.slug}
              component={Link}
              to={`/blog/${post.slug}`}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 2.25,
                borderRadius: 2,
                textDecoration: "none",
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
                transition: "border-color 0.15s ease, transform 0.15s ease",
                "&:hover": {
                  borderColor: alpha(palette.accent, 0.5),
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(palette.accent, 0.12),
                  color: palette.accent,
                }}
              >
                <Icon
                  icon={post.icon ?? "mdi:book-open-page-variant"}
                  width={20}
                />
              </Box>
              <Typography
                fontWeight={700}
                sx={{ color: palette.text, lineHeight: 1.35 }}
              >
                {post.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flex: 1, lineHeight: 1.55 }}
              >
                {post.excerpt}
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textMuted }}>
                {formatDate(post.publishedAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
