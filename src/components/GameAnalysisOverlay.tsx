import { Box, CircularProgress, Portal, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { usePalette } from "@/hooks/usePalette";
import { useAnalysisOverlay } from "@/hooks/useAnalysisOverlay";
import { ENGINE_LABELS } from "@/constants";

export default function GameAnalysisOverlay() {
  const palette = usePalette();
  const {
    visible,
    engineLoading,
    progress,
    totalPositions,
    analyzedPositions,
    remainingPositions,
    elapsedSeconds,
    estimatedRemainingSeconds,
    engineName,
    formatDuration,
  } = useAnalysisOverlay();

  if (!visible) return null;

  const engineLabel = ENGINE_LABELS[engineName]?.small ?? "Stockfish";
  const roundedProgress = Math.round(progress * 10) / 10;

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 3 },
          bgcolor: alpha(palette.bg, 0.55),
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 3,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${alpha(palette.accent, 0.45)}`,
            boxShadow: `0 0 40px ${alpha(palette.accent, 0.12)}, 0 24px 64px rgba(0,0,0,0.45)`,
            p: { xs: 2.5, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <CircularProgress
              size={28}
              thickness={4}
              sx={{ color: palette.accent, flexShrink: 0 }}
            />
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                fontWeight: 700,
              }}
            >
              Game Analysis
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {engineLoading ? "Loading engine…" : "Analyzing…"}
            </Typography>
            {!engineLoading && (
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color: "#4ade80" }}
              >
                {roundedProgress}%
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: palette.surface,
              overflow: "hidden",
              mb: 2.5,
            }}
          >
            {engineLoading ? (
              <Box
                sx={{
                  height: "100%",
                  width: "40%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${palette.accent}, ${alpha(palette.accent, 0.5)})`,
                  animation: "analysisOverlayPulse 1.4s ease-in-out infinite",
                  "@keyframes analysisOverlayPulse": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(350%)" },
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, #4ade80, ${palette.accent})`,
                  transition: "width 0.35s ease",
                }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <StatRow
              label="Moves analyzed"
              value={
                totalPositions > 0
                  ? `${analyzedPositions} / ${totalPositions}`
                  : "—"
              }
            />
            <StatRow
              label="Moves remaining"
              value={totalPositions > 0 ? String(remainingPositions) : "—"}
              valueColor="#fbbf24"
            />
            <StatRow
              label="Elapsed time"
              value={formatDuration(elapsedSeconds)}
            />
            <StatRow
              label="Estimated time remaining"
              value={
                estimatedRemainingSeconds !== null
                  ? formatDuration(estimatedRemainingSeconds)
                  : engineLoading
                    ? "—"
                    : "Calculating…"
              }
              valueColor="#4ade80"
            />
          </Box>

          <Box
            sx={{
              mt: 2.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: palette.surface,
              border: `1px solid ${palette.border}`,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}
            >
              <Icon
                icon="mdi:robot-outline"
                width={18}
                color={palette.accent}
              />
              <Typography variant="body2" color="text.secondary">
                {engineLoading
                  ? `Loading ${engineLabel}…`
                  : `${engineLabel} analyzing…`}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Icon
                icon="mdi:chart-timeline-variant"
                width={18}
                color={alpha(palette.accent, 0.85)}
              />
              <Typography
                variant="caption"
                sx={{ color: alpha(palette.accent, 0.9) }}
              >
                Real-time progress
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              mt: 2,
              color: palette.textMuted,
            }}
          >
            <Icon icon="mdi:target" width={14} />
            Master every move, unlock your chess potential.
          </Typography>
        </Box>
      </Box>
    </Portal>
  );
}

function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: valueColor ?? "text.primary" }}
      >
        {value}
      </Typography>
    </Box>
  );
}
