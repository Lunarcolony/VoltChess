import Head from "@/components/Head";
import { SchemaOrg, chessSoftwareSchema, chessAnalysisServiceSchema } from "@/components/SchemaOrg";
import { useRouter } from "@/hooks/useRouter";
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

  const isGameLoaded =
    gameFromUrl !== undefined ||
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  if (evaluationProgress) return null;

  return (
    <>
      <SchemaOrg data={chessSoftwareSchema} />
      <SchemaOrg data={chessAnalysisServiceSchema} />
      
      <Head>
        <title>VoltChess — Free Chess Analyzer with AI | Best Chess.com Alternative</title>
        <meta
          name="description"
          content="Free chess analysis tool with AI feedback powered by Stockfish. Upload PGN files, get instant game analysis, find blunders and missed opportunities. No account required. Better alternative to Chess.com Game Review."
        />
        <meta
          name="keywords"
          content="free chess analyzer, chess analysis tool, AI chess feedback, stockfish chess engine, chess.com alternative, PGN analyzer, chess game review, chess blunder finder, chess mistakes analysis, online chess analysis, chess improvement tool, chess AI, chess engine analysis, chess position analyzer, chess tactics analyzer, free chess review, chess study tool"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="VoltChess — Free Chess Analyzer with AI | Best Chess.com Alternative" />
        <meta property="og:description" content="Free chess analysis tool with AI feedback powered by Stockfish. Upload PGN files, get instant game analysis, find blunders and missed opportunities. No account required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://voltchess.me/" />
        <meta property="og:image" content="https://voltchess.me/social-networks-1200x630.png" />
        <link rel="canonical" href="https://voltchess.me/" />
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
              Free Chess Analyzer ⚡
            </Typography>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                fontWeight: 600,
                color: "#7fddff",
                mb: 2,
              }}
            >
              AI-Powered Chess Analysis with Stockfish Engine
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500 }}
            >
              Get instant chess game analysis with AI feedback. Upload your PGN files and discover blunders, inaccuracies, and brilliant moves. No registration required - the best free alternative to Chess.com Game Review.
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
                    Chess.com Alternative
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    Advanced chess analysis tool with Stockfish engine. Better than paid chess analysis platforms - completely free with no restrictions.
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
                    AI Chess Analysis
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    Powered by Stockfish engine with AI feedback. Find blunders, missed tactics, and improve your chess rating instantly.
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
                    Free PGN Analyzer
                  </Typography>
                  <Typography color="text.secondary" fontSize="1rem">
                    Upload chess games in PGN format for instant analysis. No account registration, no subscription fees, completely free forever.
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
        
        {/* SEO Content Section */}
        <Box sx={{ 
          width: "100%", 
          maxWidth: 1200, 
          mx: "auto", 
          px: { xs: 2, md: 4 }, 
          py: 6,
          zIndex: 1
        }}>
          <Typography 
            variant="h3" 
            component="h3" 
            align="center" 
            sx={{ 
              mb: 4, 
              fontWeight: 700,
              color: "#7fddff"
            }}
          >
            Why Choose VoltChess for Chess Analysis?
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h4" sx={{ mb: 2, color: "#3b9ac6", fontWeight: 600 }}>
                🎯 Advanced Chess Engine Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                Our chess analyzer uses the powerful Stockfish engine to provide accurate position evaluation, 
                tactical analysis, and move recommendations. Get professional-level chess analysis that rivals 
                expensive chess software and premium platforms.
              </Typography>
              
              <Typography variant="h5" component="h4" sx={{ mb: 2, color: "#3b9ac6", fontWeight: 600 }}>
                🚀 Free Chess Game Review Tool
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                Analyze your chess games completely free without any limitations. Upload PGN files from 
                Chess.com, Lichess, or any chess platform and get instant feedback on your moves. 
                No premium subscription required.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h4" sx={{ mb: 2, color: "#3b9ac6", fontWeight: 600 }}>
                🔍 Find Chess Blunders & Mistakes
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                Identify blunders, inaccuracies, and missed tactical opportunities in your games. 
                Our AI-powered analysis helps you understand where you went wrong and how to improve 
                your chess rating and playing strength.
              </Typography>
              
              <Typography variant="h5" component="h4" sx={{ mb: 2, color: "#3b9ac6", fontWeight: 600 }}>
                📊 Visual Analysis Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                View your game analysis with interactive charts, move accuracy graphs, and detailed 
                position evaluation. Track your improvement over time and identify patterns in your play. 
                Perfect for chess students and competitive players.
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Footer */}
        <Box sx={{ mt: 8, mb: 2, zIndex: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} VoltChess - Free Chess Analyzer. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

// Export the Home component directly (no ProtectedRoute wrapper)
export default Home;
