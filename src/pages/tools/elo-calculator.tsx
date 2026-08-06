import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  type SelectChangeEvent,
  LinearProgress,
  Chip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import {
  K_FACTOR_PRESETS,
  expectedScore,
  newRating,
  ratingChange,
  winProbability,
  type GameResult,
} from "@/lib/elo";

const RESULT_OPTIONS: { value: GameResult; label: string; icon: string }[] = [
  { value: "win", label: "Win", icon: "mdi:trophy-outline" },
  { value: "draw", label: "Draw", icon: "mdi:equal" },
  { value: "loss", label: "Loss", icon: "mdi:close-circle-outline" },
];

export default function EloCalculator() {
  const palette = usePalette();
  const cardSx = useCardSx();

  const [rating, setRating] = useState(1500);
  const [opponentRating, setOpponentRating] = useState(1500);
  const [result, setResult] = useState<GameResult>("win");
  const [kFactorId, setKFactorId] = useState<string>(K_FACTOR_PRESETS[1].id);

  const kFactor = useMemo(
    () => K_FACTOR_PRESETS.find((preset) => preset.id === kFactorId)?.k ?? 20,
    [kFactorId]
  );

  const expected = useMemo(
    () => expectedScore(rating, opponentRating),
    [rating, opponentRating]
  );
  const winProb = useMemo(
    () => winProbability(rating, opponentRating),
    [rating, opponentRating]
  );
  const change = useMemo(
    () => ratingChange(rating, opponentRating, result, kFactor),
    [rating, opponentRating, result, kFactor]
  );
  const nextRating = useMemo(
    () => newRating(rating, opponentRating, result, kFactor),
    [rating, opponentRating, result, kFactor]
  );

  const isGain = change >= 0;

  return (
    <>
      <PageTitle
        title="Elo Calculator — VoltChess"
        description="Calculate expected score, win probability, and rating change for any FIDE-style Elo matchup and K-factor."
      />

      <PageContainer
        title="Elo Calculator"
        subtitle="Estimate expected score, win probability, and rating change from a single result."
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={cardSx}>
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 2 }}>
                Match details
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Your rating"
                    type="number"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value) || 0)}
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
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Opponent rating"
                    type="number"
                    value={opponentRating}
                    onChange={(e) =>
                      setOpponentRating(Number(e.target.value) || 0)
                    }
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
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Result
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={result}
                onChange={(_, value) => value && setResult(value)}
                sx={{ mb: 2 }}
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

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                K-factor
              </Typography>
              <Select
                fullWidth
                size="small"
                value={kFactorId}
                onChange={(e: SelectChangeEvent) =>
                  setKFactorId(e.target.value)
                }
              >
                {K_FACTOR_PRESETS.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ ...cardSx, height: "100%" }}>
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 2 }}>
                Result
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Win probability
                  </Typography>
                  <Typography variant="body2">
                    {(winProb * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={winProb * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: palette.surface,
                    "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                  }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: palette.surface,
                      border: `1px solid ${palette.borderSubtle}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Expected score
                    </Typography>
                    <Typography variant="h3" sx={{ fontSize: "1.3rem" }}>
                      {expected.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: palette.surface,
                      border: `1px solid ${palette.borderSubtle}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Rating change
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: "1.3rem",
                        color: isGain ? palette.accent : "error.main",
                      }}
                    >
                      {isGain ? "+" : ""}
                      {change.toFixed(1)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

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
                  <Typography variant="caption" color="text.secondary">
                    New rating
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: "1.6rem", color: palette.accent }}
                  >
                    {nextRating}
                  </Typography>
                </Box>
                <Chip
                  label={`${rating} → ${nextRating}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
}
