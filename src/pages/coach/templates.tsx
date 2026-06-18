import { useState } from "react";
import Head from "@/components/Head";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CoachShell from "@/sections/coach/CoachShell";
import { CoachPageHeader, CoachEmptyState } from "@/sections/coach/CoachUi";
import { ASSIGNMENT_CATEGORIES, formatCategory } from "@/sections/coach/constants";
import { usePalette } from "@/hooks/usePalette";
import {
  createLessonTemplate,
  deleteLessonTemplate,
  fetchLessonTemplates,
  updateLessonTemplate,
  type LessonTemplate,
} from "@/lib/api/coaching";
import { createAssignment } from "@/lib/api/assignments";
import { fetchCoachLinks } from "@/lib/api/academies";

export default function CoachTemplatesPage() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [applyTpl, setApplyTpl] = useState<LessonTemplate | null>(null);
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "homework",
    instructions: "",
    pgn: "",
    estimated_minutes: "",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["lesson-templates"],
    queryFn: fetchLessonTemplates,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createLessonTemplate({
        title: form.title.trim(),
        category: form.category,
        instructions: form.instructions.trim(),
        pgn: form.pgn,
        estimated_minutes: form.estimated_minutes
          ? Number(form.estimated_minutes)
          : null,
        is_favorite: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-templates"] });
      setOpen(false);
      setForm({ title: "", category: "homework", instructions: "", pgn: "", estimated_minutes: "" });
    },
  });

  const applyMut = useMutation({
    mutationFn: () =>
      createAssignment({
        student_id: studentId,
        title: applyTpl!.title,
        instructions: applyTpl!.instructions,
        pgn: applyTpl!.pgn || undefined,
        category: applyTpl!.category,
      }),
    onSuccess: () => {
      setApplyTpl(null);
      setStudentId("");
    },
  });

  return (
    <>
      <Head>
        <title>Lesson templates · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Lesson template library"
          subtitle="Reusable drills and homework — favorite templates and assign in one click."
          action={
            <Button variant="contained" onClick={() => setOpen(true)}>
              New template
            </Button>
          }
        />

        {isLoading ? (
          <CircularProgress />
        ) : templates.length === 0 ? (
          <CoachEmptyState
            icon="mdi:book-plus-outline"
            title="No templates yet"
            description="Save your best assignments as templates to reuse across students."
          />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {templates.map((t) => (
              <Box
                key={t.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography fontWeight={700}>{t.title}</Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      updateLessonTemplate(t.id, { is_favorite: !t.is_favorite }).then(() =>
                        qc.invalidateQueries({ queryKey: ["lesson-templates"] })
                      )
                    }
                  >
                    <Icon
                      icon={t.is_favorite ? "mdi:star" : "mdi:star-outline"}
                      width={18}
                      color={t.is_favorite ? palette.accent : palette.textMuted}
                    />
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, my: 1 }}>
                  <Chip label={formatCategory(t.category)} size="small" />
                  {t.estimated_minutes && (
                    <Chip label={`${t.estimated_minutes} min`} size="small" variant="outlined" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t.instructions.slice(0, 160)}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" onClick={() => setApplyTpl(t)}>
                    Assign
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() =>
                      deleteLessonTemplate(t.id).then(() =>
                        qc.invalidateQueries({ queryKey: ["lesson-templates"] })
                      )
                    }
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create template</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} size="small">
              {ASSIGNMENT_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Instructions" multiline minRows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} size="small" />
            <TextField label="PGN" multiline minRows={2} value={form.pgn} onChange={(e) => setForm({ ...form, pgn: e.target.value })} size="small" />
            <TextField label="Est. minutes" type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} size="small" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={!form.title.trim() || !form.instructions.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
              Save template
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!applyTpl} onClose={() => setApplyTpl(null)} fullWidth maxWidth="xs">
          <DialogTitle>Assign template</DialogTitle>
          <DialogContent>
            <TextField select fullWidth label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)} size="small" sx={{ mt: 1 }}>
              {links.map((l) => (
                <MenuItem key={l.id} value={l.student.id}>{l.student.username}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplyTpl(null)}>Cancel</Button>
            <Button variant="contained" disabled={!studentId || applyMut.isPending} onClick={() => applyMut.mutate()}>
              Create assignment
            </Button>
          </DialogActions>
        </Dialog>
      </CoachShell>
    </>
  );
}
