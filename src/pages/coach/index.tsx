import Head from "@/components/Head";
import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import {
  fetchCoachLinks,
  fetchStudentStats,
  avgAccuracy,
} from "@/lib/api/academies";
import { fetchAssignments } from "@/lib/api/assignments";
import NavLink from "@/components/NavLink";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  const palette = usePalette();
  const cardSx = useCardSx();

  return (
    <Box sx={{ ...cardSx, flex: 1, minWidth: 140 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Icon icon={icon} width={20} color={palette.accent} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}

export default function CoachDashboard() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const { user } = useAuth();

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  return (
    <>
      <Head>
        <title>Coach Dashboard · VoltChess Academy</title>
      </Head>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Coach Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Welcome back, {user?.username}. Manage students, assignments, and synced
          games.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <StatCard
            label="Students"
            value={linksLoading ? "…" : links.length}
            icon="mdi:account-group-outline"
          />
          <StatCard
            label="Assignments"
            value={assignmentsLoading ? "…" : assignments.length}
            icon="mdi:clipboard-text-outline"
          />
          <StatCard
            label="Pending"
            value={assignmentsLoading ? "…" : pendingCount}
            icon="mdi:clock-outline"
          />
        </Box>

        <Box sx={{ ...cardSx, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Students
          </Typography>
          {linksLoading ? (
            <CircularProgress size={28} />
          ) : links.length === 0 ? (
            <Typography color="text.secondary">
              No students linked yet. Add coach–student links in the academy admin.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Games</TableCell>
                  <TableCell>Avg accuracy</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {links.map((link) => (
                  <StudentRow key={link.id} studentId={link.student.id} username={link.student.username} />
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        <Box sx={{ ...cardSx }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Recent assignments
            </Typography>
            <NavLink href="/coach/assignments">
              <Typography fontSize="0.85rem" sx={{ color: palette.accent, fontWeight: 600 }}>
                Manage →
              </Typography>
            </NavLink>
          </Box>
          {assignmentsLoading ? (
            <CircularProgress size={28} />
          ) : assignments.length === 0 ? (
            <Typography color="text.secondary">No assignments yet.</Typography>
          ) : (
            assignments.slice(0, 8).map((a) => (
              <Box
                key={a.id}
                sx={{
                  py: 1.25,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography fontWeight={600} fontSize="0.9rem">
                    {a.student.username}
                  </Typography>
                  <Chip
                    label={a.status.replace("_", " ")}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.7rem",
                      bgcolor: alpha(palette.accent, 0.1),
                      color: palette.accent,
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {a.instructions}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </>
  );
}

function StudentRow({
  studentId,
  username,
}: {
  studentId: string;
  username: string;
}) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["student-stats", studentId],
    queryFn: () => fetchStudentStats(studentId),
  });

  return (
    <TableRow>
      <TableCell>{username}</TableCell>
      <TableCell>{isLoading ? "…" : stats?.total_games ?? 0}</TableCell>
      <TableCell>
        {isLoading
          ? "…"
          : stats && avgAccuracy(stats) != null
            ? `${avgAccuracy(stats)!.toFixed(1)}%`
            : "—"}
      </TableCell>
      <TableCell align="right">
        <NavLink href={`/coach/students/${studentId}`}>
          <Typography
            component="span"
            fontSize="0.85rem"
            sx={{ color: "primary.main", fontWeight: 600, cursor: "pointer" }}
          >
            View
          </Typography>
        </NavLink>
      </TableCell>
    </TableRow>
  );
}
