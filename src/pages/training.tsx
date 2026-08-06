import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid2 as Grid,
  Chip,
  LinearProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import NavLink from "@/components/NavLink";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getLichessUserRecentGames } from "@/lib/lichess";
import { getChessComUserRecentGames } from "@/lib/chessCom";
import { MoveClassification } from "@/types/enums";
import type { LoadedGame } from "@/types/game";

type Platform = "chesscom" | "lichess";
type Outcome = "win" | "loss" | "draw" | "unknown";

interface OpeningPattern {
  key: string;
  sanLine: string;
  count: number;
  wins: number;
  losses: number;
  draws: number;
}

interface RecentLoss {
  pgn: string;
  opponent: string;
  date?: string;
  url?: string;
}

interface GameStats {
  totalGames: number;
  decidedGames: number;
  wins: number;
  losses: number;
  draws: number;
  gamesAsWhite: number;
  gamesAsBlack: number;
  winRateAsWhite: number | null;
  winRateAsBlack: number | null;
  timeClassCounts: Record<string, number>;
  openingPatterns: OpeningPattern[];
  recentLosses: RecentLoss[];
}

function userColorInGame(game: LoadedGame, username: string): "w" | "b" | null {
  const uname = username.trim().toLowerCase();
  if (!uname) return null;
  if (game.white.name.toLowerCase() === uname) return "w";
  if (game.black.name.toLowerCase() === uname) return "b";
  return null;
}

function outcomeForColor(
  result: string | undefined,
  color: "w" | "b"
): Outcome {
  if (!result) return "unknown";
  const trimmed = result.trim();
  if (trimmed === "1/2-1/2") return "draw";
  if (trimmed === "1-0") return color === "w" ? "win" : "loss";
  if (trimmed === "0-1") return color === "b" ? "win" : "loss";
  return "unknown";
}

function openingKeyFromPgn(pgn: string, plies = 6): string | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();
    if (history.length < 2) return null;
    return history.slice(0, plies).join(" ");
  } catch {
    return null;
  }
}

