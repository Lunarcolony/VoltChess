import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid2 as Grid,
  Chip,
  Button,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import {
  OPENING_COURSES,
  type OpeningCourse,
  type OpeningLine,
} from "@/data/openingCourses";

const PROGRESS_KEY = "voltchess-opening-progress";

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

const AUTO_REPLY_DELAY_MS = 450;

export default function OpeningTrainer() {
  const palette = usePalette();
  const cardSx = useCardSx();

  const [searchTerm, setSearchTerm] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "white" | "black">(
    "all"
  );
  const [progress, setProgress] = useState<Record<string, boolean>>(() =>
    readProgress()
  );

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  const [chess, setChess] = useState(new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [flashError, setFlashError] = useState(false);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const activeCourse = useMemo(
    () => OPENING_COURSES.find((c) => c.id === activeCourseId) ?? null,
    [activeCourseId]
  );
  const activeLine = useMemo(
    () => activeCourse?.lines.find((l) => l.id === activeLineId) ?? null,
    [activeCourse, activeLineId]
  );

  const isLineComplete = !!activeLine && moveIndex >= activeLine.moves.length;

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

  const startLine = useCallback((course: OpeningCourse, line: OpeningLine) => {
    setActiveCourseId(course.id);
    setActiveLineId(line.id);
    setChess(new Chess());
    setMoveIndex(0);
  }, []);

  const handleOpenCourse = (course: OpeningCourse) => {
    const firstIncomplete = course.lines.find((l) => !progress[l.id]);
    startLine(course, firstIncomplete ?? course.lines[0]);
  };

  const handleBackToCourses = () => {
    setActiveCourseId(null);
    setActiveLineId(null);
  };

  const markLineComplete = useCallback((lineId: string) => {
    setProgress((prev) => {
      if (prev[lineId]) return prev;
      const next = { ...prev, [lineId]: true };
      writeProgress(next);
      return next;
    });
  }, []);

  // Auto-play the opponent's replies whenever it's not the trainee's turn.
  useEffect(() => {
    if (!activeLine || isLineComplete) return;
    const isUserTurn = chess.turn() === activeLine.playAs;
    if (isUserTurn) return;

    const timer = setTimeout(() => {
      const copy = new Chess(chess.fen());
      try {
        copy.move(activeLine.moves[moveIndex]);
      } catch {
        return;
      }
      setChess(copy);
      setMoveIndex((i) => i + 1);
    }, AUTO_REPLY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [activeLine, chess, moveIndex, isLineComplete]);

  useEffect(() => {
    if (activeLine && isLineComplete) {
      markLineComplete(activeLine.id);
    }
  }, [activeLine, isLineComplete, markLineComplete]);

  const onDrop = (source: string, target: string, piece: string): boolean => {
    if (!activeLine || isLineComplete) return false;
    if (chess.turn() !== activeLine.playAs) return false;

    const expectedSan = activeLine.moves[moveIndex];
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

    if (move.san !== expectedSan) {
      setFlashError(true);
      setTimeout(() => setFlashError(false), 500);
      setFeedback({
        show: true,
        message: "Not quite — the line continues differently. Try again.",
        type: "error",
      });
      return false;
    }

    setChess(copy);
    setMoveIndex((i) => i + 1);
    setFeedback({
      show: true,
      message: "Correct!",
      type: "success",
    });
    return true;
  };

  const handleNextLine = () => {
    if (!activeCourse) return;
    const nextIncomplete = activeCourse.lines.find(
      (l) => l.id !== activeLine?.id && !progress[l.id]
    );
    if (nextIncomplete) {
      startLine(activeCourse, nextIncomplete);
    } else {
      handleBackToCourses();
    }
  };

  const handleRestartLine = () => {
    if (!activeCourse || !activeLine) return;
    startLine(activeCourse, activeLine);
  };

  if (activeCourse && activeLine) {
    const completedInCourse = activeCourse.lines.filter(
      (l) => progress[l.id]
    ).length;
    const humanColorLabel = activeLine.playAs === "w" ? "White" : "Black";
    const boardOrientation = activeLine.playAs === "w" ? "white" : "black";
    const isUserTurn = !isLineComplete && chess.turn() === activeLine.playAs;

    return (
      <>
        <PageTitle
          title={`${activeCourse.name} — Opening Trainer — VoltChess`}
          description={`Drill the ${activeCourse.name} move by move. ${activeCourse.description}`}
        />

        <PageContainer
          title={activeCourse.name}
          subtitle={`${activeCourse.eco} · Playing as ${humanColorLabel} · ${completedInCourse}/${activeCourse.lines.length} lines learned`}
          action={
            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:arrow-left" width={16} />}
              onClick={handleBackToCourses}
            >
              Back to courses
            </Button>
          }
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  ...cardSx,
                  display: "flex",
                  justifyContent: "center",
                  border: flashError ? "1px solid #ef4444" : cardSx.border,
                  transition: "border-color 0.2s ease",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: 480 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        isLineComplete
                          ? "Line complete"
                          : isUserTurn
                            ? `Your move (${humanColorLabel})`
                            : "Opponent replying…"
                      }
                      color={isLineComplete ? "success" : "default"}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Move ${Math.min(
                        moveIndex,
                        activeLine.moves.length
                      )}/${activeLine.moves.length}`}
                    />
                  </Box>
                  <Chessboard
                    position={chess.fen()}
                    onPieceDrop={onDrop}
                    boardOrientation={boardOrientation}
                    arePiecesDraggable={isUserTurn}
                    customBoardStyle={{ borderRadius: "6px" }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={(moveIndex / activeLine.moves.length) * 100}
                    sx={{
                      mt: 1.5,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: palette.surface,
                      "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                    }}
                  />
                  <Box
                    sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Icon icon="mdi:restart" width={16} />}
                      onClick={handleRestartLine}
                    >
                      Restart line
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleNextLine}
                      disabled={!isLineComplete}
                    >
                      Next line
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ ...cardSx, mb: 2.5 }}>
                <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1 }}>
                  {activeLine.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(palette.accent, 0.08),
                    border: `1px solid ${alpha(palette.accent, 0.25)}`,
                  }}
                >
                  <Icon
                    icon="mdi:lightbulb-on-outline"
                    width={20}
                    color={palette.accent}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <Typography variant="body2">{activeLine.idea}</Typography>
                </Box>
              </Box>

              <Box sx={cardSx}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Lines in this course
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  {activeCourse.lines.map((line) => (
                    <Box
                      key={line.id}
                      role="button"
                      onClick={() => startLine(activeCourse, line)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor:
                          line.id === activeLine.id
                            ? alpha(palette.accent, 0.1)
                            : "transparent",
                        "&:hover": { bgcolor: palette.surfaceRaised },
                      }}
                    >
                      <Icon
                        icon={
                          progress[line.id]
                            ? "mdi:check-circle"
                            : "mdi:circle-outline"
                        }
                        width={16}
                        color={
                          progress[line.id] ? palette.accent : palette.textMuted
                        }
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: line.id === activeLine.id ? 600 : 400,
                        }}
                      >
                        {line.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </PageContainer>

        <Snackbar
          open={feedback.show}
          autoHideDuration={2000}
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

  return (
    <>
      <PageTitle
        title="Opening Trainer — VoltChess"
        description="Drill chess opening repertoire lines move by move. The board plays the opponent's replies automatically — free and unlimited."
      />

      <PageContainer
        title="Opening Trainer"
        subtitle="Pick a repertoire and drill it move by move — the board plays the other side."
      >
        <Box sx={{ ...cardSx, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search openings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="mdi:magnify" />
                      </InputAdornment>
                    ),
                  },
                }}
                placeholder="Name, ECO, or theme"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Side:
                </Typography>
                {(["all", "white", "black"] as const).map((side) => (
                  <Chip
                    key={side}
                    label={side === "all" ? "All" : side}
                    onClick={() => setSideFilter(side)}
                    color={sideFilter === side ? "primary" : "default"}
                    variant={sideFilter === side ? "filled" : "outlined"}
                    sx={{ textTransform: "capitalize" }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredCourses.length} course
          {filteredCourses.length !== 1 ? "s" : ""} found
        </Typography>

        <Grid container spacing={2}>
          {filteredCourses.map((course) => {
            const completed = course.lines.filter((l) => progress[l.id]).length;
            return (
              <Grid key={course.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Box
                  sx={{
                    ...cardSx,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="h3" sx={{ fontSize: "1.05rem" }}>
                      {course.name}
                    </Typography>
                    <Chip label={course.eco} size="small" variant="outlined" />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, lineHeight: 1.5, flex: 1 }}
                  >
                    {course.description}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Chip
                      label={course.difficulty}
                      size="small"
                      color={difficultyColor(course.difficulty)}
                      sx={{ textTransform: "capitalize" }}
                    />
                    <Chip
                      label={course.side}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}
                  >
                    {course.themes.map((theme) => (
                      <Chip
                        key={theme}
                        label={theme}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {completed}/{course.lines.length}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(completed / course.lines.length) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: palette.surface,
                        "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<Icon icon="mdi:play" width={16} />}
                    onClick={() => handleOpenCourse(course)}
                  >
                    {completed > 0 ? "Continue training" : "Start training"}
                  </Button>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {filteredCourses.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Icon
              icon="mdi:book-open-variant"
              width={48}
              color={palette.textMuted}
            />
            <Typography variant="h3" sx={{ mt: 2, mb: 0.5 }}>
              No openings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters.
            </Typography>
          </Box>
        )}
      </PageContainer>
    </>
  );
}
