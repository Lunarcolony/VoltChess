import { useMemo, useState } from "react";
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
import ClassroomPanel from "@/sections/coach/ClassroomPanel";
import { CoachPageHeader, CoachEmptyState } from "@/sections/coach/CoachUi";
import { engagementColor, PRIORITY_OPTIONS } from "@/sections/coach/constants";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchCoachLinks, updateCoachLink } from "@/lib/api/academies";
import { fetchCoachDashboard } from "@/lib/api/coaching";
import NavLink from "@/components/NavLink";

export default function CoachStudentsPage() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [priority, setPriority] = useState("normal");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [targetAcc, setTargetAcc] = useState("");

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["coach-dashboard"],
    queryFn: fetchCoachDashboard,
  });

  const updateMut = useMutation({
    mutationFn: (payload: Parameters<typeof updateCoachLink>[1]) =>
      updateCoachLink(editId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
      qc.invalidateQueries({ queryKey: ["coach-links"] });
      setEditId(null);
    },
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    dashboard?.roster.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [dashboard]);

  const filtered = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.roster.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.student.username.toLowerCase().includes(q) ||
        r.student.email.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      const matchTag = !tagFilter || r.tags.includes(tagFilter);
      return matchSearch && matchTag;
    });
  }, [dashboard, search, tagFilter]);

  const openEdit = async (linkId: string) => {
    const links = await fetchCoachLinks();
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    setEditId(linkId);
    setNotes(link.coach_notes);
    setTags((link.tags ?? []).join(", "));
    setPriority(link.priority);
    setWeeklyGoal(link.weekly_game_goal?.toString() ?? "");
    setTargetAcc(link.target_accuracy?.toString() ?? "");
  };

  return (
    <>
      <Head>
        <title>Students · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Student roster"
          subtitle="Share your classroom code so students can join from My Academy. Search, tag, and set goals for everyone on your roster."
        />

        <ClassroomPanel />

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search name, email, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Tag"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All tags</MenuItem>
            {allTags.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {isLoading ? (
          <CircularProgress />
        ) : filtered.length === 0 ? (
          <CoachEmptyState
            icon="mdi:account-search-outline"
            title="No students match"
            description="Share your classroom code above, or adjust your search filters."
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {filtered.map((r) => (
              <Box
                key={r.link_id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                  gap: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateCoachLink(r.link_id, { pinned: !r.pinned }).then(() => {
                          qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
                          qc.invalidateQueries({ queryKey: ["coach-links"] });
                        })
                      }
                      aria-label={r.pinned ? "Unpin" : "Pin"}
                    >
                      <Icon
                        icon={r.pinned ? "mdi:pin" : "mdi:pin-outline"}
                        width={18}
                        color={r.pinned ? palette.accent : palette.textMuted}
                      />
                    </IconButton>
                    <NavLink href={`/coach/students/${r.student.id}`}>
                      <Typography fontWeight={700} fontSize="1.05rem">
                        {r.student.username}
                      </Typography>
                    </NavLink>
                    <Chip
                      label={`${r.engagement_score}% engaged`}
                      size="small"
                      sx={{
                        bgcolor: alpha(engagementColor(r.engagement_score), 0.12),
                        color: engagementColor(r.engagement_score),
                        fontWeight: 700,
                      }}
                    />
                    {r.tags.map((t) => (
                      <Chip key={t} label={t} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {r.stats.total_games} games · {r.stats.analyzed_games} analyzed ·{" "}
                    {r.avg_accuracy != null ? `${r.avg_accuracy}% avg accuracy` : "No accuracy yet"}
                    {r.days_inactive != null ? ` · last active ${r.days_inactive}d ago` : ""}
                  </Typography>
                  {r.coach_notes_preview && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                      Note: {r.coach_notes_preview}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Button size="small" variant="outlined" onClick={() => openEdit(r.link_id)}>
                    Edit profile
                  </Button>
                  <NavLink href={`/coach/students/${r.student.id}`}>
                    <Button size="small" variant="contained">
                      Open dossier
                    </Button>
                  </NavLink>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Dialog open={!!editId} onClose={() => setEditId(null)} fullWidth maxWidth="sm">
          <DialogTitle>Student coaching profile</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Private coach notes"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
            />
            <TextField
              label="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              size="small"
              placeholder="advanced, tournament, u1200"
            />
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              size="small"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Weekly game goal"
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              size="small"
            />
            <TextField
              label="Target accuracy %"
              type="number"
              value={targetAcc}
              onChange={(e) => setTargetAcc(e.target.value)}
              size="small"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditId(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={updateMut.isPending}
              onClick={() =>
                updateMut.mutate({
                  coach_notes: notes,
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  priority: priority as "low" | "normal" | "high",
                  weekly_game_goal: weeklyGoal ? Number(weeklyGoal) : null,
                  target_accuracy: targetAcc ? Number(targetAcc) : null,
                  last_reviewed_at: new Date().toISOString(),
                })
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CoachShell>
    </>
  );
}
