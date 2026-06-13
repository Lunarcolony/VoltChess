import Head from "@/components/Head";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { avgAccuracy, fetchStudentStats } from "@/lib/api/academies";
import { fetchGames } from "@/lib/api/games";
import NavLink from "@/components/NavLink";

export default function CoachStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const palette = usePalette();
  const cardSx = useCardSx();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats", id],
    queryFn: () => fetchStudentStats(id!),
    enabled: !!id,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["student-games", id],
    queryFn: () => fetchGames(id),
    enabled: !!id,
  });

  return (
    <>
      <Head>
        <title>Student · VoltChess Academy</title>
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
          {stats?.username ?? "Student"}
        </Typography>

        {statsLoading ? (
          <CircularProgress />
        ) : stats ? (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
            <Box sx={{ ...cardSx, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                Games
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {stats.total_games}
              </Typography>
            </Box>
            <Box sx={{ ...cardSx, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                With analysis
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {stats.analyzed_games}
              </Typography>
            </Box>
            <Box sx={{ ...cardSx, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                Avg accuracy
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {avgAccuracy(stats) != null
                  ? `${avgAccuracy(stats)!.toFixed(1)}%`
                  : "—"}
              </Typography>
            </Box>
          </Box>
        ) : null}

        <Box sx={cardSx}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Synced games
          </Typography>
          {gamesLoading ? (
            <CircularProgress size={28} />
          ) : games.length === 0 ? (
            <Typography color="text.secondary">
              No games synced yet. Student can analyze games while signed in.
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
              </Box>
            ))
          )}
        </Box>
      </Box>
    </>
  );
}
