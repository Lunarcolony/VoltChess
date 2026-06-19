import Head from "@/components/Head";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { fetchAssignments, updateAssignment } from "@/lib/api/assignments";
import { fetchGames, type ServerGame } from "@/lib/api/games";
import { fetchCoachMessages } from "@/lib/api/coaching";
import { fetchStudentStats } from "@/lib/api/academies";
import NavLink from "@/components/NavLink";
import JoinClassroomCard from "@/sections/coach/JoinClassroomCard";
import StudentPlatformCard from "@/sections/student/StudentPlatformCard";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import { useRouter } from "@/hooks/useRouter";

function gameAccuracy(g: ServerGame): number | null {
  const vals = [g.accuracy?.white, g.accuracy?.black].filter(
    (v): v is number => typeof v === "number" && v > 0
  );
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function gameDate(g: ServerGame): string {
  const raw =
    g.date && g.date !== "????.??.??"
      ? g.date.replace(/\./g, "-")
      : g.created_at;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 120,
        p: 1.75,
        borderRadius: 2,
        bgcolor: alpha(accent, 0.08),
        border: `1px solid ${alpha(accent, 0.25)}`,
      }}
    >
      <Typography variant="h5" fontWeight={700} sx={{ color: accent }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function StudentHome() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["my-games"],
    queryFn: () => fetchGames(),
    refetchInterval: 30_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["coach-messages"],
    queryFn: fetchCoachMessages,
  });

  const { data: stats } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: () => fetchStudentStats(user!.id),
    enabled: !!user?.id,
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
  const openAssignments = myAssignments.filter((a) => a.status !== "completed");

  // Analyzed reports first, then the rest, newest first within each group.
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      if (a.has_eval !== b.has_eval) return a.has_eval ? -1 : 1;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }, [games]);

  const avgAcc =
    stats &&
    (stats.avg_accuracy_white != null || stats.avg_accuracy_black != null)
      ? Math.round(
          ((stats.avg_accuracy_white ?? 0) + (stats.avg_accuracy_black ?? 0)) /
            ([stats.avg_accuracy_white, stats.avg_accuracy_black].filter(
              (v) => v != null
            ).length || 1)
        )
      : null;

  const openAssignmentPgn = async (pgn: string) => {
    if (!pgn) return;
    prepareNewAnalysisSession(pgn);
    await router.push("/analysis");
  };

  return (
    <>
      <Head>
        <title>My Hub · VoltChess</title>
      </Head>
      <Box sx={{ maxWidth: 1180, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          Welcome back, {user?.username}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Your game reports, assignments and coaches — all in one place.
        </Typography>

        {/* Summary stats */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ flexWrap: "wrap", gap: 1.5, mb: 3 }}
        >
          <StatTile
            label="Games synced"
            value={stats?.total_games ?? games.length}
            accent={palette.accent}
          />
          <StatTile
            label="Reports ready"
            value={
              stats?.analyzed_games ?? games.filter((g) => g.has_eval).length
            }
            accent="#4caf50"
          />
          <StatTile
            label="Avg accuracy"
            value={avgAcc != null ? `${avgAcc}%` : "—"}
            accent="#42a5f5"
          />
          <StatTile
            label="Open assignments"
            value={openAssignments.length}
            accent="#ffa726"
          />
        </Stack>

        <Grid container spacing={3}>
          {/* Main column: reports */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={cardSx}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  gap: 1,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  My reports
                </Typography>
                <Chip
                  size="small"
                  label={gamesLoading ? "…" : games.length}
                  sx={{ height: 20 }}
                />
                <Button
                  size="small"
                  sx={{ ml: "auto" }}
                  onClick={() => router.push("/analysis")}
                  startIcon={<span style={{ fontSize: 14 }}>+</span>}
                >
                  Analyze new
                </Button>
              </Box>

              {gamesLoading ? (
                <CircularProgress size={28} />
              ) : sortedGames.length === 0 ? (
                <Typography color="text.secondary">
                  No games yet. Connect your chess account to import your last
                  30 games, or analyze a new game.
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {sortedGames.map((g) => {
                    const acc = gameAccuracy(g);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={g.id}>
                        <Box
                          sx={{
                            p: 1.5,
                            height: "100%",
                            borderRadius: 1.5,
                            border: `1px solid ${palette.borderSubtle}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
                            transition: "border-color .15s ease",
                            "&:hover": {
                              borderColor: alpha(palette.accent, 0.4),
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            title={`${g.white.name} vs ${g.black.name}`}
                          >
                            {g.white.name} vs {g.black.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {g.result || "—"}
                            </Typography>
                            {gameDate(g) && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                · {gameDate(g)}
                              </Typography>
                            )}
                            {acc != null && (
                              <Chip
                                size="small"
                                label={`${acc}% acc`}
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: "auto",
                            }}
                          >
                            {g.has_eval ? (
                              <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label="Report ready"
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            ) : g.analysis_status === "failed" ? (
                              <Chip
                                size="small"
                                color="error"
                                variant="outlined"
                                label="Retry queued"
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                color="warning"
                                variant="outlined"
                                label="Analyzing…"
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            )}
                            <NavLink href={`/review?gameId=${g.id}`}>
                              <Typography
                                fontSize="0.8rem"
                                fontWeight={600}
                                sx={{ color: palette.accent, ml: "auto" }}
                              >
                                {g.has_eval ? "Open report" : "Open"}
                              </Typography>
                            </NavLink>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Grid>

          {/* Right column: account, assignments, coaches */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <StudentPlatformCard />

              <Box sx={cardSx}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                  Assignments
                </Typography>
                {myAssignments.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No assignments yet.
                  </Typography>
                ) : (
                  myAssignments.map((a) => (
                    <Box
                      key={a.id}
                      sx={{
                        py: 1.25,
                        borderBottom: `1px solid ${palette.borderSubtle}`,
                        "&:last-of-type": { borderBottom: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 0.5,
                          alignItems: "center",
                        }}
                      >
                        <Typography fontWeight={600} fontSize="0.85rem">
                          From {a.coach.username}
                        </Typography>
                        <Chip
                          label={a.status.replace("_", " ")}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
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
                              statusMut.mutate({
                                id: a.id,
                                status: "in_progress",
                              })
                            }
                          >
                            Start
                          </Button>
                        )}
                        {a.status === "in_progress" && (
                          <Button
                            size="small"
                            onClick={() =>
                              statusMut.mutate({
                                id: a.id,
                                status: "completed",
                              })
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

              <JoinClassroomCard />

              {messages.length > 0 && (
                <Box sx={cardSx}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                    Coach messages
                  </Typography>
                  {messages.slice(0, 5).map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        py: 1,
                        borderBottom: `1px solid ${palette.borderSubtle}`,
                        "&:last-of-type": { borderBottom: 0 },
                      }}
                    >
                      <Typography fontWeight={600} fontSize="0.85rem">
                        {m.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {m.body}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
