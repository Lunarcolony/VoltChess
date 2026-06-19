import Head from "@/components/Head";
import { Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchAssignments, updateAssignment } from "@/lib/api/assignments";
import { fetchGames } from "@/lib/api/games";
import { fetchCoachMessages } from "@/lib/api/coaching";
import NavLink from "@/components/NavLink";
import JoinClassroomCard from "@/sections/coach/JoinClassroomCard";
import StudentSyncPanel from "@/sections/student/StudentSyncPanel";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import { useRouter } from "@/hooks/useRouter";

export default function StudentHome() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["my-games"],
    queryFn: () => fetchGames(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["coach-messages"],
    queryFn: fetchCoachMessages,
  });

  const statusMut = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "in_progress" | "completed";
    }) => updateAssignment(id, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const myAssignments = assignments.filter((a) => a.student.id === user?.id);

  const openAssignmentPgn = async (pgn: string) => {
    if (!pgn) return;
    prepareNewAnalysisSession(pgn);
    await router.push("/analysis");
  };

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

        <JoinClassroomCard />

        <StudentSyncPanel />

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
                <Box
                  sx={{ display: "flex", gap: 1, mb: 0.5, flexWrap: "wrap" }}
                >
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {a.instructions}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {a.pgn && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openAssignmentPgn(a.pgn)}
                    >
                      Open game
                    </Button>
                  )}
                  {a.status === "pending" && (
                    <Button
                      size="small"
                      onClick={() =>
                        statusMut.mutate({ id: a.id, status: "in_progress" })
                      }
                    >
                      Start
                    </Button>
                  )}
                  {a.status === "in_progress" && (
                    <Button
                      size="small"
                      onClick={() =>
                        statusMut.mutate({ id: a.id, status: "completed" })
                      }
                    >
                      Mark done
                    </Button>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>

        {messages.length > 0 && (
          <Box sx={{ ...cardSx, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Coach messages
            </Typography>
            {messages.slice(0, 5).map((m) => (
              <Box
                key={m.id}
                sx={{
                  py: 1.25,
                  borderBottom: `1px solid ${palette.borderSubtle}`,
                }}
              >
                <Typography fontWeight={600} fontSize="0.9rem">
                  {m.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {m.body}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={cardSx} id="synced-games">
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            My synced games ({gamesLoading ? "…" : games.length})
          </Typography>
          {gamesLoading ? (
            <CircularProgress size={28} />
          ) : games.length === 0 ? (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No games on the server yet. Analyze a game while signed in — it
              will sync automatically.
            </Typography>
          ) : (
            games.slice(0, 15).map((g) => (
              <Box
                key={g.id}
                sx={{
                  py: 0.75,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2">
                  {g.white.name} vs {g.black.name} ({g.result ?? "—"})
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {g.analysis_status === "pending" && (
                    <Chip label="Analyzing soon" size="small" color="warning" />
                  )}
                  {g.has_eval && (
                    <Chip
                      label="Report ready"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  <NavLink href={`/analysis?gameId=${g.id}`}>
                    <Typography
                      fontSize="0.8rem"
                      sx={{ color: palette.accent }}
                    >
                      Open
                    </Typography>
                  </NavLink>
                </Box>
              </Box>
            ))
          )}
          <NavLink href="/reanalysis">
            <Typography
              sx={{
                mt: 2,
                color: palette.accent,
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Analyze a new game →
            </Typography>
          </NavLink>
        </Box>
      </Box>
    </>
  );
}
