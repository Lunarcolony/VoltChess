import {
  Box,
  CircularProgress,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { usePalette } from "@/hooks/usePalette";
import GameReviewCard from "@/components/GameReviewCard";
import type { LoadedGame } from "@/types/game";
import type { OnboardingPlatform } from "./constants";

interface Props {
  username: string;
  platform: OnboardingPlatform;
  games: LoadedGame[] | undefined;
  loading: boolean;
  error: string;
  onSelectGame: (game: LoadedGame) => void;
  onBack: () => void;
}

export default function GameReviewGrid({
  username,
  platform,
  games,
  loading,
  error,
  onSelectGame,
  onBack,
}: Props) {
  const palette = usePalette();
  const platformLabel = platform === "chesscom" ? "Chess.com" : "Lichess";
  const profileUrl =
    platform === "chesscom"
      ? `https://www.chess.com/member/${encodeURIComponent(username)}`
      : `https://lichess.org/@/${encodeURIComponent(username)}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton
          size="small"
          onClick={onBack}
          aria-label="Back"
          sx={{ color: palette.textMuted, ml: -0.5 }}
        >
          <Icon icon="mdi:arrow-left" width={20} />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Search another player
        </Typography>
      </Box>

      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
          fontWeight: 800,
          mb: 0.75,
          color: palette.text,
        }}
      >
        Chess Review
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Latest games from{" "}
        <Link
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: palette.accent, fontWeight: 600 }}
        >
          {username}
        </Link>{" "}
        on {platformLabel}
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: palette.accent }} />
          <Typography color="text.secondary">Loading your games…</Typography>
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2" sx={{ py: 2 }}>
          {error}
        </Typography>
      ) : !games?.length ? (
        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
          No recent games found for this username.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: { xs: 1.5, sm: 2 },
            maxHeight: { xs: "55vh", sm: "60vh" },
            overflowY: "auto",
            pr: 0.5,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: palette.border,
              borderRadius: 3,
            },
          }}
        >
          {games.map((game) => (
            <GameReviewCard
              key={game.id}
              game={game}
              username={username}
              onClick={() => onSelectGame(game)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
