import Head from "@/components/Head";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchCoachDashboard } from "@/lib/api/coaching";
import CoachShell from "@/sections/coach/CoachShell";
import {
  CoachPageHeader,
  CoachStatCard,
  CoachEmptyState,
} from "@/sections/coach/CoachUi";
import { engagementColor } from "@/sections/coach/constants";
import NavLink from "@/components/NavLink";

export default function CoachDashboardPage() {
  const palette = usePalette();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["coach-dashboard"],
    queryFn: fetchCoachDashboard,
  });

  return (
    <>
      <Head>
        <title>Coach Command Center · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Command Center"
          subtitle={`Welcome back, ${user?.username}. Your academy at a glance — students, workload, and who needs attention today.`}
        />

        {isLoading ? (
          <CircularProgress />
        ) : !data ? (
          <CoachEmptyState
            icon="mdi:account-tie"
            title="Unable to load dashboard"
            description="Check your API connection and try again."
          />
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
              <CoachStatCard
                label="Students"
                value={data.summary.students}
                icon="mdi:account-group-outline"
              />
              <CoachStatCard
                label="Overdue"
                value={data.summary.assignments_overdue}
                icon="mdi:alert-circle-outline"
                accent="#ef4444"
                hint={
                  data.summary.assignments_due_soon
                    ? `${data.summary.assignments_due_soon} due this week`
                    : undefined
                }
              />
              <CoachStatCard
                label="In progress"
                value={data.summary.assignments_in_progress}
                icon="mdi:progress-clock"
              />
              <CoachStatCard
                label="Analyzed games"
                value={data.summary.analyzed_games_total}
                icon="mdi:chart-timeline-variant"
              />
              <CoachStatCard
                label="Active plans"
                value={data.summary.active_training_plans}
                icon="mdi:calendar-check-outline"
              />
              <CoachStatCard
                label="Unread mail"
                value={data.summary.unread_messages}
                icon="mdi:email-outline"
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  p: 2.5,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography fontWeight={700}>At-risk students</Typography>
                  <NavLink href="/coach/students">
                    <Typography fontSize="0.8rem" sx={{ color: palette.accent, fontWeight: 600 }}>
                      View roster →
                    </Typography>
                  </NavLink>
                </Box>
                {data.at_risk.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Everyone looks on track. Nice work.
                  </Typography>
                ) : (
                  data.at_risk.slice(0, 5).map((s) => (
                    <Box
                      key={s.link_id}
                      sx={{
                        py: 1.25,
                        borderBottom: `1px solid ${palette.borderSubtle}`,
                        "&:last-child": { borderBottom: 0 },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <NavLink href={`/coach/students/${s.student.id}`}>
                          <Typography fontWeight={600} fontSize="0.9rem">
                            {s.student.username}
                          </Typography>
                        </NavLink>
                        <Chip
                          label={`${s.engagement_score}%`}
                          size="small"
                          sx={{
                            height: 22,
                            bgcolor: alpha(engagementColor(s.engagement_score), 0.15),
                            color: engagementColor(s.engagement_score),
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {s.reasons.join(" · ")}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>

              <Box
                sx={{
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  p: 2.5,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2 }}>
                  Recent activity
                </Typography>
                {data.activity.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent student activity.
                  </Typography>
                ) : (
                  data.activity.slice(0, 6).map((a, i) => (
                    <Box
                      key={`${a.at}-${i}`}
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        py: 1,
                        borderBottom: `1px solid ${palette.borderSubtle}`,
                        "&:last-child": { borderBottom: 0 },
                      }}
                    >
                      <Icon
                        icon={
                          a.type === "game_synced"
                            ? "mdi:chess-pawn"
                            : "mdi:clipboard-text-outline"
                        }
                        width={18}
                        color={palette.accent}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontSize="0.85rem" fontWeight={600} noWrap>
                          {a.student_username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {a.summary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(a.at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography fontWeight={700}>Student pulse</Typography>
                <NavLink href="/coach/students">
                  <Button size="small" variant="outlined">
                    Manage students
                  </Button>
                </NavLink>
              </Box>
              {data.roster.length === 0 ? (
                <CoachEmptyState
                  icon="mdi:account-plus-outline"
                  title="No students yet"
                  description="Add students by username from the Students tab."
                />
              ) : (
                data.roster.slice(0, 8).map((r) => (
                  <Box
                    key={r.link_id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr auto auto" },
                      gap: 1,
                      alignItems: "center",
                      py: 1.25,
                      borderBottom: `1px solid ${palette.borderSubtle}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {r.pinned && (
                        <Icon icon="mdi:pin" width={14} color={palette.accent} />
                      )}
                      <NavLink href={`/coach/students/${r.student.id}`}>
                        <Typography fontWeight={600}>{r.student.username}</Typography>
                      </NavLink>
                      {r.priority === "high" && (
                        <Chip label="High" size="small" color="error" sx={{ height: 20 }} />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary">
                        Weekly games {r.games_this_week}
                        {r.weekly_game_goal ? ` / ${r.weekly_game_goal}` : ""}
                      </Typography>
                      {r.weekly_game_goal ? (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            100,
                            (r.games_this_week / r.weekly_game_goal) * 100
                          )}
                          sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                        />
                      ) : null}
                    </Box>
                    <Typography
                      fontWeight={700}
                      fontSize="0.85rem"
                      sx={{ color: engagementColor(r.engagement_score) }}
                    >
                      {r.avg_accuracy != null ? `${r.avg_accuracy}% acc` : "—"} ·{" "}
                      {r.engagement_score}% engaged
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </CoachShell>
    </>
  );
}
