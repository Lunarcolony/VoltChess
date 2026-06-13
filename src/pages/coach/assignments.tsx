import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "@/components/Head";
import NavLink from "@/components/NavLink";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchCoachLinks } from "@/lib/api/academies";
import {
  createAssignment,
  fetchAssignments,
  updateAssignment,
} from "@/lib/api/assignments";

export default function CoachAssignments() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const queryClient = useQueryClient();

  const { data: links = [] } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const [studentId, setStudentId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pgn, setPgn] = useState("");

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setStudentId("");
      setInstructions("");
      setDueDate("");
      setPgn("");
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAssignment(id, { status: status as "completed" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  return (
    <>
      <Head>
        <title>Assignments · VoltChess Academy</title>
      </Head>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <NavLink href="/coach">
          <Typography
            variant="body2"
            sx={{ color: palette.textMuted, mb: 2, display: "inline-block" }}
          >
            ← Back to Coach Dashboard
          </Typography>
        </NavLink>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Assignments
        </Typography>

        <Box sx={{ ...cardSx, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Create assignment
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
              label="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              multiline
              minRows={2}
              size="small"
            />
            <TextField
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="PGN (optional)"
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              multiline
              minRows={3}
              size="small"
              placeholder="Paste a game for the student to review"
            />
            <Button
              variant="contained"
              disabled={
                !studentId || !instructions.trim() || createMut.isPending
              }
              onClick={() =>
                createMut.mutate({
                  student_id: studentId,
                  instructions: instructions.trim(),
                  due_date: dueDate || undefined,
                  pgn: pgn || undefined,
                })
              }
              sx={{ alignSelf: "flex-start" }}
            >
              {createMut.isPending ? "Creating…" : "Create assignment"}
            </Button>
          </Box>
        </Box>

        <Box sx={cardSx}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            All assignments
          </Typography>
          {isLoading ? (
            <CircularProgress size={28} />
          ) : assignments.length === 0 ? (
            <Typography color="text.secondary">No assignments yet.</Typography>
          ) : (
            assignments.map((a) => (
              <Box
                key={a.id}
                sx={{
                  py: 1.5,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                }}
              >
                <Box sx={{ display: "flex", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                  <Typography fontWeight={600}>{a.student.username}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: alpha(palette.accent, 0.1),
                      color: palette.accent,
                      fontSize: "0.75rem",
                    }}
                  >
                    {a.status.replace("_", " ")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {a.instructions}
                </Typography>
                {a.status !== "completed" && a.status !== "cancelled" && (
                  <Button
                    size="small"
                    onClick={() =>
                      statusMut.mutate({ id: a.id, status: "completed" })
                    }
                  >
                    Mark completed
                  </Button>
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </>
  );
}
