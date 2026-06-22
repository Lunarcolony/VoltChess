import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { usePalette } from "@/hooks/usePalette";
import type { LoadedGame } from "@/types/game";

export type UserGameResult = "win" | "loss" | "draw" | "unknown";

interface Props {
  game: LoadedGame;
  username: string;
  onClick: () => void;
  analysisLabel?: string;
}

export function getUserGameResult(
  game: LoadedGame,
  username: string
): UserGameResult {
  const userLower = username.trim().toLowerCase();
  const isWhite = game.white.name.toLowerCase() === userLower;
  const isBlack = game.black.name.toLowerCase() === userLower;

  if (!isWhite && !isBlack) return "unknown";
  if (game.result === "1/2-1/2") return "draw";
  if (game.result === "1-0") return isWhite ? "win" : "loss";
  if (game.result === "0-1") return isBlack ? "win" : "loss";
  return "unknown";
}

const RESULT_META: Record<
  UserGameResult,
  { label: string; color: string; icon: string }
> = {
  win: { label: "Win", color: "#4ade80", icon: "mdi:trophy" },
  loss: { label: "Loss", color: "#f87171", icon: "mdi:close-circle-outline" },
  draw: { label: "Draw", color: "#fbbf24", icon: "mdi:approximately-equal" },
  unknown: {
    label: "Game",
    color: "#94a3b8",
    icon: "mdi:chess-pawn",
  },
};

function formatPlayerName(player: LoadedGame["white"]) {
  return player.title ? `${player.title} ${player.name}` : player.name;
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function GameReviewCard({
  game,
  username,
  onClick,
  analysisLabel = "No analysis",
}: Props) {
  const palette = usePalette();
  const result = getUserGameResult(game, username);
  const meta = RESULT_META[result];
  const isRated = (game.white.rating ?? 0) > 0 || (game.black.rating ?? 0) > 0;

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        textAlign: "left",
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: alpha(meta.color, 0.06),
        border: `1px solid ${alpha(meta.color, 0.45)}`,
        transition:
          "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(meta.color, 0.15)}`,
          borderColor: alpha(meta.color, 0.7),
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}
        >
          <Icon icon={meta.icon} width={18} color={meta.color} />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ color: meta.color }}
            noWrap
          >
            {meta.label}
          </Typography>
        </Box>
        {isRated && (
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: alpha(palette.accent, 0.15),
              border: `1px solid ${alpha(palette.accent, 0.35)}`,
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ color: palette.accent, fontSize: "0.7rem" }}
            >
              Rated
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.5 }}
      >
        <PlayerRow
          color="white"
          name={formatPlayerName(game.white)}
          rating={game.white.rating}
        />
        <PlayerRow
          color="black"
          name={formatPlayerName(game.black)}
          rating={game.black.rating}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.25,
          mb: 1.25,
          color: palette.textMuted,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Icon icon="mdi:calendar-outline" width={15} />
          <Typography variant="caption">{formatDate(game.date)}</Typography>
        </Box>
        {game.timeControl && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Icon icon="mdi:timer-outline" width={15} />
            <Typography variant="caption">{game.timeControl}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "auto" }}>
        <Icon
          icon="mdi:chart-line-variant"
          width={15}
          color={palette.textMuted}
        />
        <Typography variant="caption" color="text.secondary">
          {analysisLabel}
        </Typography>
      </Box>
    </Box>
  );
}

function PlayerRow({
  color,
  name,
  rating,
}: {
  color: "white" | "black";
  name: string;
  rating?: number;
}) {
  const palette = usePalette();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: color === "white" ? palette.playerLightBg : "transparent",
          border:
            color === "black" ? `2px solid ${palette.playerLightBg}` : "none",
        }}
      />
      <Typography
        variant="body2"
        fontWeight={600}
        noWrap
        sx={{ color: palette.text, flex: 1, minWidth: 0 }}
      >
        {name}
        {rating ? (
          <Typography
            component="span"
            variant="body2"
            sx={{ color: palette.textMuted, fontWeight: 500, ml: 0.5 }}
          >
            ({rating})
          </Typography>
        ) : null}
      </Typography>
    </Box>
  );
}
