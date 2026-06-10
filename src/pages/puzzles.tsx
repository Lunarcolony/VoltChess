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
import { cardSx, palette } from "@/theme/voltchessTheme";

interface PuzzleData {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  solution: string[];
}

const samplePuzzles: PuzzleData[] = [
  {
    id: "puzzle1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
    rating: 1200,
    themes: ["fork", "knight"],
    solution: ["Ng5", "d6", "Nxf7"],
  },
  {
    id: "puzzle2",
    fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 3 4",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"],
    rating: 1400,
    themes: ["pin", "bishop"],
    solution: ["Bb4"],
  },
  {
    id: "puzzle3",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6"],
    rating: 1000,
    themes: ["discovery", "check"],
    solution: ["Ng5", "O-O", "Qh5"],
  },
];

function Puzzles() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState("");
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const currentPuzzle = samplePuzzles[currentPuzzleIndex];

  const initializePuzzle = useCallback(() => {
    const newGame = new Chess();
    newGame.load(currentPuzzle.fen);
    setGame(newGame);
    setGamePosition(newGame.fen());
    setSolutionIndex(0);
    setIsCompleted(false);
    setShowHint(false);
    setAttempts(0);
  }, [currentPuzzle]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isCompleted) return false;

    const gameCopy = new Chess(game.fen());

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        const expectedMove = currentPuzzle.solution[solutionIndex];

        if (move.san === expectedMove || move.lan === expectedMove) {
          setGame(gameCopy);
          setGamePosition(gameCopy.fen());
          setSolutionIndex(solutionIndex + 1);

          if (solutionIndex + 1 >= currentPuzzle.solution.length) {
            setIsCompleted(true);
            const bonus = Math.max(10 - attempts, 1);
            setScore(score + currentPuzzle.rating / 100 + bonus);
            setFeedback({
              show: true,
              message: `Solved in ${attempts + 1} attempts.`,
              type: "success",
            });
          } else {
            setFeedback({
              show: true,
              message: "Correct — keep going.",
              type: "success",
            });
          }
        } else {
          setAttempts(attempts + 1);
          setFeedback({
            show: true,
            message: "Not quite. Try again.",
            type: "error",
          });
          return false;
        }

        return true;
      }
    } catch {
      setAttempts(attempts + 1);
      setFeedback({
        show: true,
        message: "Invalid move.",
        type: "error",
      });
      return false;
    }

    return false;
  };

  const nextPuzzle = () => {
    setCurrentPuzzleIndex((i) =>
      i < samplePuzzles.length - 1 ? i + 1 : 0
    );
  };

  const getDifficultyColor = (rating: number) => {
    if (rating < 1200) return "success";
    if (rating < 1600) return "warning";
    return "error";
  };

  return (
    <>
      <PageTitle title="Puzzles — VoltChess" />

      <PageContainer
        title="Tactical Puzzles"
        subtitle="Find the best move in each position."
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Score ${Math.round(score)}`} variant="outlined" size="small" />
            <Chip
              label={`${currentPuzzleIndex + 1} / ${samplePuzzles.length}`}
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
                  customBoardStyle={{
                    borderRadius: "6px",
                  }}
                  boardOrientation="white"
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={cardSx}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {isCompleted ? "Puzzle solved" : "Your turn"}
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
                    {solutionIndex} / {currentPuzzle.solution.length}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(solutionIndex / currentPuzzle.solution.length) * 100}
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
                    setFeedback({
                      show: true,
                      message: `Look for ${currentPuzzle.themes.join(", ")}. Next: ${currentPuzzle.solution[solutionIndex]}`,
                      type: "info",
                    });
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
                  Well done. +{Math.round(currentPuzzle.rating / 100)} rating points.
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
