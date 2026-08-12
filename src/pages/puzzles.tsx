import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  CustomSquareStyles,
  Square,
} from "react-chessboard/dist/chessboard/types";
import ToolsShell, {
  ToolPrimaryButton,
  ToolStat,
} from "@/sections/tools/ToolsShell";
import { usePalette } from "@/hooks/usePalette";
import { uciMoveParams } from "@/lib/chess";
import { updatePuzzleElo } from "@/lib/elo";
import { fetchLichessDailyPuzzle, type DailyPuzzle } from "@/lib/lichess";
import { PUZZLE_BANK, type PuzzleData } from "@/data/puzzles/bank";

const ELO_STORAGE_KEY = "voltchess-puzzle-elo";
const STREAK_STORAGE_KEY = "voltchess-puzzle-streak";
const SOLVED_STORAGE_KEY = "voltchess-puzzle-solved-count";
const DEFAULT_ELO = 1200;
const REPLY_DELAY_MS = 450;

function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* localStorage unavailable — ignore */
  }
}

function pickPuzzleNearElo(elo: number, excludeIds: Set<string>): PuzzleData {
  const pool = PUZZLE_BANK.filter((p) => !excludeIds.has(p.id));
  const candidates = pool.length > 0 ? pool : PUZZLE_BANK;
  const sorted = [...candidates].sort(
    (a, b) => Math.abs(a.rating - elo) - Math.abs(b.rating - elo)
  );
  const topPicks = sorted.slice(0, Math.min(5, sorted.length));
  return topPicks[Math.floor(Math.random() * topPicks.length)];
}

type ActivePuzzle = PuzzleData | DailyPuzzle;

