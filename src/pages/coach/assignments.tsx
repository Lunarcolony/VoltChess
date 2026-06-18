import { useMemo, useState } from "react";
import Head from "@/components/Head";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CoachShell from "@/sections/coach/CoachShell";
import { CoachPageHeader, CoachEmptyState } from "@/sections/coach/CoachUi";
import {
  ASSIGNMENT_CATEGORIES,
  formatCategory,
  PRIORITY_OPTIONS,
} from "@/sections/coach/constants";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchCoachLinks } from "@/lib/api/academies";
import {
  createAssignment,
  fetchAssignments,
  updateAssignment,
  type Assignment,
} from "@/lib/api/assignments";
import { bulkCreateAssignments } from "@/lib/api/coaching";

const STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

export default function CoachAssignmentsPage() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assignment | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pgn, setPgn] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const { data: links = [] } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["assignments"] });
    qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
  };

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAssignment>[1] }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      invalidate();
      setEditItem(null);
    },
  });

  const bulkMut = useMutation({
    mutationFn: bulkCreateAssignments,
    onSuccess: () => {
      invalidate();
      setBulkOpen(false);
      setSelectedStudents([]);
    },
  });

  const byStatus = useMemo(() => {
    const map: Record<string, Assignment[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    assignments.forEach((a) => map[a.status]?.push(a));
    return map;
  }, [assignments]);

  const dueCalendar = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      if (!a.due_date || a.status === "completed" || a.status === "cancelled") return;
      const list = map.get(a.due_date) ?? [];
      list.push(a);
      map.set(a.due_date, list);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [assignments]);

  const resetForm = () => {
    setStudentId("");
    setTitle("");
    setInstructions("");
    setDueDate("");
    setPgn("");
    setCategory("general");
    setPriority("normal");
  };

  const formFields = (
    <>
      <TextField
        select
        label="Student"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        size="small"
        fullWidth
      >
        {links.map((l) => (
          <MenuItem key={l.id} value={l.student.id}>
            {l.student.username}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="small"
        fullWidth
        placeholder="e.g. Review Sicilian game"
      />
      <TextField
        select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        size="small"
        fullWidth
      >
        {ASSIGNMENT_CATEGORIES.map((c) => (
          <MenuItem key={c.value} value={c.value}>
            {c.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        size="small"
        fullWidth
      >
        {PRIORITY_OPTIONS.map((p) => (
          <MenuItem key={p.value} value={p.value}>
            {p.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Instructions"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        multiline
        minRows={3}
        size="small"
        fullWidth
      />
      <TextField
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        size="small"
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="PGN (optional)"
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        multiline
        minRows={3}
        size="small"
        fullWidth
      />
    </>
  );

  return (
    <>
      <Head>
        <title>Assignments · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Assignment workspace"
          subtitle="Kanban board, due-date calendar, bulk assign, and full edit/cancel workflow."
          action={
            <Button variant="outlined" onClick={() => setBulkOpen(true)}>
              Bulk assign
            </Button>
          }
        />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Create" />
          <Tab label="Kanban" />
          <Tab label="Calendar" />
          <Tab label="All list" />
        </Tabs>

        {tab === 0 && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: palette.surfaceRaised,
              border: `1px solid ${palette.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: 520,
            }}
          >
            {formFields}
            <Button
              variant="contained"
              disabled={!studentId || !instructions.trim() || createMut.isPending}
              onClick={() => {
                createMut.mutate({
                  student_id: studentId,
                  title: title.trim(),
                  instructions: instructions.trim(),
                  due_date: dueDate || undefined,
                  pgn: pgn || undefined,
                  category,
                  priority,
                });
                resetForm();
              }}
            >
              Create assignment
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 1.5,
              alignItems: "start",
            }}
          >
            {STATUSES.map((status) => (
              <Box
                key={status}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  minHeight: 200,
                }}
              >
                <Typography fontWeight={700} fontSize="0.85rem" sx={{ mb: 1.5, textTransform: "capitalize" }}>
                  {status.replace("_", " ")} ({byStatus[status].length})
                </Typography>
                {byStatus[status].map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onEdit={() => setEditItem(a)}
                    onStatus={(s) => updateMut.mutate({ id: a.id, data: { status: s } })}
                  />
                ))}
              </Box>
            ))}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {dueCalendar.length === 0 ? (
              <CoachEmptyState
                icon="mdi:calendar-blank"
                title="No upcoming due dates"
                description="Create assignments with due dates to see them here."
              />
            ) : (
              dueCalendar.map(([date, items]) => (
                <Box
                  key={date}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${palette.border}`,
                    bgcolor: palette.surfaceRaised,
                  }}
                >
                  <Typography fontWeight={700}>{date}</Typography>
                  {items.map((a) => (
                    <Typography key={a.id} variant="body2" sx={{ mt: 0.75 }}>
                      {a.student.username}: {a.title || a.instructions.slice(0, 60)}
                    </Typography>
                  ))}
                </Box>
              ))
            )}
          </Box>
        )}

        {tab === 3 &&
          (isLoading ? (
            <CircularProgress />
          ) : (
            assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onEdit={() => setEditItem(a)}
                onStatus={(s) => updateMut.mutate({ id: a.id, data: { status: s } })}
                list
              />
            ))
          ))}

        <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Bulk assign</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select students to receive the same assignment.
            </Typography>
            {links.map((l) => (
              <FormControlLabel
                key={l.id}
                control={
                  <Checkbox
                    checked={selectedStudents.includes(l.student.id)}
                    onChange={(e) =>
                      setSelectedStudents((prev) =>
                        e.target.checked
                          ? [...prev, l.student.id]
                          : prev.filter((id) => id !== l.student.id)
                      )
                    }
                  />
                }
                label={l.student.username}
              />
            ))}
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} size="small" />
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                selectedStudents.length === 0 || !instructions.trim() || bulkMut.isPending
              }
              onClick={() =>
                bulkMut.mutate({
                  student_ids: selectedStudents,
                  title: title.trim(),
                  instructions: instructions.trim(),
                  due_date: dueDate || undefined,
                  category,
                  priority,
                  pgn: pgn || undefined,
                })
              }
            >
              Assign to {selectedStudents.length} students
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!editItem} onClose={() => setEditItem(null)} fullWidth maxWidth="sm">
          <DialogTitle>Edit assignment</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {editItem && (
              <>
                <TextField
                  label="Title"
                  defaultValue={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  size="small"
                />
                <TextField
                  label="Instructions"
                  defaultValue={editItem.instructions}
                  onChange={(e) =>
                    setEditItem({ ...editItem, instructions: e.target.value })
                  }
                  multiline
                  minRows={3}
                  size="small"
                />
                <TextField
                  select
                  label="Status"
                  value={editItem.status}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      status: e.target.value as Assignment["status"],
                    })
                  }
                  size="small"
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                editItem &&
                updateMut.mutate({
                  id: editItem.id,
                  data: {
                    title: editItem.title,
                    instructions: editItem.instructions,
                    status: editItem.status,
                  },
                })
              }
            >
              Save changes
            </Button>
          </DialogActions>
        </Dialog>
      </CoachShell>
    </>
  );
}

