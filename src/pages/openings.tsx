import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess, type Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  CustomSquareStyles,
  Square as BoardSquare,
} from "react-chessboard/dist/chessboard/types";
import { PageTitle } from "@/components/pageTitle";
import ToolsShell, {
  ToolPrimaryButton,
  ToolStat,
} from "@/sections/tools/ToolsShell";
import { usePalette } from "@/hooks/usePalette";
import {
  OPENING_COURSES,
  type OpeningCourse,
  type OpeningLine,
} from "@/data/openingCourses";

const PROGRESS_KEY = "voltchess-opening-progress";
const AUTO_REPLY_DELAY_MS = 450;
const WRONG_FLASH_MS = 600;

const SEO_TITLE = "Chess Opening Trainer — Learn Lines by Playing | VoltChess";
const SEO_DESCRIPTION =
  "Drill your opening repertoire line by line — play your moves on the board, get instant feedback, and let the trainer answer for the other side. Free and unlimited.";

const RELATED_LINKS = [
  { href: "/analysis", label: "Full game analysis" },
  { href: "/puzzles", label: "Tactical puzzles" },
  { href: "/tools/next-move", label: "Next move calculator" },
  { href: "/training", label: "Training coach" },
];

function readProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: Record<string, boolean>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* localStorage unavailable — ignore */
  }
}

function difficultyColor(
  difficulty: OpeningCourse["difficulty"]
): "success" | "warning" | "error" {
  if (difficulty === "beginner") return "success";
  if (difficulty === "intermediate") return "warning";
  return "error";
}

