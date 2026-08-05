import Head from "@/components/Head";
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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
import { CoachPageHeader, CoachStatCard } from "@/sections/coach/CoachUi";
import { usePalette } from "@/hooks/usePalette";
import { fetchTelemetryEvents, fetchTelemetryStats } from "@/lib/api/telemetry";

function formatHours(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return formatHours(ms);
}

export default function OpsDashboardPage() {
  const palette = usePalette();
  const { data, isLoading, error } = useQuery({
    queryKey: ["telemetry-stats", 30],
    queryFn: () => fetchTelemetryStats(30),
  });
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["telemetry-events"],
    queryFn: () => fetchTelemetryEvents({ limit: 40 }),
  });

  const analysesChart =
    data?.analyses_by_day.map((row) => ({
      day: row.day.slice(5),
      count: row.count,
    })) ?? [];

  const activeChart =
    data?.active_by_day.map((row) => ({
      day: row.day.slice(5),
      hours: Number(((row.active_ms || 0) / 3_600_000).toFixed(2)),
    })) ?? [];

  return (
    <>
      <Head>
        <title>Ops · VoltChess</title>
      </Head>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: 3 }}>
        <CoachPageHeader
          title="Product telemetry"
          subtitle="Games analyzed, time on site, and client events synced from browsers when the API is healthy."
        />

        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">
            Failed to load telemetry stats. Confirm you are signed in as Admin
            and the API is reachable.
          </Typography>
        ) : data ? (
          <>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
              <CoachStatCard
                label="Games analyzed"
                value={data.totals.games_analyzed}
                icon="mdi:chess-knight"
              />
              <CoachStatCard
                label="Clients"
                value={data.totals.clients}
                icon="mdi:account-multiple"
              />
              <CoachStatCard
                label="Sessions"
                value={data.totals.sessions}
                icon="mdi:timeline-clock-outline"
              />
              <CoachStatCard
                label="Active time"
                value={formatHours(data.totals.active_ms)}
                icon="mdi:timer-outline"
                hint={`Avg session ${formatDuration(data.totals.avg_session_active_ms)}`}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  height: 300,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2 }}>
                  Analyses / day (30d)
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={analysesChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={palette.borderSubtle}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: palette.textMuted, fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={palette.accent}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                  height: 300,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2 }}>
                  Active hours / day (30d)
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={activeChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={palette.borderSubtle}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: palette.textMuted, fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Top engines
                </Typography>
                {data.top_engines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No analysis events yet.
                  </Typography>
                ) : (
                  data.top_engines.map((row) => (
                    <Typography
                      key={row.name}
                      variant="body2"
                      sx={{ py: 0.35 }}
                    >
                      {row.name} — {row.count}
                    </Typography>
                  ))
                )}
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Top sources
                </Typography>
                {data.top_sources.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No source breakdown yet.
                  </Typography>
                ) : (
                  data.top_sources.map((row) => (
                    <Typography
                      key={row.name}
                      variant="body2"
                      sx={{ py: 0.35 }}
                    >
                      {row.name} — {row.count}
                    </Typography>
                  ))
                )}
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
                overflow: "auto",
              }}
            >
              <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                Recent events
              </Typography>
              {eventsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Properties</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(eventsData?.results ?? []).map((ev) => (
                      <TableRow key={ev.event_id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(ev.ts).toLocaleString()}
                        </TableCell>
                        <TableCell>{ev.name}</TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: 12 }}
                        >
                          {ev.client_id.slice(0, 8)}…
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            maxWidth: 360,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {JSON.stringify(ev.properties)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </>
        ) : null}
      </Box>
    </>
  );
}
