import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid2 as Grid,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { CustomSquareStyles } from "react-chessboard/dist/chessboard/types";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { uciMoveParams } from "@/lib/chess";
import { updatePuzzleElo } from "@/lib/elo";
import { fetchLichessDailyPuzzle, type DailyPuzzle } from "@/lib/lichess";
import { PUZZLE_BANK, type PuzzleData } from "@/data/puzzles/bank";

const ELO_STORAGE_KEY = "voltchess-puzzle-elo";
const DEFAULT_ELO = 1200;

function readStoredElo(): number {
  try {
    const raw = localStorage.getItem(ELO_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : DEFAULT_ELO;
  } catch {
    return DEFAULT_ELO;
  }
}

function pickPuzzleNearElo(elo: number, excludeIds: Set<string>): PuzzleData {
  const pool = PUZZLE_BANK.filter((p) => !excludeIds.has(p.id));
  const candidates = pool.length > 0 ? pool : PUZZLE_BANK;
  const sorted = [...candidates].sort(
    (a, b) => Math.abs(a.rating - elo) - Math.abs(b.rating - elo)
  );
  const topPicks = sorted.slice(0, Math.min(3, sorted.length));
  return topPicks[Math.floor(Math.random() * topPicks.length)];
}

function moveToUci(chess: Chess, from: string, to: string, promotion?: string) {
  const move = chess.move({ from, to, promotion: promotion || "q" });
  return move ? move.from + move.to + (move.promotion || "") : null;
}

function ratingColor(rating: number): "success" | "warning" | "error" {
  if (rating < 1000) return "success";
  if (rating < 1400) return "warning";
  return "error";
}

export default function Puzzles() {
  const palette = usePalette();
  const cardSx = useCardSx();

  const [userElo, setUserElo] = useState<number>(() => readStoredElo());
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData>(() =>
    pickPuzzleNearElo(readStoredElo(), new Set())
  );
  const [isDailyActive, setIsDailyActive] = useState(false);

  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState("");
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMistake, setHasMistake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [eloDelta, setEloDelta] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  useEffect(() => {
    try {
      localStorage.setItem(ELO_STORAGE_KEY, String(Math.round(userElo)));
    } catch {
      /* localStorage unavailable — ignore */
    }
  }, [userElo]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetchLichessDailyPuzzle(controller.signal)
      .then((puzzle) => {
        if (!cancelled) setDailyPuzzle(puzzle);
      })
      .finally(() => {
        if (!cancelled) setDailyLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const initializePuzzle = useCallback((puzzle: PuzzleData | DailyPuzzle) => {
    const newGame = new Chess();
    newGame.load(puzzle.fen);
    setGame(newGame);
    setGamePosition(newGame.fen());
    setSolutionIndex(0);
    setIsCompleted(false);
    setHasMistake(false);
    setShowHint(false);
    setEloDelta(null);
  }, []);

  useEffect(() => {
    initializePuzzle(
      isDailyActive && dailyPuzzle ? dailyPuzzle : currentPuzzle
    );
  }, [currentPuzzle, dailyPuzzle, isDailyActive, initializePuzzle]);

  const activePuzzle: PuzzleData | DailyPuzzle =
    isDailyActive && dailyPuzzle ? dailyPuzzle : currentPuzzle;

  const playOpponentReplies = useCallback(
    (
      gameCopy: Chess,
      startIndex: number
    ): { game: Chess; nextIndex: number } => {
      let idx = startIndex;
      while (idx < activePuzzle.solution.length) {
        const uci = activePuzzle.solution[idx];
        try {
          gameCopy.move(uciMoveParams(uci));
          idx++;
        } catch {
          break;
        }
      }
      return { game: gameCopy, nextIndex: idx };
    },
    [activePuzzle.solution]
  );

  const finishPuzzle = useCallback(
    (solvedCleanly: boolean) => {
      setIsCompleted(true);
      const nextElo = updatePuzzleElo(
        userElo,
        activePuzzle.rating,
        solvedCleanly
      );
      setEloDelta(Math.round(nextElo - userElo));
      setUserElo(nextElo);
      if (!isDailyActive) {
        setSolvedIds((prev) => new Set(prev).add(activePuzzle.id));
      }
    },
    [activePuzzle, isDailyActive, userElo]
  );

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isCompleted) return false;

    const expectedUci = activePuzzle.solution[solutionIndex];
    if (!expectedUci) return false;

    const gameCopy = new Chess(game.fen());

    try {
      const playedUci = moveToUci(gameCopy, sourceSquare, targetSquare);
      if (!playedUci) return false;

      if (playedUci !== expectedUci) {
        setHasMistake(true);
        setFeedback({
          show: true,
          message: "That's not the best move. Try again.",
          type: "error",
        });
        return false;
      }

      let nextIndex = solutionIndex + 1;
      const afterReplies = playOpponentReplies(gameCopy, nextIndex);
      setGame(afterReplies.game);
      setGamePosition(afterReplies.game.fen());
      nextIndex = afterReplies.nextIndex;

      if (nextIndex >= activePuzzle.solution.length) {
        finishPuzzle(!hasMistake);
        setFeedback({
          show: true,
          message: hasMistake
            ? "Puzzle solved — but you'll get full rating credit next time without mistakes."
            : "Correct! Puzzle solved.",
          type: "success",
        });
      } else {
        setSolutionIndex(nextIndex);
        setFeedback({
          show: true,
          message: "Good move. Keep going.",
          type: "success",
        });
      }

      return true;
    } catch {
      setFeedback({
        show: true,
        message: "Invalid move.",
        type: "error",
      });
      return false;
    }
  };

  const handleGiveUp = () => {
    if (isCompleted) return;
    setHasMistake(true);
    const afterReplies = playOpponentReplies(
      new Chess(game.fen()),
      solutionIndex
    );
    setGame(afterReplies.game);
    setGamePosition(afterReplies.game.fen());
    finishPuzzle(false);
    setFeedback({
      show: true,
      message: "Here's the solution — no rating lost beyond a normal miss.",
      type: "info",
    });
  };

  const handleNextPuzzle = () => {
    setIsDailyActive(false);
    setCurrentPuzzle(pickPuzzleNearElo(userElo, solvedIds));
  };

  const handlePlayDaily = () => {
    if (!dailyPuzzle) return;
    setIsDailyActive(true);
  };

  const hintSquare = useMemo(() => {
    if (!showHint) return null;
    const uci = activePuzzle.solution[solutionIndex];
    return uci ? uci.slice(0, 2) : null;
  }, [showHint, activePuzzle.solution, solutionIndex]);

  const hintSquareStyles: CustomSquareStyles = useMemo(() => {
    if (!hintSquare) return {};
    return {
      [hintSquare]: {
        boxShadow: `inset 0 0 0 3px ${alpha(palette.accent, 0.8)}`,
      },
    };
  }, [hintSquare, palette.accent]);

  const boardOrientation =
    activePuzzle.fen.split(" ")[1] === "b" ? "black" : "white";

  return (
    <>
      <PageTitle
        title="Chess Puzzles — VoltChess"
        description="Unlimited Elo-rated chess tactics puzzles, free forever. Solve, track your rating, and drill your weaknesses."
      />

      <PageContainer
        title="Tactical Puzzles"
        subtitle={activePuzzle.description}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              icon={<Icon icon="mdi:chart-line" width={16} />}
              label={`Puzzle rating ${Math.round(userElo)}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${activePuzzle.rating}`}
              color={ratingColor(activePuzzle.rating)}
              variant="outlined"
              size="small"
            />
            {isDailyActive && (
              <Chip
                icon={<Icon icon="mdi:calendar-star" width={16} />}
                label="Puzzle of the day"
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ ...cardSx, display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 480 }}>
                <Chessboard
                  position={gamePosition}
                  onPieceDrop={onDrop}
                  boardOrientation={boardOrientation}
                  customSquareStyles={hintSquareStyles}
                  customBoardStyle={{ borderRadius: "6px" }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={cardSx}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {isCompleted ? "Puzzle solved" : "Find the best move"}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Themes
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {activePuzzle.themes.map((theme) => (
                    <Chip
                      key={theme}
                      label={theme}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.min(solutionIndex, activePuzzle.solution.length)} /{" "}
                    {activePuzzle.solution.length}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (Math.min(solutionIndex, activePuzzle.solution.length) /
                      activePuzzle.solution.length) *
                    100
                  }
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: palette.surface,
                    "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowHint(true)}
                  disabled={showHint || isCompleted}
                >
                  Hint
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleGiveUp}
                  disabled={isCompleted}
                >
                  Show solution
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNextPuzzle}
                  disabled={!isCompleted}
                >
                  Next puzzle
                </Button>
              </Box>

              {!isDailyActive && dailyPuzzle && !dailyLoading && (
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  startIcon={<Icon icon="mdi:calendar-star" width={16} />}
                  onClick={handlePlayDaily}
                  sx={{ mt: 2 }}
                >
                  Try today&apos;s Lichess puzzle instead
                </Button>
              )}

              {isCompleted && (
                <Alert
                  severity={hasMistake ? "info" : "success"}
                  sx={{ mt: 2 }}
                >
                  {hasMistake
                    ? "Solved with a mistake along the way."
                    : "Well done — solved cleanly!"}{" "}
                  {eloDelta !== null && (
                    <>
                      Rating {eloDelta >= 0 ? "+" : ""}
                      {eloDelta}.
                    </>
                  )}
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </PageContainer>

      <Snackbar
        open={feedback.show}
        autoHideDuration={3000}
        onClose={() => setFeedback({ ...feedback, show: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback({ ...feedback, show: false })}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
