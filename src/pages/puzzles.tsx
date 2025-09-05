import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid2 as Grid,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { PageTitle } from "@/components/pageTitle";

interface PuzzleData {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  solution: string[];
}

// Sample puzzle data - in a real app this would come from an API
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
        promotion: "q", // Always promote to queen for simplicity
      });

      if (move) {
        const expectedMove = currentPuzzle.solution[solutionIndex];
        
        if (move.san === expectedMove || move.lan === expectedMove) {
          // Correct move
          setGame(gameCopy);
          setGamePosition(gameCopy.fen());
          setSolutionIndex(solutionIndex + 1);
          
          if (solutionIndex + 1 >= currentPuzzle.solution.length) {
            // Puzzle completed!
            setIsCompleted(true);
            const bonus = Math.max(10 - attempts, 1);
            setScore(score + currentPuzzle.rating / 100 + bonus);
            setFeedback({
              show: true,
              message: `Excellent! Puzzle solved in ${attempts + 1} attempts. +${currentPuzzle.rating / 100 + bonus} points!`,
              type: "success",
            });
          } else {
            setFeedback({
              show: true,
              message: "Correct move! Continue...",
              type: "success",
            });
          }
        } else {
          // Wrong move
          setAttempts(attempts + 1);
          setFeedback({
            show: true,
            message: `Not quite right. Try again! Expected: ${expectedMove}`,
            type: "error",
          });
          return false;
        }
        
        return true;
      }
    } catch (error) {
      setAttempts(attempts + 1);
      setFeedback({
        show: true,
        message: "Invalid move. Try again!",
        type: "error",
      });
      return false;
    }

    return false;
  };

  const nextPuzzle = () => {
    if (currentPuzzleIndex < samplePuzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    } else {
      setCurrentPuzzleIndex(0); // Loop back to first puzzle
    }
  };

  const resetPuzzle = () => {
    initializePuzzle();
  };

  const showHintHandler = () => {
    setShowHint(true);
    setFeedback({
      show: true,
      message: `Hint: Look for ${currentPuzzle.themes.join(", ")} tactics. Next move: ${currentPuzzle.solution[solutionIndex]}`,
      type: "info",
    });
  };

  const getDifficultyColor = (rating: number) => {
    if (rating < 1200) return "success";
    if (rating < 1600) return "warning";
    return "error";
  };

  return (
    <>
      <PageTitle 
        title="Chess Puzzles & Tactics Trainer - VoltChess" 
        description="Improve your chess skills with interactive puzzles and tactics training. Solve chess puzzles to enhance your tactical vision and pattern recognition."
      />
      
      <Box
        sx={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          minHeight: "100vh",
          padding: { xs: 2, md: 4 },
        }}
      >
        <Grid container spacing={4} justifyContent="center">
          {/* Header */}
          <Grid size={12}>
            <Typography
              variant="h3"
              component="h1"
              align="center"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(90deg, #3b9ac6, #7fddff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              Chess Puzzles ⚡
            </Typography>
            
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
              <Chip
                label={`Score: ${Math.round(score)}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Puzzle ${currentPuzzleIndex + 1}/${samplePuzzles.length}`}
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={`Rating: ${currentPuzzle.rating}`}
                color={getDifficultyColor(currentPuzzle.rating)}
                variant="outlined"
              />
            </Box>
          </Grid>

          {/* Game Board */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={6}
              sx={{
                background: "rgba(40, 44, 52, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid #3a3f4b",
                borderRadius: 4,
                p: 3,
              }}
            >
              <Box sx={{ maxWidth: 500, mx: "auto" }}>
                <Chessboard
                  position={gamePosition}
                  onPieceDrop={onDrop}
                  customBoardStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                  }}
                  boardOrientation="white"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Puzzle Info & Controls */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={6}
              sx={{
                background: "rgba(40, 44, 52, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid #3a3f4b",
                borderRadius: 4,
                p: 3,
                height: "fit-content",
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Puzzle Information
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Themes:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {currentPuzzle.themes.map((theme) => (
                    <Chip
                      key={theme}
                      label={theme}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Progress:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(solutionIndex / currentPuzzle.solution.length) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {solutionIndex} / {currentPuzzle.solution.length} moves
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                {isCompleted ? "🎉 Puzzle Completed!" : "Find the best move..."}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={showHintHandler}
                  disabled={showHint || isCompleted}
                  sx={{ textTransform: "none" }}
                >
                  💡 Show Hint
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={resetPuzzle}
                  sx={{ textTransform: "none" }}
                >
                  🔄 Reset
                </Button>
                
                <Button
                  variant="contained"
                  onClick={nextPuzzle}
                  disabled={!isCompleted}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#3b9ac6",
                    "&:hover": { backgroundColor: "#3385ad" },
                  }}
                >
                  ➡️ Next Puzzle
                </Button>
              </Box>

              {isCompleted && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>Congratulations!</strong> You solved this puzzle correctly.
                  Rating gained: +{Math.round(currentPuzzle.rating / 100)} points
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

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
      </Box>
    </>
  );
}

export default Puzzles;