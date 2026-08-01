import { PageTitle } from "@/components/pageTitle";
import { useRouter } from "@/hooks/useRouter";
import { useCallback, useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import {
  Box,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
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
import { DEFAULT_SEO, TRUST_BULLETS, isVoltChessSiteHost } from "@/data/seo";
import {
  isOnboardingComplete,
  markOnboardingComplete,
} from "@/sections/onboarding/onboardingStorage";
import { usePalette } from "@/hooks/usePalette";
import { BLOG_POSTS } from "@/data/blogPosts";
import NavLink from "@/components/NavLink";
import { ENGINE_DEFAULTS } from "@/constants/engineDefaults";
import { preloadEngine } from "@/lib/engine/sharedEngine";
import { track } from "@vercel/analytics";

function Home() {
  const palette = usePalette();
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setOnboardingReady(true);
    setShowOnboarding(!isOnboardingComplete());
    void preloadEngine(ENGINE_DEFAULTS.engine);
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
    async (
      loadedGame: Chess,
      boardOrientation = true,
      fromOnboarding = false
    ) => {
      const pgn = loadedGame.pgn();
      setBoardOrientation(boardOrientation);
      resetAndSetGamePgn(pgn);
      setEvaluationProgress(0);
      prepareNewAnalysisSession(pgn, boardOrientation);
      track("game_loaded", { source: fromOnboarding ? "onboarding" : "home" });
      setNavigating(true);
      await router.push("/analysis");
    },
    [router, resetAndSetGamePgn, setBoardOrientation, setEvaluationProgress]
  );

  const handleOnboardingGameLoaded = useCallback(
    (loadedGame: Chess, boardOrientation = true) => {
      setShowOnboarding(false);
      markOnboardingComplete();
      track("onboarding_complete");
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
        !(gameUrl.black.name === "You" && isVoltChessSiteHost(gameUrl.site))
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

  const isReturning = onboardingReady && !showOnboarding;

  if (navigating || evaluationProgress) {
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
        <Typography color="text.secondary">
          Preparing your game analysis…
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <PageTitle
        title={DEFAULT_SEO.title}
        description={DEFAULT_SEO.description}
        path="/"
      />

      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h1"
            sx={{
              mb: 1,
              color: palette.text,
              fontSize: { xs: "1.85rem", sm: "2.35rem" },
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {isReturning
              ? "Welcome back"
              : "Free Chess.com & Lichess Game Analysis"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.65, maxWidth: 720 }}
          >
            {DEFAULT_SEO.description}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                  "& .MuiChip-label": {
                    whiteSpace: "normal",
                    lineHeight: 1.35,
                  },
                }}
              />
            ))}
          </Box>
        </Box>

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
              title="Free Chess.com Analysis"
              description="Analyze Chess.com games without Premium — accuracy, blunders, and eval graph."
              icon="mdi:chess-pawn"
              href="/free-chess-com-analysis"
              actionLabel="Analyze Chess.com games"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FeatureCard
              title="Free Lichess Review"
              description="Import Lichess games by username and get a full Stockfish report in seconds."
              icon="mdi:horse"
              href="/free-lichess-game-review"
              actionLabel="Review Lichess games"
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
