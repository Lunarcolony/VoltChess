import { useState } from "react";
import Head from "@/components/Head";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CoachShell from "@/sections/coach/CoachShell";
import { CoachPageHeader } from "@/sections/coach/CoachUi";
import { usePalette } from "@/hooks/usePalette";
import { fetchCoachLinks } from "@/lib/api/academies";
import {
  createTrainingPlan,
  fetchTrainingPlans,
  updateTrainingPlan,
} from "@/lib/api/coaching";

export default function CoachPlansPage() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [goalsText, setGoalsText] = useState("");

  const { data: links = [] } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["training-plans"],
    queryFn: fetchTrainingPlans,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createTrainingPlan({
        student_id: studentId,
        title: title.trim(),
        target_weeks: Number(weeks) || 4,
        goals: goalsText
          .split("\n")
          .filter(Boolean)
          .map((text, i) => ({ week: i + 1, text: text.trim(), done: false })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-plans"] });
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
      setOpen(false);
    },
  });

  return (
    <>
      <Head>
        <title>Training plans · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Training plans"
          subtitle="Multi-week structured programs with weekly goals and progress tracking."
          action={
            <Button variant="contained" onClick={() => setOpen(true)}>
              New plan
            </Button>
          }
        />

        {isLoading ? (
          <CircularProgress />
        ) : (
          plans.map((p) => (
            <Box
              key={p.id}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography fontWeight={700}>{p.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.student_username} · {p.target_weeks} weeks · {p.status}
                </Typography>
              </Box>
              {p.goals?.map((g, i) => (
                <Typography key={i} variant="body2" sx={{ mt: 0.75 }}>
                  Week {g.week ?? i + 1}: {g.text} {g.done ? "✓" : ""}
                </Typography>
              ))}
              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                {p.status === "active" && (
                  <Button
                    size="small"
                    onClick={() =>
                      updateTrainingPlan(p.id, { status: "completed" }).then(
                        () =>
                          qc.invalidateQueries({ queryKey: ["training-plans"] })
                      )
                    }
                  >
                    Mark complete
                  </Button>
                )}
                {p.status === "active" && (
                  <Button
                    size="small"
                    color="warning"
                    onClick={() =>
                      updateTrainingPlan(p.id, { status: "paused" }).then(() =>
                        qc.invalidateQueries({ queryKey: ["training-plans"] })
                      )
                    }
                  >
                    Pause
                  </Button>
                )}
              </Box>
            </Box>
          ))
        )}

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Create training plan</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              size="small"
            >
              {links.map((l) => (
                <MenuItem key={l.id} value={l.student.id}>
                  {l.student.username}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Plan title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
            />
            <TextField
              label="Target weeks"
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              size="small"
            />
            <TextField
              label="Weekly goals (one per line)"
              multiline
              minRows={4}
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              size="small"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!studentId || !title.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create plan
            </Button>
          </DialogActions>
        </Dialog>
      </CoachShell>
    </>
  );
}
