import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";

import {
  Box,
  Container,
  Typography,
  Grid,
  Divider,
} from "@mui/material";

import LoadGameButton from "@/sections/loadGame/startanalyzing";
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

export default function Home() {
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

  const { pgn: pgnParam, orientation: orientationParam } = router.query;

  useEffect(() => {
    const loadGameFromIdParam = (gameUrl: Game) => {
      const gameFromDb = new Chess();
      gameFromDb.loadPgn(gameUrl.pgn);
      if (game.history().join() === gameFromDb.history().join()) return;

      resetAndSetGamePgn(gameUrl.pgn);
      setEval(gameUrl.eval);
      setBoardOrientation(
        gameUrl.black.name === "You" && gameUrl.site === "voltchess.com"
          ? false
          : true
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

      <Container maxWidth="md" sx={{ py: 10 }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{
            background: "linear-gradient(90deg, #3b9ac6, #7fddff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          VoltChess ⚡
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          maxWidth="600px"
          mx="auto"
          mb={4}
        >
          A free alternative to Chess.com's Game Review. Upload your PGN and get instant, AI-powered chess insights — blunders, inaccuracies, and the best moves — for free, forever.
        </Typography>

        <Box textAlign="center" mt={6}>
          <LoadGameButton
            label={isGameLoaded ? "Load a new game" : "Start Analyzing"}
            size="large"
            setGame={async (game) => {
              await router.push("/analysis");
              resetAndSetGamePgn(game.pgn());
            }}
          />
        </Box>

        <Divider sx={{ my: 8 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Why Choose VoltChess?
            </Typography>
            <Typography>
              VoltChess is a powerful, user-friendly PGN analysis tool that delivers in-depth insights for beginners and advanced players alike. Whether you're prepping for a tournament or just reviewing a casual game, our free chess analyzing tool will help you learn, grow, and dominate.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Built for Speed & Accuracy
            </Typography>
            <Typography>
              Unlike many bulky chess tools, VoltChess is optimized for instant results. Our engine-powered backend quickly evaluates your position, highlights inaccuracies, and gives you the clarity you need — faster than traditional chess sites.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              100% Free. No Account Needed.
            </Typography>
            <Typography>
              No signup. No paywall. No limits. VoltChess is completely free to use. Just upload your PGN file and instantly start analyzing your chess games without any hassle.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Perfect Alternative to Chess.com Game Review
            </Typography>
            <Typography>
              Looking for a free Chess.com Game Review replacement? VoltChess delivers many of the same features — and more — without any subscriptions or ads.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
