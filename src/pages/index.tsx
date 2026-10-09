import { PageTitle } from "@/components/pageTitle";
import { useRouter } from "@/hooks/useRouter";
import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import {
  BRAND_NAME,
  DEFAULT_SEO,
  TRUST_BULLETS,
  isVoltChessSiteHost,
} from "@/data/seo";
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
import { recordGameLoaded, recordOnboardingComplete } from "@/lib/telemetry";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  const palette = usePalette();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "flex-end" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <Box sx={{ maxWidth: 640 }}>
        <Typography
          variant="overline"
          sx={{
            color: palette.accent,
            fontWeight: 700,
            letterSpacing: "0.12em",
            lineHeight: 1.6,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "1.35rem", md: "1.6rem" },
            fontWeight: 800,
            color: palette.text,
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

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
      const source = fromOnboarding ? "onboarding" : "home";
      track("game_loaded", { source });
      recordGameLoaded(source);
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
      recordOnboardingComplete();
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

      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 0, sm: 1 },
          pt: { xs: 2, md: 5 },
          pb: { xs: 4, md: 8 },
        }}
      >
        <Box
          component="header"
          sx={{
            textAlign: "center",
            maxWidth: 760,
            mx: "auto",
            mb: { xs: 3.5, md: 5 },
          }}
        >
          <Chip
            icon={<Icon icon="mdi:chess-knight" width={16} />}
            label={`${BRAND_NAME} · Free Stockfish analysis`}
            size="small"
            sx={{
              mb: 2,
              px: 0.5,
              fontWeight: 600,
              bgcolor: alpha(palette.accent, 0.12),
              border: `1px solid ${alpha(palette.accent, 0.3)}`,
              color: palette.accent,
              "& .MuiChip-icon": { color: palette.accent },
            }}
          />
          <Typography
            variant="h1"
            sx={{
              mb: 1.5,
              color: palette.text,
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" },
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {isReturning ? (
              <>
                Welcome back to{" "}
                <Box component="span" sx={{ color: palette.accent }}>
                  {BRAND_NAME}
                </Box>
              </>
            ) : (
              <>
                Free Chess.com &amp; Lichess{" "}
                <Box component="span" sx={{ color: palette.accent }}>
                  Game Analysis
                </Box>
              </>
            )}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 2.5,
              mx: "auto",
              maxWidth: 620,
              lineHeight: 1.7,
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            {DEFAULT_SEO.description}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 1,
            }}
          >
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

        <Box
          component="section"
          aria-label="Analyze a game"
          sx={{ maxWidth: 920, mx: "auto", mb: { xs: 5, md: 7 } }}
        >
          <HomeGameLoader onGameLoaded={startAnalysis} />
        </Box>

        <Box component="section" sx={{ mb: { xs: 5, md: 7 } }}>
          <SectionHeading
            eyebrow="Platforms"
            title="Review games from where you play"
            subtitle="Pull in your recent games by username and get a full engine report in seconds."
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FeatureCard
                title="Free Chess.com Analysis"
                description="Analyze Chess.com games without Premium — accuracy, blunders, and eval graph."
                icon="mdi:chess-pawn"
                href="/free-chess-com-analysis"
                actionLabel="Analyze Chess.com games"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FeatureCard
                title="Free Lichess Review"
                description="Import Lichess games by username and get a full Stockfish report in seconds."
                icon="mdi:horse"
                href="/free-lichess-game-review"
                actionLabel="Review Lichess games"
              />
            </Grid>
          </Grid>
        </Box>

        <Box component="section">
          <SectionHeading
            eyebrow="Guides"
            title="Chess game review & analysis guides"
            subtitle="Learn how to review games free, import from Chess.com and Lichess, and use Stockfish to find blunders."
            action={
              <NavLink href="/blog" fullWidth={false}>
                <Typography
                  fontSize="0.9rem"
                  fontWeight={600}
                  sx={{
                    color: palette.accent,
                    whiteSpace: "nowrap",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  View all guides →
                </Typography>
              </NavLink>
            }
          />
          <Grid container spacing={2}>
            {BLOG_POSTS.slice(0, 6).map((post) => (
              <Grid
                key={post.slug}
                size={{ xs: 12, sm: 6, md: 4 }}
                sx={{ "& > a": { height: "100%" } }}
              >
                <NavLink href={`/blog/${post.slug}`}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 2.25,
                      borderRadius: 2,
                      bgcolor: palette.surface,
                      border: `1px solid ${palette.border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      transition:
                        "border-color 0.15s ease, transform 0.15s ease",
                      "&:hover": {
                        borderColor: alpha(palette.accent, 0.4),
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.25,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(palette.accent, 0.1),
                        color: palette.accent,
                      }}
                    >
                      <Icon
                        icon={post.icon ?? "mdi:book-open-page-variant-outline"}
                        width={18}
                      />
                    </Box>
                    <Typography
                      fontSize="0.95rem"
                      fontWeight={700}
                      lineHeight={1.35}
                      sx={{ color: palette.text }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      fontSize="0.82rem"
                      lineHeight={1.55}
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.excerpt}
                    </Typography>
                  </Box>
                </NavLink>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}

export default Home;
