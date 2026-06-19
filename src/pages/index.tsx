import Head from "@/components/Head";
import { useRouter } from "@/hooks/useRouter";
import { useCallback, useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { useChessActions } from "@/hooks/useChessActions";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { decodeBase64 } from "@/lib/helpers";
import {
  gameAtom,
  boardAtom,
  boardOrientationAtom,
  gameEvalAtom,
  evaluationProgressAtom,
} from "@/sections/analysis/states";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import type { Game } from "@/types/game";
import HomeGameLoader from "@/sections/home/HomeGameLoader";
import FeatureCard from "@/sections/home/FeatureCard";
import WelcomeModal from "@/sections/onboarding/WelcomeModal";
import { isOnboardingComplete } from "@/sections/onboarding/onboardingStorage";
import { usePalette } from "@/hooks/usePalette";
import { DEFAULT_SEO } from "@/data/seo";
import { BLOG_POSTS } from "@/data/blogPosts";
import NavLink from "@/components/NavLink";

function Home() {
  const palette = usePalette();
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    setOnboardingReady(true);
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const { gameFromUrl } = useGameDatabase();
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  const startAnalysis = useCallback(
    async (loadedGame: Chess, boardOrientation = true, withTour = false) => {
      const pgn = loadedGame.pgn();
      setBoardOrientation(boardOrientation);
      resetAndSetGamePgn(pgn);
      setEvaluationProgress(0);
      prepareNewAnalysisSession(pgn, boardOrientation);
      await router.push(withTour ? "/analysis?tour=1" : "/analysis");
    },
    [router, resetAndSetGamePgn, setBoardOrientation, setEvaluationProgress]
  );

  const handleOnboardingGameLoaded = useCallback(
    (loadedGame: Chess, boardOrientation = true) => {
      setShowOnboarding(false);
      void startAnalysis(loadedGame, boardOrientation, true);
    },
    [startAnalysis]
  );

  const { pgn: pgnParam, orientation: orientationParam } = router.query;

  useEffect(() => {
    const loadGameFromIdParam = (gameUrl: Game) => {
      const gameFromDb = new Chess();
      gameFromDb.loadPgn(gameUrl.pgn);
      if (game.history().join() === gameFromDb.history().join()) return;

      resetAndSetGamePgn(gameUrl.pgn);
      setEval(gameUrl.eval);
      setBoardOrientation(
        !(gameUrl.black.name === "You" && gameUrl.site === "voltchess.me")
      );
    };

    const loadGameFromPgnParam = (encodedPgn: string) => {
      const decodedPgn = decodeBase64(encodedPgn);
      if (!decodedPgn) return;

      const parsedGame = new Chess();
      parsedGame.loadPgn(decodedPgn);
      if (game.history().join() === parsedGame.history().join()) return;

      resetAndSetGamePgn(decodedPgn);
      setBoardOrientation(orientationParam !== "black");
    };

    if (gameFromUrl) {
      loadGameFromIdParam(gameFromUrl);
    } else if (typeof pgnParam === "string") {
      loadGameFromPgnParam(pgnParam);
    }
  }, [
    gameFromUrl,
    pgnParam,
    orientationParam,
    game,
    resetAndSetGamePgn,
    setEval,
    setBoardOrientation,
  ]);

  if (evaluationProgress) return null;

  return (
    <>
      <Head>
        <title>{DEFAULT_SEO.title}</title>
        <meta name="description" content={DEFAULT_SEO.description} />
        <meta name="keywords" content={DEFAULT_SEO.keywords} />
      </Head>

      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Typography
          variant="h1"
          sx={{
            mb: 0.5,
            color: palette.text,
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          {onboardingReady && showOnboarding
            ? "Free Chess Game Review"
            : "Welcome back"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>
          {DEFAULT_SEO.description}
        </Typography>

        {onboardingReady && (
          <WelcomeModal
            open={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onGameLoaded={handleOnboardingGameLoaded}
          />
        )}

        <Box sx={{ mb: 3 }}>
          <HomeGameLoader onGameLoaded={startAnalysis} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FeatureCard
              title="Play vs Engine"
              description="Challenge Stockfish at a rating that matches your level. Adjustable strength and time controls."
              icon="mdi:chess-knight"
              href="/play"
              actionLabel="Start a game"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FeatureCard
              title="Tactical Puzzles"
              description="Solve puzzles to sharpen your calculation and pattern recognition."
              icon="mdi:puzzle-outline"
              href="/puzzles"
              actionLabel="Solve puzzles"
            />
          </Grid>
        </Grid>

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
            sx={{ fontSize: "1.1rem", fontWeight: 700, mb: 1 }}
          >
            Chess game review & analysis guides
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Learn how to review games free, import from Chess.com and Lichess,
            and use Stockfish to find blunders.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {BLOG_POSTS.slice(0, 5).map((post) => (
              <NavLink key={post.slug} href={`/blog/${post.slug}`}>
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
            ))}
            <NavLink href="/blog">
              <Typography
                fontSize="0.85rem"
                fontWeight={600}
                sx={{ color: palette.accent, mt: 0.5 }}
              >
                View all guides →
              </Typography>
            </NavLink>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default Home;
