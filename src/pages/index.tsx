import Head from "@/components/Head";
import { useRouter } from "@/hooks/useRouter";
import { useCallback, useEffect } from "react";
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
import type { Game } from "@/types/game";
import HomeGameLoader from "@/sections/home/HomeGameLoader";
import FeatureCard from "@/sections/home/FeatureCard";
import { palette } from "@/theme/voltchessTheme";

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

  const startAnalysis = useCallback(
    async (loadedGame: Chess, boardOrientation = true) => {
      setBoardOrientation(boardOrientation);
      await router.push("/analysis");
      resetAndSetGamePgn(loadedGame.pgn());
    },
    [router, resetAndSetGamePgn, setBoardOrientation]
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
        <title>VoltChess — Chess Analysis</title>
        <meta
          name="description"
          content="Analyze chess games with Stockfish. Import from Chess.com, Lichess, or PGN."
        />
      </Head>

      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Typography
          variant="h1"
          sx={{ mb: 0.5, color: palette.text }}
        >
          Welcome back
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>
          Load a game and get instant engine analysis.
        </Typography>

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

        <HomeGameLoader onGameLoaded={startAnalysis} />
      </Box>
    </>
  );
}

export default Home;
