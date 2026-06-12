import { useState, useEffect, useCallback } from "react";
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
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { uciMoveParams } from "@/lib/chess";

interface PuzzleData {
  id: string;
  fen: string;
  rating: number;
  themes: string[];
  /** UCI moves: player move, opponent reply, player move, … */
  solution: string[];
  description: string;
}

const puzzles: PuzzleData[] = [
  {
    id: "mate1",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R2K w - - 0 1",
    rating: 800,
    themes: ["mate", "back rank"],
    solution: ["e1e8"],
    description: "Back-rank mate in one.",
  },
  {
    id: "mate2",
    fen: "7k/5Q2/6P1/8/8/8/8/6K1 w - - 0 1",
    rating: 900,
    themes: ["mate"],
    solution: ["f7f8"],
    description: "Deliver checkmate with the queen.",
  },
  {
    id: "fork",
    fen: "4r1k1/8/8/5N2/8/8/8/4K3 w - - 0 1",
    rating: 1100,
    themes: ["fork", "knight"],
    solution: ["f5e7"],
    description: "Knight fork — win the rook with a double attack on the king.",
  },
  {
    id: "pin",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5",
    rating: 1200,
    themes: ["pin", "tactics"],
    solution: ["c4f7", "e8f7", "f3g5"],
    description: "Exploit the pinned f7 pawn.",
  },
];

function moveToUci(chess: Chess, from: string, to: string, promotion?: string) {
  const move = chess.move({ from, to, promotion: promotion || "q" });
  return move ? move.from + move.to + (move.promotion || "") : null;
}

function Puzzles() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState("");
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const currentPuzzle = puzzles[currentPuzzleIndex];

  const initializePuzzle = useCallback(() => {
    const newGame = new Chess();
    newGame.load(currentPuzzle.fen);
    setGame(newGame);
    setGamePosition(newGame.fen());
    setSolutionIndex(0);
    setIsCompleted(false);
    setShowHint(false);
  }, [currentPuzzle]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const playOpponentReplies = useCallback(
    (gameCopy: Chess, startIndex: number): { game: Chess; nextIndex: number } => {
      let idx = startIndex;
      while (idx < currentPuzzle.solution.length) {
        const uci = currentPuzzle.solution[idx];
        try {
          gameCopy.move(uciMoveParams(uci));
          idx++;
        } catch {
          break;
        }
      }
      return { game: gameCopy, nextIndex: idx };
    },
    [currentPuzzle.solution]
  );

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isCompleted) return false;

    const expectedUci = currentPuzzle.solution[solutionIndex];
    if (!expectedUci) return false;

    const gameCopy = new Chess(game.fen());

    try {
      const playedUci = moveToUci(gameCopy, sourceSquare, targetSquare);
      if (!playedUci) return false;

      if (playedUci !== expectedUci) {
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

      if (nextIndex >= currentPuzzle.solution.length) {
        setIsCompleted(true);
        setScore((s) => s + Math.round(currentPuzzle.rating / 100));
        setFeedback({
          show: true,
          message: "Correct! Puzzle solved.",
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

  const nextPuzzle = () => {
    setCurrentPuzzleIndex((i) => (i < puzzles.length - 1 ? i + 1 : 0));
  };

  const getDifficultyColor = (rating: number) => {
    if (rating < 1000) return "success";
    if (rating < 1300) return "warning";
    return "error";
  };

  const boardOrientation =
    currentPuzzle.fen.split(" ")[1] === "b" ? "black" : "white";

  return (
    <>
      <PageTitle title="Puzzles — VoltChess" />

      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        onClose={() => {}}
      >
        This puzzles page is still under development — puzzles, hints and scoring may change.
      </Alert>

      <PageContainer
        title="Tactical Puzzles"
        subtitle={currentPuzzle.description}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Score ${Math.round(score)}`} variant="outlined" size="small" />
            <Chip
              label={`${currentPuzzleIndex + 1} / ${puzzles.length}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${currentPuzzle.rating}`}
              color={getDifficultyColor(currentPuzzle.rating)}
              variant="outlined"
              size="small"
            />
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Themes
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {currentPuzzle.themes.map((theme) => (
                    <Chip key={theme} label={theme} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.min(solutionIndex, currentPuzzle.solution.length)} /{" "}
                    {currentPuzzle.solution.length}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (Math.min(solutionIndex, currentPuzzle.solution.length) /
                      currentPuzzle.solution.length) *
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
                  onClick={() => {
                    setShowHint(true);
                    const hintMove = currentPuzzle.solution[solutionIndex];
                    const hintGame = new Chess(game.fen());
                    try {
                      const m = hintGame.move(uciMoveParams(hintMove));
                      setFeedback({
                        show: true,
                        message: m ? `Hint: try ${m.san}` : "Look for a forcing move.",
                        type: "info",
                      });
                    } catch {
                      setFeedback({
                        show: true,
                        message: "Look for a forcing tactical move.",
                        type: "info",
                      });
                    }
                  }}
                  disabled={showHint || isCompleted}
                >
                  Hint
                </Button>
                <Button variant="outlined" size="small" onClick={initializePuzzle}>
                  Reset
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={nextPuzzle}
                  disabled={!isCompleted}
                >
                  Next puzzle
                </Button>
              </Box>

              {isCompleted && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Well done. +{Math.round(currentPuzzle.rating / 100)} points.
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

export default Puzzles;