export default function Puzzles() {
  const palette = usePalette();

  const [userElo, setUserElo] = useState<number>(() =>
    readStoredNumber(ELO_STORAGE_KEY, DEFAULT_ELO)
  );
  const [streak, setStreak] = useState<number>(() =>
    readStoredNumber(STREAK_STORAGE_KEY, 0)
  );
  const [solvedCount, setSolvedCount] = useState<number>(() =>
    readStoredNumber(SOLVED_STORAGE_KEY, 0)
  );
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData>(() =>
    pickPuzzleNearElo(readStoredNumber(ELO_STORAGE_KEY, DEFAULT_ELO), new Set())
  );
  const [isDailyActive, setIsDailyActive] = useState(false);

  const [game, setGame] = useState(() => new Chess());
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMistake, setHasMistake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [eloDelta, setEloDelta] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [wrongSquare, setWrongSquare] = useState<Square | null>(null);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePuzzle: ActivePuzzle =
    isDailyActive && dailyPuzzle ? dailyPuzzle : currentPuzzle;

  useEffect(() => {
    writeStoredNumber(ELO_STORAGE_KEY, userElo);
  }, [userElo]);
  useEffect(() => {
    writeStoredNumber(STREAK_STORAGE_KEY, streak);
  }, [streak]);
  useEffect(() => {
    writeStoredNumber(SOLVED_STORAGE_KEY, solvedCount);
  }, [solvedCount]);

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

  const clearTimers = useCallback(() => {
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = null;
    }
    if (wrongFlashRef.current) {
      clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const initializePuzzle = useCallback(
    (puzzle: ActivePuzzle) => {
      clearTimers();
      const newGame = new Chess();
      newGame.load(puzzle.fen);
      setGame(newGame);
      setSolutionIndex(0);
      setAwaitingReply(false);
      setIsCompleted(false);
      setHasMistake(false);
      setShowHint(false);
      setEloDelta(null);
      setLastMove(null);
      setWrongSquare(null);
    },
    [clearTimers]
  );

  useEffect(() => {
    initializePuzzle(
      isDailyActive && dailyPuzzle ? dailyPuzzle : currentPuzzle
    );
  }, [currentPuzzle, dailyPuzzle, isDailyActive, initializePuzzle]);

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
      if (solvedCleanly) {
        setStreak((s) => s + 1);
        setSolvedCount((c) => c + 1);
      } else {
        setStreak(0);
      }
      if (!isDailyActive) {
        setSolvedIds((prev) => new Set(prev).add(activePuzzle.id));
      }
    },
    [activePuzzle, isDailyActive, userElo]
  );

  /** Play exactly one opponent reply from the solution, after a beat. */
  const scheduleOpponentReply = useCallback(
    (fromFen: string, replyIndex: number) => {
      const uci = activePuzzle.solution[replyIndex];
      if (!uci) return;

      setAwaitingReply(true);
      replyTimeoutRef.current = setTimeout(() => {
        replyTimeoutRef.current = null;
        const copy = new Chess(fromFen);
        try {
          const reply = copy.move(uciMoveParams(uci));
          setLastMove({ from: reply.from, to: reply.to });
        } catch {
          /* malformed solution data — end the puzzle gracefully */
          setAwaitingReply(false);
          return;
        }
        setGame(copy);
        setAwaitingReply(false);
        setSolutionIndex(replyIndex + 1);
      }, REPLY_DELAY_MS);
    },
    [activePuzzle.solution]
  );

  const onDrop = (
    sourceSquare: Square,
    targetSquare: Square,
    piece: string
  ): boolean => {
    if (isCompleted || awaitingReply) return false;

    const expectedUci = activePuzzle.solution[solutionIndex];
    if (!expectedUci) return false;

    const copy = new Chess(game.fen());
    let move;
    try {
      move = copy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1]?.toLowerCase() ?? "q",
      });
    } catch {
      return false;
    }
    if (!move) return false;

    const playedUci = move.from + move.to + (move.promotion ?? "");
    const isLastSolutionMove =
      solutionIndex === activePuzzle.solution.length - 1;
    // Lichess convention: any immediate checkmate on the final move counts.
    const altCheckmate =
      playedUci !== expectedUci && isLastSolutionMove && copy.isCheckmate();

    if (playedUci !== expectedUci && !altCheckmate) {
      setHasMistake(true);
      setWrongSquare(targetSquare);
      if (wrongFlashRef.current) clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = setTimeout(() => setWrongSquare(null), 600);
      setFeedback({
        show: true,
        message: "That's not it — look for a stronger idea.",
        type: "error",
      });
      return false;
    }

    setGame(copy);
    setLastMove({ from: move.from, to: move.to });
    setShowHint(false);

    const nextIndex = solutionIndex + 1;
    setSolutionIndex(nextIndex);

    if (nextIndex >= activePuzzle.solution.length || altCheckmate) {
      finishPuzzle(!hasMistake);
      setFeedback({
        show: true,
        message: hasMistake
          ? "Solved — keep it clean next time for full credit."
          : "Correct! Puzzle solved.",
        type: "success",
      });
    } else {
      scheduleOpponentReply(copy.fen(), nextIndex);
      setFeedback({
        show: true,
        message: "Good move — keep going.",
        type: "success",
      });
    }

    return true;
  };

  const handleShowSolution = () => {
    if (isCompleted) return;
    clearTimers();
    setHasMistake(true);

    const copy = new Chess(game.fen());
    let lastPlayed: { from: Square; to: Square } | null = null;
    for (let i = solutionIndex; i < activePuzzle.solution.length; i++) {
      try {
        const m = copy.move(uciMoveParams(activePuzzle.solution[i]));
        lastPlayed = { from: m.from, to: m.to };
      } catch {
        break;
      }
    }
    setGame(copy);
    if (lastPlayed) setLastMove(lastPlayed);
    setSolutionIndex(activePuzzle.solution.length);
    setAwaitingReply(false);
    finishPuzzle(false);
    setFeedback({
      show: true,
      message: "Study the line, then try the next one.",
      type: "info",
    });
  };

  const handleNextPuzzle = () => {
    clearTimers();
    setIsDailyActive(false);
    setCurrentPuzzle(pickPuzzleNearElo(userElo, solvedIds));
  };

  const handlePlayDaily = () => {
    if (!dailyPuzzle) return;
    clearTimers();
    setIsDailyActive(true);
    // Re-initialize even if daily was already active earlier
    initializePuzzle(dailyPuzzle);
  };

  const playerColor: "white" | "black" =
    activePuzzle.fen.split(" ")[1] === "b" ? "black" : "white";

  const hintSquare = useMemo<Square | null>(() => {
    if (!showHint || isCompleted) return null;
    const uci = activePuzzle.solution[solutionIndex];
    return uci ? (uci.slice(0, 2) as Square) : null;
  }, [showHint, isCompleted, activePuzzle.solution, solutionIndex]);

  const squareStyles: CustomSquareStyles = useMemo(() => {
    const styles: CustomSquareStyles = {};
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: alpha(palette.accent, 0.18),
      };
      styles[lastMove.to] = {
        backgroundColor: alpha(palette.accent, 0.28),
      };
    }
    if (hintSquare) {
      styles[hintSquare] = {
        ...styles[hintSquare],
        boxShadow: `inset 0 0 0 3px ${alpha(palette.accent, 0.85)}`,
      };
    }
    if (wrongSquare) {
      styles[wrongSquare] = {
        ...styles[wrongSquare],
        boxShadow: "inset 0 0 0 3px rgba(220, 60, 60, 0.85)",
      };
    }
    return styles;
  }, [lastMove, hintSquare, wrongSquare, palette.accent]);

  const totalMoves = activePuzzle.solution.length;
  const progressValue =
    (Math.min(solutionIndex, totalMoves) / Math.max(totalMoves, 1)) * 100;

  const board = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Chip
          size="small"
          variant="outlined"
          icon={
            <Icon
              icon={
                playerColor === "white" ? "mdi:circle-outline" : "mdi:circle"
              }
              width={14}
            />
          }
          label={`${playerColor === "white" ? "White" : "Black"} to move`}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          {isDailyActive && (
            <Chip
              size="small"
              variant="outlined"
              icon={<Icon icon="mdi:calendar-star" width={14} />}
              label="Puzzle of the day"
              sx={{
                color: palette.accent,
                borderColor: alpha(palette.accent, 0.4),
              }}
            />
          )}
          <Chip
            size="small"
            variant="outlined"
            label={`Puzzle ${activePuzzle.rating}`}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation={playerColor}
          customSquareStyles={squareStyles}
          arePiecesDraggable={!isCompleted}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{ color: palette.textMuted, textAlign: "center" }}
      >
        {activePuzzle.description}
      </Typography>
    </Box>
  );

  const panel = (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: palette.textMuted,
            letterSpacing: "0.1em",
            fontSize: "0.66rem",
          }}
        >
          Tactics
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          icon={<Icon icon="mdi:fire" width={14} />}
          label={`Streak ${streak}`}
          sx={{
            color: streak > 0 ? palette.accent : palette.textMuted,
            borderColor: alpha(
              streak > 0 ? palette.accent : palette.textMuted,
              0.35
            ),
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <ToolStat label="Your rating" value={Math.round(userElo)} emphasize />
        <ToolStat label="Solved" value={solvedCount} />
      </Box>

      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: palette.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.65rem",
            }}
          >
            Progress
          </Typography>
          <Typography variant="caption" sx={{ color: palette.textMuted }}>
            {Math.min(solutionIndex, totalMoves)} / {totalMoves} moves
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(palette.bg, 0.7),
            "& .MuiLinearProgress-bar": {
              bgcolor: palette.accent,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {activePuzzle.themes.slice(0, 5).map((theme) => (
          <Chip key={theme} label={theme} size="small" variant="outlined" />
        ))}
      </Box>

      {isCompleted ? (
        <>
          <Alert
            severity={hasMistake ? "info" : "success"}
            icon={
              <Icon
                icon={hasMistake ? "mdi:school-outline" : "mdi:trophy-outline"}
                width={20}
              />
            }
          >
            {hasMistake ? "Solved with help." : "Solved cleanly!"}{" "}
            {eloDelta !== null && (
              <strong>
                Rating {eloDelta >= 0 ? "+" : ""}
                {eloDelta}
              </strong>
            )}
          </Alert>
          <ToolPrimaryButton
            onClick={handleNextPuzzle}
            startIcon={<Icon icon="mdi:arrow-right" width={18} />}
          >
            Next puzzle
          </ToolPrimaryButton>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<Icon icon="mdi:lightbulb-outline" width={16} />}
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              Hint
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<Icon icon="mdi:eye-outline" width={16} />}
              onClick={handleShowSolution}
            >
              Solution
            </Button>
          </Box>
          <Button
            fullWidth
            variant="text"
            size="small"
            onClick={handleNextPuzzle}
            sx={{ color: palette.textMuted }}
          >
            Skip this puzzle
          </Button>
        </>
      )}

      {!isDailyActive && !dailyLoading && dailyPuzzle && (
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<Icon icon="mdi:calendar-star" width={16} />}
          onClick={handlePlayDaily}
          sx={{
            borderColor: alpha(palette.accent, 0.35),
            color: palette.text,
          }}
        >
          Play today&apos;s Lichess puzzle
        </Button>
      )}
    </>
  );

  return (
    <>
      <ToolsShell
        title="Tactical Puzzles"
        subtitle="Rated tactics matched to your level — solve, build a streak, and watch your puzzle rating climb. Free and unlimited."
        seoTitle="Free Chess Puzzles — Elo-Rated Tactics | VoltChess"
        seoDescription="Unlimited Elo-rated chess tactics puzzles, free forever. Solve, track your rating, and drill your weaknesses — no daily cap, no paywall."
        board={board}
        panel={panel}
        related={[
          { href: "/analysis", label: "Full game analysis" },
          { href: "/openings", label: "Opening trainer" },
          { href: "/tools/next-move", label: "Next move calculator" },
          { href: "/training", label: "Training coach" },
        ]}
      />

      <Snackbar
        open={feedback.show}
        autoHideDuration={2500}
        onClose={() => setFeedback((f) => ({ ...f, show: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback((f) => ({ ...f, show: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
