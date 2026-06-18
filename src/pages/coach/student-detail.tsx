import Head from "@/components/Head";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import {
  avgAccuracy,
  fetchCoachLinks,
  fetchStudentReport,
  fetchStudentStats,
  updateCoachLink,
} from "@/lib/api/academies";
import { fetchGames } from "@/lib/api/games";
import { fetchStudentTimeline } from "@/lib/api/coaching";
import { CoachStatCard } from "@/sections/coach/CoachUi";
import NavLink from "@/components/NavLink";
import CoachShell from "@/sections/coach/CoachShell";

function exportCsv(report: Awaited<ReturnType<typeof fetchStudentReport>>) {
  const rows = [
    ["date", "white", "black", "result", "has_eval", "white_accuracy", "black_accuracy"],
    ...report.games.map((g) => [
      g.date ?? "",
      g.white.name,
      g.black.name,
      g.result ?? "",
      g.has_eval ? "yes" : "no",
      g.accuracy?.white ?? "",
      g.accuracy?.black ?? "",
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.student.username}-games.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CoachStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const palette = usePalette();
  const cardSx = useCardSx();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats", id],
    queryFn: () => fetchStudentStats(id!),
    enabled: !!id,
  });

  const { data: link } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
    select: (links) => links.find((l) => l.student.id === id),
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["student-games", id],
    queryFn: () => fetchGames(id),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ["student-timeline", id],
    queryFn: () => fetchStudentTimeline(id!),
    enabled: !!id,
  });

  const { refetch: loadReport, isFetching: reportLoading } = useQuery({
      queryKey: ["student-report", id, dateFrom, dateTo],
      queryFn: () =>
        fetchStudentReport(id!, dateFrom || undefined, dateTo || undefined),
      enabled: false,
  });

  const blunderGame = games.find((g) => g.has_eval);

  const markReviewed = () => {
    if (!link) return;
    updateCoachLink(link.id, { last_reviewed_at: new Date().toISOString() });
  };

  return (
    <>
      <Head>
        <title>{stats?.username ?? "Student"} · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <NavLink href="/coach/students">
          <Typography variant="body2" sx={{ color: palette.textMuted, mb: 2, display: "inline-block" }}>
            ← Back to roster
          </Typography>
        </NavLink>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {stats?.username ?? "Student"}
            </Typography>
            {link && (
              <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
                {(link.tags ?? []).map((t) => (
                  <Chip key={t} label={t} size="small" />
                ))}
                {link.priority === "high" && (
                  <Chip label="High priority" size="small" color="error" />
                )}
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <NavLink href={`/coach/assignments`}>
              <Button size="small" variant="contained">
                Quick assign
              </Button>
            </NavLink>
            <NavLink href={`/coach/messages`}>
              <Button size="small" variant="outlined">
                Message
              </Button>
            </NavLink>
            <Button size="small" variant="outlined" onClick={markReviewed}>
              Mark reviewed
            </Button>
          </Box>
        </Box>

        {statsLoading ? (
          <CircularProgress />
        ) : stats ? (
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
            <CoachStatCard label="Games" value={stats.total_games} icon="mdi:chess-pawn" />
            <CoachStatCard label="Analyzed" value={stats.analyzed_games} icon="mdi:chart-line" />
            <CoachStatCard
              label="Avg accuracy"
              value={avgAccuracy(stats) != null ? `${avgAccuracy(stats)!.toFixed(1)}%` : "—"}
              icon="mdi:target"
            />
            <CoachStatCard
              label="Blunders"
              value={(stats.blunders.white ?? 0) + (stats.blunders.black ?? 0)}
              icon="mdi:alert"
              accent="#ef4444"
            />
            <CoachStatCard
              label="Pending work"
              value={stats.pending_assignments}
              icon="mdi:clipboard-clock-outline"
            />
          </Box>
        ) : null}

        {link?.weekly_game_goal && timeline && (
          <Box sx={{ ...cardSx, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Weekly activity vs goal ({link.weekly_game_goal} games/week)
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline.weekly_games}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.borderSubtle} />
                  <XAxis
                    dataKey="week_start"
                    tick={{ fontSize: 10, fill: palette.textMuted }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="games"
                    stroke={palette.accent}
                    fill={alpha(palette.accent, 0.2)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {link?.target_accuracy && stats && (
          <Box sx={{ ...cardSx, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Accuracy target: {link.target_accuracy}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(
                100,
                ((avgAccuracy(stats) ?? 0) / link.target_accuracy) * 100
              )}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        )}

        {link?.coach_notes && (
          <Box sx={{ ...cardSx, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Private coach notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {link.coach_notes}
            </Typography>
          </Box>
        )}

        <Box sx={{ ...cardSx, mb: 3 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Export & report
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              disabled={reportLoading}
              onClick={async () => {
                const { data } = await loadReport();
                if (data) {
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${data.student.username}-report.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={reportLoading}
              onClick={async () => {
                const { data } = await loadReport();
                if (data) exportCsv(data);
              }}
            >
              Export CSV
            </Button>
            {blunderGame && (
              <NavLink href={`/analysis?gameId=${blunderGame.id}`}>
                <Button size="small" variant="contained">
                  Review latest analyzed game
                </Button>
              </NavLink>
            )}
          </Box>
        </Box>

        {timeline && timeline.timeline.length > 0 && (
          <Box sx={{ ...cardSx, mb: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 2 }}>
              Activity timeline
            </Typography>
            {timeline.timeline.slice(0, 12).map((ev, i) => (
              <Box
                key={`${ev.at}-${i}`}
                sx={{
                  py: 1,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Typography fontSize="0.85rem" fontWeight={600}>
                  {ev.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(ev.at).toLocaleString()} · {ev.type}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={cardSx}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Synced games
          </Typography>
          {gamesLoading ? (
            <CircularProgress size={28} />
          ) : games.length === 0 ? (
            <Typography color="text.secondary">
              No games synced yet. Ask the student to analyze while signed in.
            </Typography>
          ) : (
            games.map((g) => (
              <Box
                key={g.id}
                sx={{
                  py: 1.5,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography fontWeight={600} fontSize="0.9rem">
                    {g.white.name} vs {g.black.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {g.result ?? "—"} · {g.date ?? "No date"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {g.has_eval && (
                    <Chip
                      label="Analyzed"
                      size="small"
                      sx={{
                        bgcolor: alpha(palette.accent, 0.12),
                        color: palette.accent,
                      }}
                    />
                  )}
                  <NavLink href={`/analysis?gameId=${g.id}`}>
                    <Typography fontSize="0.85rem" sx={{ color: palette.accent, fontWeight: 600 }}>
                      Open in analysis
                    </Typography>
                  </NavLink>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </CoachShell>
    </>
  );
}
