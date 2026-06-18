import Head from "@/components/Head";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import CoachShell from "@/sections/coach/CoachShell";
import { CoachPageHeader, CoachStatCard } from "@/sections/coach/CoachUi";
import { usePalette } from "@/hooks/usePalette";
import { fetchCoachAnalytics } from "@/lib/api/coaching";

export default function CoachAnalyticsPage() {
  const palette = usePalette();
  const { data, isLoading } = useQuery({
    queryKey: ["coach-analytics"],
    queryFn: fetchCoachAnalytics,
  });

  const chartData =
    data?.accuracy_by_student.map((s) => ({
      name: s.username.slice(0, 10),
      accuracy: s.accuracy ?? 0,
      blunders: s.blunders,
    })) ?? [];

  const mistakeData = data
    ? Object.entries(data.mistake_totals)
        .filter(([k]) => ["Blunder", "Mistake", "Inaccuracy"].includes(k))
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <>
      <Head>
        <title>Analytics · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Cohort analytics"
          subtitle="Compare accuracy, mistake patterns, and assignment mix across your academy."
        />

        {isLoading ? (
          <CircularProgress />
        ) : data ? (
          <>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
              <CoachStatCard
                label="Cohort avg accuracy"
                value={
                  data.cohort_avg_accuracy != null
                    ? `${data.cohort_avg_accuracy}%`
                    : "—"
                }
                icon="mdi:target"
              />
              <CoachStatCard
                label="Students tracked"
                value={data.accuracy_by_student.length}
                icon="mdi:account-group"
              />
            </Box>

            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
                height: 320,
              }}
            >
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Accuracy by student
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.borderSubtle} />
                  <XAxis dataKey="name" tick={{ fill: palette.textMuted, fontSize: 11 }} />
                  <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill={palette.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
                height: 280,
              }}
            >
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Mistake breakdown (cohort)
              </Typography>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={mistakeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.borderSubtle} />
                  <XAxis dataKey="name" tick={{ fill: palette.textMuted, fontSize: 11 }} />
                  <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {data.top_opening_events.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Top opening events in synced games
                </Typography>
                {data.top_opening_events.map(([name, count]) => (
                  <Typography key={name} variant="body2" sx={{ py: 0.35 }}>
                    {name} — {count} games
                  </Typography>
                ))}
              </Box>
            )}
          </>
        ) : null}
      </CoachShell>
    </>
  );
}
