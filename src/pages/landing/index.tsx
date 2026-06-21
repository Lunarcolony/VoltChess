import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Chess } from "chess.js";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "@/hooks/useRouter";
import { useChessActions } from "@/hooks/useChessActions";
import { useAtomValue, useSetAtom } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import HomeGameLoader from "@/sections/home/HomeGameLoader";
import { PageTitle } from "@/components/pageTitle";
import { SchemaOrg } from "@/components/SchemaOrg";
import { LANDING_PAGES } from "@/data/landingPages";
import { getBlogPost } from "@/data/blogPosts";
import { TRUST_BULLETS } from "@/data/seo";
import { usePalette } from "@/hooks/usePalette";
import NavLink from "@/components/NavLink";
import { GameOrigin } from "@/types/enums";
import { Stockfish17 } from "@/lib/engine/stockfish17";

const TAB_MAP: Record<"chesscom" | "lichess" | "pgn", GameOrigin> = {
  chesscom: GameOrigin.ChessCom,
  lichess: GameOrigin.Lichess,
  pgn: GameOrigin.Pgn,
};

export default function LandingPage() {
  const { pathname } = useLocation();
  const page = LANDING_PAGES.find((entry) => entry.path === pathname);
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
    void Stockfish17.create(true).catch(() => undefined);
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

  if (!page) return <Navigate to="/" replace />;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

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
        title={page.metaTitle}
        description={page.metaDescription}
        path={page.path}
      />
      <SchemaOrg data={faqSchema} />

      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Typography
          variant="h1"
          sx={{
            mb: 0.5,
            color: palette.text,
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          {page.h1}
        </Typography>

        {page.intro.map((paragraph, idx) => (
          <Typography
            key={idx}
            variant="body1"
            color="text.secondary"
            sx={{
              mb: idx === page.intro.length - 1 ? 2 : 1.25,
              lineHeight: 1.65,
            }}
          >
            {paragraph}
          </Typography>
        ))}

        <Box
          component="ul"
          sx={{
            m: 0,
            mb: 2.5,
            pl: 2.5,
            color: palette.textMuted,
            fontSize: "0.9rem",
          }}
        >
          {TRUST_BULLETS.map((bullet) => (
            <Box component="li" key={bullet} sx={{ mb: 0.5 }}>
              {bullet}
            </Box>
          ))}
        </Box>

        <Box sx={{ mb: 3 }}>
          <HomeGameLoader
            onGameLoaded={startAnalysis}
            defaultTab={TAB_MAP[page.defaultTab]}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h2"
            sx={{ fontSize: "1.1rem", fontWeight: 700, mb: 1.5 }}
          >
            Frequently asked questions
          </Typography>
          {page.faqs.map((faq) => (
            <Box key={faq.question} sx={{ mb: 2 }}>
              <Typography
                component="h3"
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 0.5 }}
              >
                {faq.question}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.65 }}
              >
                {faq.answer}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Typography
            variant="h2"
            sx={{ fontSize: "1rem", fontWeight: 700, mb: 1 }}
          >
            Related guides
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {page.relatedBlogSlugs.map((blogSlug) => {
              const post = getBlogPost(blogSlug);
              if (!post) return null;
              return (
                <NavLink key={blogSlug} href={`/blog/${blogSlug}`}>
                  <Typography
                    fontSize="0.85rem"
                    sx={{
                      color: palette.textMuted,
                      "&:hover": { color: palette.accent },
                    }}
                  >
                    {post.title}
                  </Typography>
                </NavLink>
              );
            })}
          </Box>
        </Box>
      </Box>
    </>
  );
}