/** Strip check/mate suffixes so annotated SANs still compare equal. */
const stripSanDecorations = (san: string): string => san.replace(/[+#]$/, "");

interface ResolvedMove {
  uci: string;
  from: BoardSquare;
  to: BoardSquare;
  san: string;
}

/**
 * Resolve a SAN string from course data into a concrete move on the given
 * position. Returns null when the data is malformed for this position.
 */
function resolveSan(fen: string, san: string): ResolvedMove | null {
  const copy = new Chess(fen);
  try {
    const move = copy.move(san);
    return {
      uci: move.from + move.to + (move.promotion ?? ""),
      from: move.from,
      to: move.to,
      san: move.san,
    };
  } catch {
    return null;
  }
}

interface Feedback {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export default function OpeningTrainer() {
  const palette = usePalette();

  const [searchTerm, setSearchTerm] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "white" | "black">(
    "all"
  );
  const [progress, setProgress] = useState<Record<string, boolean>>(() =>
    readProgress()
  );

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  const [chess, setChess] = useState(() => new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [lastMove, setLastMove] = useState<{
    from: BoardSquare;
    to: BoardSquare;
  } | null>(null);
  const [wrongSquare, setWrongSquare] = useState<BoardSquare | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState<Feedback>({
    show: false,
    message: "",
    type: "info",
  });

  const wrongFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (wrongFlashRef.current) clearTimeout(wrongFlashRef.current);
    },
    []
  );

  const activeCourse = useMemo(
    () => OPENING_COURSES.find((c) => c.id === activeCourseId) ?? null,
    [activeCourseId]
  );
  const activeLine = useMemo(
    () => activeCourse?.lines.find((l) => l.id === activeLineId) ?? null,
    [activeCourse, activeLineId]
  );

  const totalLineMoves = activeLine?.moves.length ?? 0;
  const isLineComplete = !!activeLine && moveIndex >= totalLineMoves;
  const isUserTurn =
    !!activeLine && !isLineComplete && chess.turn() === activeLine.playAs;

  /** The move the drill expects next, resolved against the live position. */
  const expectedMove = useMemo(() => {
    if (!activeLine || isLineComplete) return null;
    const san = activeLine.moves[moveIndex];
    return san ? resolveSan(chess.fen(), san) : null;
  }, [activeLine, isLineComplete, chess, moveIndex]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return OPENING_COURSES.filter((course) => {
      const matchesSide = sideFilter === "all" || course.side === sideFilter;
      const matchesSearch =
        !term ||
        course.name.toLowerCase().includes(term) ||
        course.eco.toLowerCase().includes(term) ||
        course.themes.some((t) => t.toLowerCase().includes(term));
      return matchesSide && matchesSearch;
    });
  }, [searchTerm, sideFilter]);

  const totalLines = useMemo(
    () => OPENING_COURSES.reduce((sum, c) => sum + c.lines.length, 0),
    []
  );
  const totalLearned = useMemo(
    () =>
      OPENING_COURSES.reduce(
        (sum, c) => sum + c.lines.filter((l) => progress[l.id]).length,
        0
      ),
    [progress]
  );

  const clearWrongFlash = useCallback(() => {
    if (wrongFlashRef.current) {
      clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = null;
    }
    setWrongSquare(null);
  }, []);

  const startLine = useCallback(
    (course: OpeningCourse, line: OpeningLine) => {
      clearWrongFlash();
      setActiveCourseId(course.id);
      setActiveLineId(line.id);
      setChess(new Chess());
      setMoveIndex(0);
      setLastMove(null);
      setHintLevel(0);
    },
    [clearWrongFlash]
  );

  const handleOpenCourse = (course: OpeningCourse) => {
    const firstUnlearned = course.lines.find((l) => !progress[l.id]);
    startLine(course, firstUnlearned ?? course.lines[0]);
  };

  const handleBackToCourses = useCallback(() => {
    clearWrongFlash();
    setActiveCourseId(null);
    setActiveLineId(null);
    setLastMove(null);
    setHintLevel(0);
  }, [clearWrongFlash]);

  const markLineComplete = useCallback((lineId: string) => {
    setProgress((prev) => {
      if (prev[lineId]) return prev;
      const next = { ...prev, [lineId]: true };
      writeProgress(next);
      return next;
    });
  }, []);

  /** Advance to the next unlearned line, or leave the course when done. */
  const goToNextLine = useCallback(() => {
    if (!activeCourse) return;
    const nextUnlearned = activeCourse.lines.find(
      (l) => l.id !== activeLineId && !progress[l.id]
    );
    if (nextUnlearned) {
      startLine(activeCourse, nextUnlearned);
    } else {
      handleBackToCourses();
    }
  }, [activeCourse, activeLineId, progress, startLine, handleBackToCourses]);

  // Auto-play the opponent's reply whenever it's not the trainee's turn —
  // including the very first move when the trainee plays Black.
  useEffect(() => {
    if (!activeLine || isLineComplete) return;
    if (chess.turn() === activeLine.playAs) return;

    const replySan = activeLine.moves[moveIndex];
    const timer = setTimeout(() => {
      const copy = new Chess(chess.fen());
      let reply: Move | null = null;
      try {
        reply = copy.move(replySan);
      } catch {
        reply = null;
      }
      if (!reply) {
        setFeedback({
          show: true,
          message: "This line has a data problem — skipping.",
          type: "error",
        });
        goToNextLine();
        return;
      }
      setChess(copy);
      setLastMove({ from: reply.from, to: reply.to });
      setMoveIndex((index) => index + 1);
      if (moveIndex + 1 >= activeLine.moves.length) {
        setFeedback({ show: true, message: "Line learned!", type: "success" });
      }
    }, AUTO_REPLY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [activeLine, chess, moveIndex, isLineComplete, goToNextLine]);

  useEffect(() => {
    if (activeLine && isLineComplete) markLineComplete(activeLine.id);
  }, [activeLine, isLineComplete, markLineComplete]);

  const onDrop = (
    source: BoardSquare,
    target: BoardSquare,
    piece: string
  ): boolean => {
    if (!activeLine || !isUserTurn) return false;

    const expectedSan = activeLine.moves[moveIndex];
    if (!expectedSan) return false;

    const copy = new Chess(chess.fen());
    let move;
    try {
      move = copy.move({
        from: source,
        to: target,
        promotion: piece[1]?.toLowerCase() ?? "q",
      });
    } catch {
      return false;
    }
    if (!move) return false;

    // Compare UCI against the resolved expected move — robust to SAN
    // ambiguity and +/# annotations. Fall back to normalized SAN when the
    // expected SAN can't be resolved on this position.
    const playedUci = move.from + move.to + (move.promotion ?? "");
    const isCorrect = expectedMove
      ? playedUci === expectedMove.uci
      : stripSanDecorations(move.san) === stripSanDecorations(expectedSan);

    if (!isCorrect) {
      clearWrongFlash();
      setWrongSquare(target);
      wrongFlashRef.current = setTimeout(
        () => setWrongSquare(null),
        WRONG_FLASH_MS
      );
      setFeedback({
        show: true,
        message: "Not this one — the line continues differently. Try again.",
        type: "error",
      });
      return false;
    }

    clearWrongFlash();
    setChess(copy);
    setLastMove({ from: move.from, to: move.to });
    setMoveIndex((index) => index + 1);
    setHintLevel(0);
    setFeedback({
      show: true,
      message:
        moveIndex + 1 >= activeLine.moves.length
          ? "Line learned!"
          : "Correct — keep going.",
      type: "success",
    });
    return true;
  };

  const handleHint = () => {
    if (!expectedMove) return;
    if (hintLevel === 0) {
      setHintLevel(1);
      return;
    }
    setHintLevel(2);
    setFeedback({
      show: true,
      message: `Hint: play ${expectedMove.san}.`,
      type: "info",
    });
  };

  const handleReplayLine = () => {
    if (activeCourse && activeLine) startLine(activeCourse, activeLine);
  };

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
    if (hintLevel > 0 && expectedMove) {
      styles[expectedMove.from] = {
        ...styles[expectedMove.from],
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
  }, [lastMove, hintLevel, expectedMove, wrongSquare, palette.accent]);

  const feedbackSnackbar = (
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
  );

  if (activeCourse && activeLine) {
    const completedInCourse = activeCourse.lines.filter(
      (l) => progress[l.id]
    ).length;
    const lineNumber =
      activeCourse.lines.findIndex((l) => l.id === activeLine.id) + 1;
    const sideLabel = activeLine.playAs === "w" ? "White" : "Black";
    const boardOrientation = activeLine.playAs === "b" ? "black" : "white";
    const clampedMoveIndex = Math.min(moveIndex, totalLineMoves);
    const lineProgressValue =
      (clampedMoveIndex / Math.max(totalLineMoves, 1)) * 100;

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
            icon={<Icon icon="mdi:book-open-page-variant-outline" width={14} />}
            label={activeCourse.name}
            sx={{
              color: palette.accent,
              borderColor: alpha(palette.accent, 0.4),
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              label={`Line ${lineNumber} of ${activeCourse.lines.length}`}
            />
            <Chip
              size="small"
              variant="outlined"
              icon={
                <Icon
                  icon={
                    activeLine.playAs === "w"
                      ? "mdi:circle-outline"
                      : "mdi:circle"
                  }
                  width={14}
                />
              }
              label={`You play ${sideLabel}`}
            />
          </Box>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
          <Chessboard
            position={chess.fen()}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
            customSquareStyles={squareStyles}
            arePiecesDraggable={isUserTurn}
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
          {activeLine.name}
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
            Drill
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            icon={
              <Icon
                icon={
                  isLineComplete
                    ? "mdi:check-circle-outline"
                    : isUserTurn
                      ? "mdi:hand-pointing-up"
                      : "mdi:timer-sand"
                }
                width={14}
              />
            }
            label={
              isLineComplete
                ? "Line learned"
                : isUserTurn
                  ? "Your move"
                  : "Replying…"
            }
            sx={{
              color: isLineComplete ? palette.accent : palette.textMuted,
              borderColor: alpha(
                isLineComplete ? palette.accent : palette.textMuted,
                0.35
              ),
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <ToolStat
            label="Lines learned"
            value={`${completedInCourse} / ${activeCourse.lines.length}`}
            emphasize
          />
          <ToolStat
            label="Moves"
            value={`${clampedMoveIndex} / ${totalLineMoves}`}
          />
        </Box>

        <Box>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
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
              This line
            </Typography>
            <Typography variant="caption" sx={{ color: palette.textMuted }}>
              {clampedMoveIndex} / {totalLineMoves} moves
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={lineProgressValue}
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

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: palette.bg,
            border: `1px solid ${palette.borderSubtle}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: palette.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.65rem",
              display: "block",
              mb: 0.5,
            }}
          >
            Idea
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", lineHeight: 1.55 }}
          >
            {activeLine.idea}
          </Typography>
        </Box>

        {isLineComplete ? (
          <>
            <Alert
              severity="success"
              icon={<Icon icon="mdi:check-decagram-outline" width={20} />}
            >
              Line learned — {completedInCourse} of {activeCourse.lines.length}{" "}
              in this course.
            </Alert>
            <ToolPrimaryButton
              onClick={goToNextLine}
              startIcon={<Icon icon="mdi:arrow-right" width={18} />}
            >
              Next line
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
                onClick={handleHint}
                disabled={!expectedMove || !isUserTurn || hintLevel >= 2}
              >
                {hintLevel === 0 ? "Hint" : "Show move"}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Icon icon="mdi:restart" width={16} />}
                onClick={handleReplayLine}
              >
                Replay line
              </Button>
            </Box>
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={goToNextLine}
              sx={{ color: palette.textMuted }}
            >
              Skip line
            </Button>
          </>
        )}

        <Button
          fullWidth
          variant="text"
          size="small"
          startIcon={<Icon icon="mdi:arrow-left" width={16} />}
          onClick={handleBackToCourses}
          sx={{ color: palette.textMuted, mt: "auto" }}
        >
          Back to courses
        </Button>
      </>
    );

    return (
      <>
        <ToolsShell
          title="Opening Trainer"
          subtitle={`Drilling ${activeCourse.name} (${activeCourse.eco}) as ${sideLabel} — the board answers for the other side.`}
          seoTitle={SEO_TITLE}
          seoDescription={SEO_DESCRIPTION}
          board={board}
          panel={panel}
          related={RELATED_LINKS}
        />
        {feedbackSnackbar}
      </>
    );
  }

  return (
    <>
      <PageTitle title={SEO_TITLE} description={SEO_DESCRIPTION} />

      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          width: "100%",
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ mb: { xs: 2.5, md: 3.5 }, maxWidth: 640 }}>
          <Typography
            variant="overline"
            sx={{
              color: palette.textMuted,
              letterSpacing: "0.14em",
              fontSize: "0.68rem",
              display: "block",
              mb: 0.75,
            }}
          >
            VoltChess
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.55rem", md: "1.85rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              mb: 0.75,
            }}
          >
            Opening Trainer
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: palette.textMuted,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            Pick a repertoire course and drill each line move by move — the
            board answers for the other side instantly.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2.5, maxWidth: 460 }}>
          <ToolStat
            label="Lines learned"
            value={`${totalLearned} / ${totalLines}`}
            emphasize
          />
          <ToolStat label="Courses" value={OPENING_COURSES.length} />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
            mb: 3,
          }}
        >
          <TextField
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, ECO, or theme"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:magnify" width={18} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: "1 1 260px",
              maxWidth: 420,
              "& .MuiOutlinedInput-root": { bgcolor: palette.bg },
            }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={sideFilter}
            onChange={(_, value) => value && setSideFilter(value)}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.75,
                textTransform: "none",
                fontWeight: 600,
                color: palette.textMuted,
                borderColor: palette.border,
                bgcolor: palette.bg,
                "&.Mui-selected": {
                  color: palette.accent,
                  bgcolor: alpha(palette.accent, 0.12),
                  "&:hover": { bgcolor: alpha(palette.accent, 0.18) },
                },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="white">White</ToggleButton>
            <ToggleButton value="black">Black</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {filteredCourses.map((course) => {
            const completed = course.lines.filter((l) => progress[l.id]).length;
            const courseProgressValue =
              (completed / Math.max(course.lines.length, 1)) * 100;
            return (
              <Box
                key={course.id}
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceRaised,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  transition: "border-color 0.15s ease",
                  "&:hover": { borderColor: alpha(palette.accent, 0.5) },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.02rem",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                      }}
                    >
                      {course.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: palette.textMuted,
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {course.eco}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={
                      <Icon
                        icon={
                          course.side === "white"
                            ? "mdi:circle-outline"
                            : "mdi:circle"
                        }
                        width={12}
                      />
                    }
                    label={course.side === "white" ? "White" : "Black"}
                    sx={{ flexShrink: 0 }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: palette.textMuted,
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {course.description}
                </Typography>

                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {course.themes.map((theme) => (
                    <Chip
                      key={theme}
                      label={theme}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  <Chip
                    label={course.difficulty}
                    size="small"
                    variant="outlined"
                    color={difficultyColor(course.difficulty)}
                    sx={{ textTransform: "capitalize" }}
                  />
                </Box>

                <Box sx={{ mt: "auto" }}>
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
                    <Typography
                      variant="caption"
                      sx={{ color: palette.textMuted }}
                    >
                      {completed} / {course.lines.length} lines learned
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={courseProgressValue}
                    sx={{
                      height: 5,
                      borderRadius: 3,
                      bgcolor: alpha(palette.bg, 0.7),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: palette.accent,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Icon icon="mdi:play" width={16} />}
                  onClick={() => handleOpenCourse(course)}
                  sx={{
                    bgcolor: palette.accent,
                    color: palette.onAccent,
                    "&:hover": { bgcolor: palette.accentHover },
                  }}
                >
                  {completed > 0 ? "Continue" : "Start learning"}
                </Button>
              </Box>
            );
          })}
        </Box>

        {filteredCourses.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: palette.textMuted }}>
            <Icon icon="mdi:book-search-outline" width={44} />
            <Typography
              variant="body1"
              sx={{ mt: 1.5, fontWeight: 600, color: palette.text }}
            >
              No courses match your search
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Try a different name, ECO code, or theme.
            </Typography>
          </Box>
        )}
      </Box>

      {feedbackSnackbar}
    </>
  );
}
