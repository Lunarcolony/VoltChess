import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";

import { Box, Typography, Grid } from "@mui/material";

import LoadGameButton from "@/sections/loadGame/startanalyzing";
import { useChessActions } from "@/hooks/useChessActions";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { decodeBase64 } from "@/lib/helpers";
import { ACCESS_TOKEN } from "@/constants";

import {
  gameAtom,
  boardAtom,
  boardOrientationAtom,
  gameEvalAtom,
  evaluationProgressAtom,
} from "@/sections/analysis/states";

import type { Game } from "@/types/game";

function Home() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);

  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const { gameFromUrl } = useGameDatabase();
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(ACCESS_TOKEN);
    }
    return false;
  };

  // Handle start analyzing with authentication check
  const handleStartAnalyzing = async (game: Chess) => {
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    // If authenticated, proceed with analysis
    await router.push("/analysis");
    resetAndSetGamePgn(game.pgn());
  };

  const { pgn: pgnParam, orientation: orientationParam } = router.query;

  useEffect(() => {
    const loadGameFromIdParam = (gameUrl: Game) => {
      const gameFromDb = new Chess();
      gameFromDb.loadPgn(gameUrl.pgn);
      if (game.history().join() === gameFromDb.history().join()) return;

      resetAndSetGamePgn(gameUrl.pgn);
      setEval(gameUrl.eval);
      setBoardOrientation(
        !(gameUrl.black.name === "You" && gameUrl.site === "voltchess.com")
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

  const isGameLoaded =
    gameFromUrl !== undefined ||
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  if (evaluationProgress) return null;

  return (
    <>
      <Head>
        <title>VoltChess — Free Online Chess Analyzer</title>
        <meta
          name="description"
          content="VoltChess is the best free chess analysis website. Upload PGNs, review your games with advanced AI, and find the perfect alternative to Chess.com's Game Review."
        />
        <meta
          name="keywords"
          content="free chess analyzer, PGN review, voltchess, chess.com game review alternative, open source chess analysis, AI chess game review, upload pgn free"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section */}
      <Box
        sx={{
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          padding: { xs: 2, md: 4 },
        }}
      >
        {/* Blue Glow Overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 20% 30%, rgba(59, 154, 198, 0.08) 0%, transparent 50%), " +
              "radial-gradient(circle at 80% 70%, rgba(127, 221, 255, 0.05) 0%, transparent 50%), " +
              "radial-gradient(circle at 50% 50%, rgba(59, 154, 198, 0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Main Content */}
        <Grid
          container
          spacing={6}
          alignItems="center"
          justifyContent="center"
          sx={{
            width: { xs: "100%", md: "90%" },
            maxWidth: 1400,
            minHeight: { xs: "100vh", md: "79vh" },
            px: { xs: 2, md: 6 },
            py: { xs: 6, md: 10 },
          }}
        >
          {/* Left: Hero Text */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{
                background: "linear-gradient(90deg, #3b9ac6, #7fddff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "2.5rem", md: "4rem" },
                mb: 2,
              }}
            >
              VoltChess ⚡
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500 }}
            >
              Free, instant, AI-powered chess analysis. Upload your PGN and get
              blunders, inaccuracies, and best moves—no account needed.
            </Typography>
            <Box mt={4}>
              <LoadGameButton
                label={isGameLoaded ? "Load a new game" : "Start Analyzing"}
                size="large"
                setGame={handleStartAnalyzing}
                sx={{
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  borderRadius: 3,
                  px: 5,
                  py: 2,
                  background:
                    "linear-gradient(90deg, #232526 0%, #3b9ac6 60%, #7fddff 100%)",
                  color: "#fff",
                  boxShadow: "0 0 32px 4px #3b9ac6, 0 0 16px 2px #7fddff",
                  textShadow: "0 0 8px #7fddff",
                  border: "2px solid #3b9ac6",
                  transition: "all 0.2s",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, #3385ad 0%, #3b9ac6 80%, #7fddff 100%)",
                    boxShadow: "0 0 48px 8px #7fddff, 0 0 24px 8px #3b9ac6",
                    textShadow: "0 0 16px #7fddff",
                    border: "2.5px solid #7fddff",
                  },
                }}
              />
            </Box>
          </Grid>
          {/* Right: Illustration or Feature List */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    background: "rgba(40, 44, 52, 0.85)",
                    borderRadius: 4,
                    p: 3,
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    border: "1.5px solid #3a3f4b",
                    backdropFilter: "blur(8px)",
                    transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                    "&:hover": {
                      background: "rgba(40, 44, 52, 0.95)",
                      boxShadow: "0 12px 36px 0 rgba(31, 38, 135, 0.45)",
                      border: "2px solid #3b9ac6",
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.light"
                    gutterBottom
                  >
                    Why VoltChess?
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    Powerful, user-friendly PGN analysis for all levels. Learn,
                    grow, and dominate your games.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    background: "rgba(40, 44, 52, 0.85)",
                    borderRadius: 4,
                    p: 3,
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    border: "1.5px solid #3a3f4b",
                    backdropFilter: "blur(8px)",
                    transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                    "&:hover": {
                      background: "rgba(40, 44, 52, 0.95)",
                      boxShadow: "0 12px 36px 0 rgba(31, 38, 135, 0.45)",
                      border: "2px solid #7fddff",
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.light"
                    gutterBottom
                  >
                    Fast & Accurate
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    Instant results, engine-powered backend, and clear
                    feedback—faster than traditional chess sites.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    background: "rgba(40, 44, 52, 0.85)",
                    borderRadius: 4,
                    p: 3,
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    border: "1.5px solid #3a3f4b",
                    backdropFilter: "blur(8px)",
                    transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                    "&:hover": {
                      background: "rgba(40, 44, 52, 0.95)",
                      boxShadow: "0 12px 36px 0 rgba(31, 38, 135, 0.45)",
                      border: "2px solid #3b9ac6",
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.light"
                    gutterBottom
                  >
                    100% Free
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    No signup, no paywall, no limits. Just upload your PGN and
                    start analyzing.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    background: "rgba(40, 44, 52, 0.85)",
                    borderRadius: 4,
                    p: 3,
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    border: "1.5px solid #3a3f4b",
                    backdropFilter: "blur(8px)",
                    transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                    "&:hover": {
                      background: "rgba(40, 44, 52, 0.95)",
                      boxShadow: "0 12px 36px 0 rgba(31, 38, 135, 0.45)",
                      border: "2px solid #7fddff",
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.light"
                    gutterBottom
                  >
                    No Subscriptions
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    VoltChess is the perfect free alternative to Chess.com Game
                    Review—no ads, no subscriptions.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {/* Footer */}
        <Box sx={{ mt: 8, mb: 2, zIndex: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} VoltChess. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

// Export the Home component directly (no ProtectedRoute wrapper)
export default Home;
