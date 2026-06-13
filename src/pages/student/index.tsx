import Head from "@/components/Head";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchAssignments } from "@/lib/api/assignments";
import { fetchGames } from "@/lib/api/games";
import NavLink from "@/components/NavLink";

export default function StudentHome() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const { user } = useAuth();

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["my-games"],
    queryFn: () => fetchGames(),
  });

  const myAssignments = assignments.filter(
    (a) => a.student.id === user?.id
  );

  return (
    <>
      <Head>
        <title>My Academy · VoltChess</title>
      </Head>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          My Academy
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Welcome, {user?.username}. View assignments and your synced games.
        </Typography>

        <Box sx={{ ...cardSx, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Assignments
          </Typography>
          {assignmentsLoading ? (
            <CircularProgress size={28} />
          ) : myAssignments.length === 0 ? (
            <Typography color="text.secondary">No assignments yet.</Typography>
          ) : (
            myAssignments.map((a) => (
              <Box
                key={a.id}
                sx={{
                  py: 1.5,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                }}
              >
                <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                  <Typography fontWeight={600}>
                    From {a.coach.username}
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

        <Box sx={cardSx}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            My synced games ({gamesLoading ? "…" : games.length})
          </Typography>
          {gamesLoading ? (
            <CircularProgress size={28} />
          ) : games.length === 0 ? (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No games on the server yet. Analyze a game from Home — it will sync
              when logged in.
            </Typography>
          ) : (
            games.slice(0, 10).map((g) => (
              <Typography key={g.id} variant="body2" sx={{ py: 0.75 }}>
                {g.white.name} vs {g.black.name} ({g.result ?? "—"})
              </Typography>
            ))
          )}
          <NavLink href="/reanalysis">
            <Typography
              sx={{ mt: 2, color: palette.accent, fontWeight: 600, fontSize: "0.9rem" }}
            >
              Analyze a game →
            </Typography>
          </NavLink>
        </Box>
      </Box>
    </>
  );
}
