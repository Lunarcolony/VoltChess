import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  type SelectChangeEvent,
  LinearProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { PageTitle } from "@/components/pageTitle";
import NavLink from "@/components/NavLink";
import { usePalette } from "@/hooks/usePalette";
import {
  K_FACTOR_PRESETS,
  expectedScore,
  newRating,
  ratingChange,
  winProbability,
  type GameResult,
} from "@/lib/elo";

const MIN_RATING = 100;
const MAX_RATING = 3500;

const clampRating = (value: number): number =>
  Math.min(MAX_RATING, Math.max(MIN_RATING, value));

const RESULT_OPTIONS: { value: GameResult; label: string; icon: string }[] = [
  { value: "win", label: "Win", icon: "mdi:trophy-outline" },
  { value: "draw", label: "Draw", icon: "mdi:equal" },
  { value: "loss", label: "Loss", icon: "mdi:close-circle-outline" },
];

const RELATED_LINKS = [
  { href: "/tools/next-move", label: "Next move calculator" },
  { href: "/tools/editor", label: "Board editor" },
  { href: "/analysis", label: "Full analysis" },
  { href: "/tools", label: "All tools" },
];

export default function EloCalculator() {
  const palette = usePalette();

  const [rating, setRating] = useState(1500);
  const [opponentRating, setOpponentRating] = useState(1500);
  const [result, setResult] = useState<GameResult>("win");
  const [kFactorId, setKFactorId] = useState<string>(K_FACTOR_PRESETS[1].id);

  const kFactor = useMemo(
    () => K_FACTOR_PRESETS.find((preset) => preset.id === kFactorId)?.k ?? 20,
    [kFactorId]
  );

  const ratingClamped = clampRating(rating);
  const opponentClamped = clampRating(opponentRating);

  const expected = useMemo(
    () => expectedScore(ratingClamped, opponentClamped),
    [ratingClamped, opponentClamped]
  );
  const winProb = useMemo(
    () => winProbability(ratingClamped, opponentClamped),
    [ratingClamped, opponentClamped]
  );
  const change = useMemo(
    () => ratingChange(ratingClamped, opponentClamped, result, kFactor),
    [ratingClamped, opponentClamped, result, kFactor]
  );
  const nextRating = useMemo(
    () => newRating(ratingClamped, opponentClamped, result, kFactor),
    [ratingClamped, opponentClamped, result, kFactor]
  );

  const isGain = change >= 0;

  return (
    <>
      <PageTitle
        title="Elo Calculator — VoltChess"
        description="Calculate expected score, win probability, and rating change for any FIDE-style Elo matchup and K-factor."
      />

      <Box
        sx={{
          maxWidth: 560,
          mx: "auto",
          width: "100%",
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
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
            Elo Calculator
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: palette.textMuted,
              fontSize: "0.95rem",
              lineHeight: 1.55,
            }}
          >
            Estimate expected score, win probability, and rating change from a
            single result.
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${palette.border}`,
            bgcolor: palette.surfaceRaised,
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              fullWidth
              label="Your rating"
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value) || 0)}
              onBlur={() => setRating((v) => clampRating(v))}
              slotProps={{
                input: {
                  startAdornment: (
                    <Icon
                      icon="mdi:account"
                      width={18}
                      color={palette.textMuted}
                      style={{ marginRight: 8 }}
                    />
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Opponent rating"
              type="number"
              value={opponentRating}
              onChange={(e) => setOpponentRating(Number(e.target.value) || 0)}
              onBlur={() => setOpponentRating((v) => clampRating(v))}
              slotProps={{
                input: {
                  startAdornment: (
                    <Icon
                      icon="mdi:account-outline"
                      width={18}
                      color={palette.textMuted}
                      style={{ marginRight: 8 }}
                    />
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
                display: "block",
                mb: 0.75,
              }}
            >
              Result
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={result}
              onChange={(_, value) => value && setResult(value)}
            >
              {RESULT_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  <Icon
                    icon={option.icon}
                    width={16}
                    style={{ marginRight: 6 }}
                  />
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
                display: "block",
                mb: 0.75,
              }}
            >
              K-factor
            </Typography>
            <Select
              fullWidth
              size="small"
              value={kFactorId}
              onChange={(e: SelectChangeEvent) => setKFactorId(e.target.value)}
            >
              {K_FACTOR_PRESETS.map((preset) => (
                <MenuItem key={preset.id} value={preset.id}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box
            sx={{
              height: 1,
              bgcolor: palette.borderSubtle,
            }}
          />

          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                mb: 0.75,
              }}
            >
              <Typography variant="body2" sx={{ color: palette.textMuted }}>
                Win probability
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {(winProb * 100).toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={winProb * 100}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: alpha(palette.bg, 0.6),
                "& .MuiLinearProgress-bar": {
                  bgcolor: palette.accent,
                  borderRadius: 5,
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box
              sx={{
                flex: 1,
                py: 1.25,
                px: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(palette.bg, 0.55),
                border: `1px solid ${palette.borderSubtle}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: palette.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.65rem",
                  display: "block",
                  mb: 0.35,
                }}
              >
                Expected score
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "1.3rem" }}>
                {expected.toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                py: 1.25,
                px: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(palette.bg, 0.55),
                border: `1px solid ${palette.borderSubtle}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: palette.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.65rem",
                  display: "block",
                  mb: 0.35,
                }}
              >
                Rating change
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: isGain ? palette.accent : "error.main",
                }}
              >
                {isGain ? "+" : ""}
                {change.toFixed(1)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(palette.accent, 0.08),
              border: `1px solid ${alpha(palette.accent, 0.25)}`,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: palette.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.65rem",
                }}
              >
                New rating
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.7rem",
                  color: palette.accent,
                }}
              >
                {nextRating}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.85rem",
                color: palette.textMuted,
              }}
            >
              {ratingClamped} → {nextRating}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(palette.surfaceRaised, 0.5),
            border: `1px solid ${palette.borderSubtle}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: palette.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.65rem",
              display: "block",
              mb: 0.75,
            }}
          >
            How this works
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: palette.textMuted,
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            Elo estimates your expected score against an opponent from the
            rating gap alone: a 400-point lead gives roughly a 91% expected
            score. After the game, your rating moves by K × (actual score −
            expected score) — a win when the model expected a loss swings the
            most, a draw between close ratings barely moves it at all. The
            K-factor controls how fast ratings react: FIDE uses a bigger K for
            new or lower-rated players and a smaller one once you're
            established.
          </Typography>
        </Box>

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{
            mt: 3,
            pt: 2.5,
            borderTop: `1px solid ${palette.borderSubtle}`,
          }}
        >
          {RELATED_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} fullWidth={false}>
              <Button
                size="small"
                variant="text"
                endIcon={<Icon icon="mdi:arrow-right" width={14} />}
                sx={{
                  color: palette.textMuted,
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": { color: palette.text },
                }}
              >
                {link.label}
              </Button>
            </NavLink>
          ))}
        </Stack>
      </Box>
    </>
  );
}
