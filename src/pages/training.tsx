import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { PageTitle } from "@/components/pageTitle";
import NavLink from "@/components/NavLink";
import { ToolPrimaryButton, ToolStat } from "@/sections/tools/ToolsShell";
import { usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import { getLichessUserRecentGames } from "@/lib/lichess";
import { getChessComUserRecentGames } from "@/lib/chessCom";
import { OPENING_COURSES, type OpeningCourse } from "@/data/openingCourses";
import type { LoadedGame } from "@/types/game";

type Platform = "chesscom" | "lichess";
type Outcome = "win" | "loss" | "draw" | "unknown";

const PLATFORM_LABELS: Record<Platform, string> = {
  chesscom: "Chess.com",
  lichess: "Lichess",
};

interface OpeningPattern {
  key: string;
  sanLine: string;
  moves: string[];
  count: number;
  wins: number;
  losses: number;
  draws: number;
  /** (wins + 0.5 × draws) / games with a known result, null when none known */
  score: number | null;
}

interface RecentLoss {
  pgn: string;
  opponent: string;
  userIsWhite: boolean;
  date?: string;
}

interface GameStats {
  totalGames: number;
  /** Games where the user's result is known (win, loss, or draw) */
  scoredGames: number;
  wins: number;
  losses: number;
  draws: number;
  /** (wins + 0.5 × draws) / scoredGames, null when no result is known */
  score: number | null;
  gamesAsWhite: number;
  gamesAsBlack: number;
  decidedAsWhite: number;
  decidedAsBlack: number;
  /** wins / decided games as White (draws excluded), null when none decided */
  winRateAsWhite: number | null;
  /** wins / decided games as Black (draws excluded), null when none decided */
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

function openingMovesFromPgn(pgn: string, plies = 6): string[] | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();
    if (history.length < 2) return null;
    return history.slice(0, plies);
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
    {
      moves: string[];
      count: number;
      wins: number;
      losses: number;
      draws: number;
    }
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

    const openingMoves = openingMovesFromPgn(game.pgn);
    if (openingMoves) {
      const key = openingMoves.join(" ");
      const entry = openingMap.get(key) ?? {
        moves: openingMoves,
        count: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };
      entry.count++;
      if (outcome === "win") entry.wins++;
      else if (outcome === "loss") entry.losses++;
      else if (outcome === "draw") entry.draws++;
      openingMap.set(key, entry);
    }

    // Games arrive newest-first from both platforms, so the first losses we
    // encounter are the most recent ones.
    if (outcome === "loss" && recentLosses.length < 3) {
      recentLosses.push({
        pgn: game.pgn,
        opponent: color === "w" ? game.black.name : game.white.name,
        userIsWhite: color === "w",
        date: game.date,
      });
    }
  }

  const openingPatterns: OpeningPattern[] = Array.from(openingMap.entries())
    .map(([key, entry]) => {
      const scored = entry.wins + entry.losses + entry.draws;
      return {
        key,
        sanLine: key,
        moves: entry.moves,
        count: entry.count,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        score: scored > 0 ? (entry.wins + 0.5 * entry.draws) / scored : null,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const scoredGames = wins + losses + draws;

  return {
    totalGames: games.length,
    scoredGames,
    wins,
    losses,
    draws,
    score: scoredGames > 0 ? (wins + 0.5 * draws) / scoredGames : null,
    gamesAsWhite,
    gamesAsBlack,
    decidedAsWhite,
    decidedAsBlack,
    winRateAsWhite: decidedAsWhite > 0 ? winsAsWhite / decidedAsWhite : null,
    winRateAsBlack: decidedAsBlack > 0 ? winsAsBlack / decidedAsBlack : null,
    timeClassCounts,
    openingPatterns,
    recentLosses,
  };
}

/**
 * Find a trainer course whose lines start with the same moves as the pattern,
 * comparing the first 2–4 plies and preferring the deepest match.
 */
function findDrillCourse(moves: string[]): OpeningCourse | undefined {
  let best: { course: OpeningCourse; depth: number } | undefined;
  for (const course of OPENING_COURSES) {
    for (const line of course.lines) {
      const maxDepth = Math.min(4, moves.length, line.moves.length);
      let depth = 0;
      while (depth < maxDepth && line.moves[depth] === moves[depth]) depth++;
      if (depth >= 2 && (!best || depth > best.depth)) {
        best = { course, depth };
      }
    }
  }
  return best?.course;
}

interface TrainingModule {
  id: string;
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  /** When set, the CTA hands the game to /analysis via the session helper */
  reviewLoss?: RecentLoss;
}

function buildTrainingModules(stats: GameStats): TrainingModule[] {
  const modules: TrainingModule[] = [];

  const scorePct = stats.score !== null ? Math.round(stats.score * 100) : null;
  modules.push({
    id: "tactics",
    icon: "mdi:puzzle",
    title: "Sharpen your tactics",
    description:
      scorePct !== null
        ? `You scored ${scorePct}% over your last ${stats.totalGames} games — rated puzzles are the most direct way to win more of the close ones.`
        : "Rated puzzles matched to your level are the most direct way to win more of the close games.",
    ctaLabel: "Solve puzzles",
    href: "/puzzles",
  });

  const topOpening = stats.openingPatterns[0];
  if (topOpening) {
    const openingPct =
      topOpening.score !== null ? Math.round(topOpening.score * 100) : null;
    modules.push({
      id: "opening-drill",
      icon: "mdi:book-open-page-variant",
      title: "Drill your most played opening",
      description: `You reached "${topOpening.sanLine}" in ${topOpening.count} recent game${
        topOpening.count === 1 ? "" : "s"
      }${
        openingPct !== null ? ` and scored ${openingPct}% from it` : ""
      }. Drill the line until the moves are automatic.`,
      ctaLabel: "Open trainer",
      href: "/openings",
    });
  }

  if (stats.recentLosses.length > 0) {
    const loss = stats.recentLosses[0];
    modules.push({
      id: "review-loss",
      icon: "mdi:magnify-scan",
      title: "Review your last loss",
      description: `Replay your loss with ${
        loss.userIsWhite ? "White" : "Black"
      } against ${loss.opponent}${
        loss.date ? ` (${loss.date})` : ""
      } move by move and find where it slipped.`,
      ctaLabel: "Review that loss",
      reviewLoss: loss,
    });
  } else {
    modules.push({
      id: "engine-review",
      icon: "mdi:chart-timeline-variant",
      title: "Deep-dive a recent game",
      description:
        "Run any of your games through a full Stockfish review — accuracy, mistakes, and the moves you missed.",
      ctaLabel: "Open analysis",
      href: "/analysis",
    });
  }

  const colorCandidates: {
    color: "White" | "Black";
    rate: number | null;
    decided: number;
  }[] = [
    {
      color: "White",
      rate: stats.winRateAsWhite,
      decided: stats.decidedAsWhite,
    },
    {
      color: "Black",
      rate: stats.winRateAsBlack,
      decided: stats.decidedAsBlack,
    },
  ];
  const weakest = colorCandidates
    .filter((candidate) => candidate.rate !== null && candidate.decided >= 3)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0];
  if (weakest && weakest.rate !== null && weakest.rate < 0.45) {
    const pct = Math.round(weakest.rate * 100);
    modules.push({
      id: "color-repertoire",
      icon: "mdi:chess-pawn",
      title: `Shore up your ${weakest.color} repertoire`,
      description:
        weakest.color === "Black"
          ? `You scored ${pct}% in decided games as Black — drill a defense line until it holds up under pressure.`
          : `You scored ${pct}% in decided games as White — drill an opening line until it's second nature.`,
      ctaLabel:
        weakest.color === "Black" ? "Train a defense" : "Train an opening",
      href: "/openings",
    });
  }

  const totalTimed = Object.values(stats.timeClassCounts).reduce(
    (a, b) => a + b,
    0
  );
  const bulletCount = stats.timeClassCounts.bullet ?? 0;
  if (totalTimed > 0 && bulletCount / totalTimed > 0.5) {
    modules.push({
      id: "time-management",
      icon: "mdi:clock-alert-outline",
      title: "Train faster pattern recognition",
      description: `${Math.round(
        (bulletCount / totalTimed) * 100
      )}% of your recent games were bullet — pattern drills help you find good moves before the clock decides for you.`,
      ctaLabel: "Practice puzzles",
      href: "/puzzles",
    });
  }

  return modules;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export default function Training() {
  const palette = usePalette();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<Platform>("chesscom");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<LoadedGame[] | null>(null);
  const [analyzedUsername, setAnalyzedUsername] = useState("");
  const [analyzedPlatform, setAnalyzedPlatform] =
    useState<Platform>("chesscom");

  const stats = useMemo(
    () => (games ? computeStats(games, analyzedUsername) : null),
    [games, analyzedUsername]
  );

  const modules = useMemo(
    () => (stats ? buildTrainingModules(stats) : null),
    [stats]
  );

  const handleBuildPlan = async () => {
    const trimmed = username.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const fetched =
        platform === "chesscom"
          ? await getChessComUserRecentGames(trimmed)
          : await getLichessUserRecentGames(trimmed);

      if (fetched.length === 0) {
        setError(
          `No recent games found for "${trimmed}" on ${PLATFORM_LABELS[platform]} — check the spelling and try again.`
        );
        setGames(null);
        return;
      }

      setGames(fetched);
      setAnalyzedUsername(trimmed);
      setAnalyzedPlatform(platform);
    } catch {
      setError(
        "Couldn't load games for that username — check the spelling and try again."
      );
      setGames(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewLoss = (loss: RecentLoss) => {
    prepareNewAnalysisSession(loss.pgn, loss.userIsWhite);
    router.push("/analysis");
  };

  const sectionLabelSx = {
    color: palette.textMuted,
    letterSpacing: "0.1em",
    fontSize: "0.66rem",
  } as const;

  const ctaButtonSx = {
    borderColor: alpha(palette.accent, 0.35),
    color: palette.text,
    "&:hover": {
      borderColor: palette.accent,
      bgcolor: alpha(palette.accent, 0.08),
    },
  } as const;

  return (
    <>
      <PageTitle
        title="Training Coach — VoltChess"
        description="Import your recent Chess.com or Lichess games and get a training plan built from your openings, results by color, and time controls."
      />

      <Box
        sx={{
          maxWidth: stats ? 1120 : 560,
          mx: "auto",
          width: "100%",
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ mb: { xs: 2.5, md: 3.5 }, maxWidth: 640 }}>
          <Typography
            variant="overline"
            sx={{
              color: palette.textMuted,
              letterSpacing: "0.14em",
              fontSize: "0.68rem",
              display: "block",
              mb: 0.75,
            }}
          >
            VoltChess
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.55rem", md: "1.85rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              mb: 0.75,
            }}
          >
            Training Coach
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: palette.textMuted,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            A training plan built from your recent games — import from Chess.com
            or Lichess to see what to work on next.
          </Typography>
        </Box>

        <Box
          sx={{
            maxWidth: 560,
            borderRadius: 2.5,
            border: `1px solid ${palette.border}`,
            bgcolor: palette.surfaceRaised,
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                ...sectionLabelSx,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
                display: "block",
                mb: 0.75,
              }}
            >
              Platform
            </Typography>
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
          </Box>

          <TextField
            fullWidth
            label="Username"
            placeholder={
              platform === "chesscom" ? "e.g. hikaru" : "e.g. DrNykterstein"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleBuildPlan();
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

          <ToolPrimaryButton
            onClick={handleBuildPlan}
            loading={isLoading}
            disabled={!username.trim()}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Icon icon="mdi:format-list-checks" width={18} />
              )
            }
          >
            Build my training plan
          </ToolPrimaryButton>

          {error && <Alert severity="warning">{error}</Alert>}
        </Box>

        {!stats && !isLoading && (
          <Typography
            variant="caption"
            sx={{
              color: palette.textMuted,
              display: "block",
              textAlign: "center",
              mt: 1.5,
            }}
          >
            Uses the public games on your profile — openings, results by color,
            and time controls.
          </Typography>
        )}

        {isLoading && !stats && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: palette.accent }} />
          </Box>
        )}

        {stats && modules && (
          <Box
            sx={{
              mt: 3.5,
              display: "flex",
              flexDirection: "column",
              gap: 3.5,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1.25,
                }}
              >
                <Typography variant="overline" sx={sectionLabelSx}>
                  Recent form
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`}
                  sx={{
                    color: palette.textMuted,
                    borderColor: palette.border,
                    fontFamily: "ui-monospace, monospace",
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 1,
                }}
              >
                <ToolStat label="Games" value={stats.totalGames} />
                <ToolStat
                  label="Score"
                  value={formatPercent(stats.score)}
                  emphasize
                />
                <ToolStat
                  label="Win rate as White (decided)"
                  value={formatPercent(stats.winRateAsWhite)}
                />
                <ToolStat
                  label="Win rate as Black (decided)"
                  value={formatPercent(stats.winRateAsBlack)}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: palette.textMuted, display: "block", mt: 1 }}
              >
                Built from {stats.totalGames} recent games for{" "}
                {analyzedUsername} on {PLATFORM_LABELS[analyzedPlatform]}. Score
                counts draws as half a point; win rates count decided games
                only.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{ ...sectionLabelSx, display: "block", mb: 1.25 }}
              >
                Time controls
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {Object.entries(stats.timeClassCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([timeClass, count]) => (
                    <Chip
                      key={timeClass}
                      size="small"
                      variant="outlined"
                      label={`${timeClass} · ${count}`}
                      sx={{
                        color: palette.textMuted,
                        borderColor: palette.border,
                        bgcolor: alpha(palette.bg, 0.4),
                      }}
                    />
                  ))}
              </Box>
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{ ...sectionLabelSx, display: "block", mb: 1.25 }}
              >
                Your most played openings
              </Typography>
              {stats.openingPatterns.length === 0 ? (
                <Typography variant="body2" sx={{ color: palette.textMuted }}>
                  Not enough moves in these games to spot a repeated opening
                  yet.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {stats.openingPatterns.map((pattern) => {
                    const course = findDrillCourse(pattern.moves);
                    return (
                      <Box
                        key={pattern.key}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          border: `1px solid ${palette.borderSubtle}`,
                          bgcolor: alpha(palette.bg, 0.55),
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Typography
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              fontFamily: "ui-monospace, monospace",
                              fontSize: "0.8rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: palette.text,
                            }}
                          >
                            {pattern.sanLine}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: palette.textMuted, flexShrink: 0 }}
                          >
                            {pattern.count} game{pattern.count === 1 ? "" : "s"}
                          </Typography>
                          {course && (
                            <NavLink href="/openings" fullWidth={false}>
                              <Button
                                size="small"
                                variant="outlined"
                                title={`Matches the ${course.name} course`}
                                sx={{
                                  ...ctaButtonSx,
                                  flexShrink: 0,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Open trainer
                              </Button>
                            </NavLink>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            mt: 1,
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={(pattern.score ?? 0) * 100}
                            sx={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha(palette.bg, 0.8),
                              "& .MuiLinearProgress-bar": {
                                bgcolor: palette.accent,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: palette.textMuted,
                              fontFamily: "ui-monospace, monospace",
                              minWidth: 40,
                              textAlign: "right",
                            }}
                          >
                            {formatPercent(pattern.score)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{ ...sectionLabelSx, display: "block", mb: 1.25 }}
              >
                Training plan
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {modules.map((module) => {
                  const reviewLoss = module.reviewLoss;
                  return (
                    <Box
                      key={module.id}
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${palette.border}`,
                        bgcolor: palette.surfaceRaised,
                        p: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        transition: "border-color 0.15s ease",
                        "&:hover": {
                          borderColor: alpha(palette.accent, 0.35),
                        },
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
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 650,
                          lineHeight: 1.3,
                        }}
                      >
                        {module.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: palette.textMuted,
                          lineHeight: 1.55,
                          flex: 1,
                        }}
                      >
                        {module.description}
                      </Typography>
                      {reviewLoss ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleReviewLoss(reviewLoss)}
                          endIcon={<Icon icon="mdi:arrow-right" width={14} />}
                          sx={{ ...ctaButtonSx, alignSelf: "flex-start" }}
                        >
                          {module.ctaLabel}
                        </Button>
                      ) : (
                        module.href && (
                          <Box>
                            <NavLink href={module.href} fullWidth={false}>
                              <Button
                                size="small"
                                variant="outlined"
                                endIcon={
                                  <Icon icon="mdi:arrow-right" width={14} />
                                }
                                sx={ctaButtonSx}
                              >
                                {module.ctaLabel}
                              </Button>
                            </NavLink>
                          </Box>
                        )
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