function AssignmentCard({
  assignment: a,
  onEdit,
  onStatus,
  list,
}: {
  assignment: Assignment;
  onEdit: () => void;
  onStatus: (s: Assignment["status"]) => void;
  list?: boolean;
}) {
  const palette = usePalette();
  const overdue =
    a.due_date &&
    a.status !== "completed" &&
    a.status !== "cancelled" &&
    new Date(a.due_date) < new Date(new Date().toDateString());

  return (
    <Box
      sx={{
        p: list ? 2 : 1.25,
        mb: list ? 1.5 : 1,
        borderRadius: 1.5,
        bgcolor: alpha(palette.bg, 0.5),
        border: `1px solid ${overdue ? "#ef4444" : palette.borderSubtle}`,
      }}
    >
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 0.5 }}>
        <Typography fontWeight={700} fontSize="0.85rem">
          {a.student.username}
        </Typography>
        <Chip label={formatCategory(a.category)} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
        {a.priority === "high" && (
          <Chip label="High" size="small" color="error" sx={{ height: 20 }} />
        )}
        {overdue && <Chip label="Overdue" size="small" color="error" sx={{ height: 20 }} />}
      </Box>
      <Typography fontWeight={600} fontSize="0.85rem">
        {a.title || "Untitled"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {a.instructions.slice(0, list ? 200 : 80)}
      </Typography>
      {a.due_date && (
        <Typography variant="caption" color="text.secondary">
          Due {a.due_date}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
        <Button size="small" onClick={onEdit}>
          Edit
        </Button>
        {a.status === "pending" && (
          <Button size="small" onClick={() => onStatus("in_progress")}>
            Start
          </Button>
        )}
        {a.status !== "completed" && a.status !== "cancelled" && (
          <>
            <Button size="small" onClick={() => onStatus("completed")}>
              Complete
            </Button>
            <Button size="small" color="warning" onClick={() => onStatus("cancelled")}>
              Cancel
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