function computeStats(games: LoadedGame[], username: string): GameStats {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let gamesAsWhite = 0;
  let gamesAsBlack = 0;
  let winsAsWhite = 0;
  let decidedAsWhite = 0;
  let winsAsBlack = 0;
  let decidedAsBlack = 0;
  const timeClassCounts: Record<string, number> = {};
  const openingMap = new Map<
    string,
    { count: number; wins: number; losses: number; draws: number }
  >();
  const recentLosses: RecentLoss[] = [];

  for (const game of games) {
    const timeClass = game.timeClass || "unknown";
    timeClassCounts[timeClass] = (timeClassCounts[timeClass] || 0) + 1;

    const color = userColorInGame(game, username);
    if (!color) continue;

    if (color === "w") gamesAsWhite++;
    else gamesAsBlack++;

    const outcome = outcomeForColor(game.result, color);
    if (outcome === "win") wins++;
    else if (outcome === "loss") losses++;
    else if (outcome === "draw") draws++;

    if (outcome === "win" || outcome === "loss") {
      if (color === "w") {
        decidedAsWhite++;
        if (outcome === "win") winsAsWhite++;
      } else {
        decidedAsBlack++;
        if (outcome === "win") winsAsBlack++;
      }
    }

    const openingKey = openingKeyFromPgn(game.pgn);
    if (openingKey) {
      const entry = openingMap.get(openingKey) || {
        count: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };
      entry.count++;
      if (outcome === "win") entry.wins++;
      else if (outcome === "loss") entry.losses++;
      else if (outcome === "draw") entry.draws++;
      openingMap.set(openingKey, entry);
    }

    if (outcome === "loss" && recentLosses.length < 3) {
      const opponent = color === "w" ? game.black.name : game.white.name;
      recentLosses.push({
        pgn: game.pgn,
        opponent,
        date: game.date,
        url: game.url,
      });
    }
  }

  const openingPatterns: OpeningPattern[] = Array.from(openingMap.entries())
    .map(([key, value]) => ({ key, sanLine: key, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalGames: games.length,
    decidedGames: wins + losses + draws,
    wins,
    losses,
    draws,
    gamesAsWhite,
    gamesAsBlack,
    winRateAsWhite: decidedAsWhite > 0 ? winsAsWhite / decidedAsWhite : null,
    winRateAsBlack: decidedAsBlack > 0 ? winsAsBlack / decidedAsBlack : null,
    timeClassCounts,
    openingPatterns,
    recentLosses,
  };
}

interface TrainingModule {
  id: string;
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

function buildTrainingModules(stats: GameStats): TrainingModule[] {
  const modules: TrainingModule[] = [
    {
      id: "tactics",
      icon: "mdi:puzzle",
      title: "Practice tactics",
      description:
        "Sharpen your calculation with Elo-rated puzzles that adapt to your rating.",
      ctaLabel: "Solve puzzles",
      href: "/puzzles",
    },
  ];

  const topOpening = stats.openingPatterns[0];
  if (topOpening) {
    const winRate =
      topOpening.wins + topOpening.losses + topOpening.draws > 0
        ? Math.round(
            (topOpening.wins /
              (topOpening.wins + topOpening.losses + topOpening.draws)) *
              100
          )
        : null;
    modules.push({
      id: "opening-drill",
      icon: "mdi:book-open-page-variant",
      title: "Drill your most-played opening",
      description: `You played "${topOpening.sanLine}" in ${topOpening.count} recent game${
        topOpening.count === 1 ? "" : "s"
      }${winRate !== null ? ` (${winRate}% score)` : ""}. Train the theory until it's automatic.`,
      ctaLabel: "Open the opening trainer",
      href: "/openings",
    });
  }

  if (stats.recentLosses.length > 0) {
    const loss = stats.recentLosses[0];
    modules.push({
      id: "review-losses",
      icon: "mdi:magnify-scan",
      title: "Review your last loss",
      description: `Find out what went wrong against ${loss.opponent}${
        loss.date ? ` (${loss.date})` : ""
      } with a full Stockfish breakdown.`,
      ctaLabel: "Analyze that game",
      href: `/analysis?pgnText=${encodeURIComponent(loss.pgn)}`,
    });
  }

  const bulletCount = stats.timeClassCounts.bullet || 0;
  const totalTimed = Object.values(stats.timeClassCounts).reduce(
    (a, b) => a + b,
    0
  );
  if (totalTimed > 0 && bulletCount / totalTimed > 0.5) {
    modules.push({
      id: "time-management",
      icon: "mdi:clock-alert-outline",
      title: "Work on time management",
      description: `${Math.round(
        (bulletCount / totalTimed) * 100
      )}% of your recent games were bullet. Drill patterns until they're instinctive so you don't run low on the clock.`,
      ctaLabel: "Practice puzzles",
      href: "/puzzles",
    });
  }

  if (
    stats.gamesAsBlack > 0 &&
    stats.winRateAsBlack !== null &&
    stats.winRateAsBlack < 0.4
  ) {
    modules.push({
      id: "black-repertoire",
      icon: "mdi:chess-pawn",
      title: "Shore up your Black repertoire",
      description: `Your score as Black is ${Math.round(
        stats.winRateAsBlack * 100
      )}% — lower than as White. A solid, well-drilled defense will help.`,
      ctaLabel: "Train Black openings",
      href: "/openings",
    });
  }

  modules.push({
    id: "full-review",
    icon: "mdi:chart-timeline-variant",
    title: "Deep dive with engine analysis",
    description:
      "Load any of your games for a full move-by-move Stockfish review with accuracy and blunder detection.",
    ctaLabel: "Open analysis",
    href: "/analysis",
  });

  return modules;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export default function Training() {
  const palette = usePalette();
  const cardSx = useCardSx();

  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<Platform>("chesscom");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<LoadedGame[] | null>(null);
  const [analyzedUsername, setAnalyzedUsername] = useState("");

  const { games: localGames, isReady: isLocalDbReady } = useGameDatabase(true);

  const blunderStats = useMemo(() => {
    const analyzedGames = localGames.filter((g) => g.eval);
    if (analyzedGames.length === 0) return null;

    let totalBlunders = 0;
    let totalMistakes = 0;
    let totalMoves = 0;
    for (const g of analyzedGames) {
      const positions = g.eval?.positions || [];
      totalMoves += positions.length;
      for (const p of positions) {
        if (p.moveClassification === MoveClassification.Blunder) {
          totalBlunders++;
        } else if (p.moveClassification === MoveClassification.Mistake) {
          totalMistakes++;
        }
      }
    }

    return {
      gamesAnalyzed: analyzedGames.length,
      totalBlunders,
      totalMistakes,
      totalMoves,
    };
  }, [localGames]);

  const stats = useMemo(
    () => (games ? computeStats(games, analyzedUsername) : null),
    [games, analyzedUsername]
  );

  const modules = useMemo(
    () => (stats ? buildTrainingModules(stats) : null),
    [stats]
  );

  const handleAnalyze = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a username first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetched =
        platform === "chesscom"
          ? await getChessComUserRecentGames(trimmed)
          : await getLichessUserRecentGames(trimmed);

      if (fetched.length === 0) {
        setError(
          "No recent games found for that username. Double-check the spelling and platform."
        );
        setGames(null);
        return;
      }

      setGames(fetched);
      setAnalyzedUsername(trimmed);
    } catch {
      setError(
        `Couldn't fetch games from ${
          platform === "chesscom" ? "Chess.com" : "Lichess"
        }. Check the username and try again.`
      );
      setGames(null);
    } finally {
      setIsLoading(false);
    }
  };

  const overallWinRate =
    stats && stats.decidedGames > 0 ? stats.wins / stats.decidedGames : null;

  return (
    <>
      <PageTitle
        title="AI Training Coach — VoltChess"
        description="Import your recent Chess.com or Lichess games and get a personalized training plan based on your openings, win rate, and time controls."
      />

      <PageContainer
        title="AI Training Coach"
        subtitle="Import your recent games and get a training plan tailored to your patterns — free, no engine review required."
      >
        <Box sx={{ ...cardSx, mb: 2.5 }}>
          <Typography variant="h3" sx={{ fontSize: "1rem", mb: 2 }}>
            Import your games
          </Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="Username"
                placeholder={
                  platform === "chesscom" ? "e.g. hikaru" : "e.g. DrNykterstein"
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Icon
                        icon="mdi:account-search"
                        width={18}
                        color={palette.textMuted}
                        style={{ marginRight: 8 }}
                      />
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={platform}
                onChange={(_, value) => value && setPlatform(value)}
              >
                <ToggleButton value="chesscom">
                  <Icon
                    icon="simple-icons:chessdotcom"
                    width={16}
                    style={{ marginRight: 6 }}
                  />
                  Chess.com
                </ToggleButton>
                <ToggleButton value="lichess">
                  <Icon
                    icon="simple-icons:lichess"
                    width={16}
                    style={{ marginRight: 6 }}
                  />
                  Lichess
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleAnalyze}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon icon="mdi:robot-happy-outline" width={18} />
                  )
                }
              >
                {isLoading ? "Analyzing…" : "Analyze"}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        {!stats && !isLoading && (
          <Box
            sx={{
              ...cardSx,
              textAlign: "center",
              py: 6,
              color: palette.textMuted,
            }}
          >
            <Icon icon="mdi:chart-box-outline" width={40} />
            <Typography variant="body1" sx={{ mt: 1.5 }}>
              Import your recent games to get a personalized training plan.
            </Typography>
          </Box>
        )}

        {stats && modules && (
          <>
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ ...cardSx, height: "100%" }}>
                  <Typography variant="body2" color="text.secondary">
                    Games analyzed
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: "2rem", color: palette.accent }}
                  >
                    {stats.totalGames}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    for {analyzedUsername} on{" "}
                    {platform === "chesscom" ? "Chess.com" : "Lichess"}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ ...cardSx, height: "100%" }}>
                  <Typography variant="body2" color="text.secondary">
                    Overall score
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: "2rem", color: palette.accent }}
                  >
                    {formatPercent(overallWinRate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.wins}W / {stats.losses}L / {stats.draws}D
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ ...cardSx, height: "100%" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Score by color
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">
                        White ({stats.gamesAsWhite})
                      </Typography>
                      <Typography variant="caption">
                        {formatPercent(stats.winRateAsWhite)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.winRateAsWhite ?? 0) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: palette.surface,
                        "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                      }}
                    />
                  </Box>
                  <Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">
                        Black ({stats.gamesAsBlack})
                      </Typography>
                      <Typography variant="caption">
                        {formatPercent(stats.winRateAsBlack)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.winRateAsBlack ?? 0) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: palette.surface,
                        "& .MuiLinearProgress-bar": {
                          bgcolor: palette.textMuted,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ ...cardSx, height: "100%" }}>
                  <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1.5 }}>
                    Your most-played openings
                  </Typography>
                  {stats.openingPatterns.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Not enough game data to detect a pattern yet.
                    </Typography>
                  ) : (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {stats.openingPatterns.map((pattern) => (
                        <Box
                          key={pattern.key}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: palette.surface,
                            border: `1px solid ${palette.borderSubtle}`,
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.78rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {pattern.sanLine}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`×${pattern.count}`}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ ...cardSx, height: "100%" }}>
                  <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1.5 }}>
                    Time controls played
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {Object.entries(stats.timeClassCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([timeClass, count]) => (
                        <Chip
                          key={timeClass}
                          label={`${timeClass} · ${count}`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                  </Box>

                  {blunderStats && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        From {blunderStats.gamesAnalyzed} locally analyzed game
                        {blunderStats.gamesAnalyzed === 1 ? "" : "s"}
                      </Typography>
                      <Box
                        sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}
                      >
                        <Chip
                          icon={
                            <Icon icon="mdi:alert-octagon-outline" width={14} />
                          }
                          label={`${blunderStats.totalBlunders} blunders`}
                          size="small"
                          color={
                            blunderStats.totalBlunders > 0 ? "error" : "success"
                          }
                          variant="outlined"
                        />
                        <Chip
                          icon={<Icon icon="mdi:alert-outline" width={14} />}
                          label={`${blunderStats.totalMistakes} mistakes`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    </>
                  )}
                  {!blunderStats && isLocalDbReady && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 2 }}
                    >
                      Run a game through Analysis to see blunder counts here.
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h3" sx={{ fontSize: "1.1rem", mb: 2 }}>
              Your training plan
            </Typography>
            <Grid container spacing={2}>
              {modules.map((module) => (
                <Grid key={module.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      ...cardSx,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(palette.accent, 0.12),
                        color: palette.accent,
                      }}
                    >
                      <Icon icon={module.icon} width={22} />
                    </Box>
                    <Typography variant="h3" sx={{ fontSize: "1.05rem" }}>
                      {module.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1 }}
                    >
                      {module.description}
                    </Typography>
                    <NavLink href={module.href}>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          alignSelf: "flex-start",
                          borderColor: alpha(palette.accent, 0.35),
                          color: palette.text,
                        }}
                      >
                        {module.ctaLabel}
                      </Button>
                    </NavLink>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </PageContainer>
    </>
  );
}
