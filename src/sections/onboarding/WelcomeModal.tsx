import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Link,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Chess } from "chess.js";
import { usePalette } from "@/hooks/usePalette";
import { GameOrigin } from "@/types/enums";
import type { OnboardingPlatform } from "./constants";
import { loadFirstGameForUser } from "./loadOnboardingGame";
import {
  getStoredUsername,
  markOnboardingComplete,
  saveUsername,
} from "./onboardingStorage";

type ModalStep = "welcome" | "username" | "loading";

interface Props {
  open: boolean;
  onClose: () => void;
  onGameLoaded: (game: Chess, boardOrientation: boolean) => void;
}

const PLATFORM_TABS = [
  {
    value: GameOrigin.ChessCom,
    label: "Chess.com",
    platform: "chesscom" as const,
  },
  { value: GameOrigin.Lichess, label: "Lichess", platform: "lichess" as const },
] as const;

function PlatformBadge({ platform }: { platform: OnboardingPlatform }) {
  const palette = usePalette();
  const isChessCom = platform === "chesscom";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: isChessCom
          ? "rgba(34, 172, 56, 0.15)"
          : "rgba(255, 255, 255, 0.08)",
        border: `1px solid ${isChessCom ? "rgba(34, 172, 56, 0.45)" : palette.border}`,
        color: isChessCom ? "#4ade80" : palette.text,
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      <Icon icon={isChessCom ? "mdi:chess-pawn" : "mdi:horse"} width={16} />
      {isChessCom ? "Chess.com" : "Lichess"}
    </Box>
  );
}

export default function WelcomeModal({ open, onClose, onGameLoaded }: Props) {
  const palette = usePalette();
  const storedUser = useMemo(() => (open ? getStoredUsername() : null), [open]);
  const [step, setStep] = useState<ModalStep>("welcome");
  const [tab, setTab] = useState<GameOrigin>(GameOrigin.ChessCom);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (storedUser) {
      setStep("welcome");
      setUsername(storedUser.username);
      setTab(
        storedUser.platform === "chesscom"
          ? GameOrigin.ChessCom
          : GameOrigin.Lichess
      );
    } else {
      setStep("username");
      setUsername("");
      setTab(GameOrigin.ChessCom);
    }
    setError("");
    setLoading(false);
  }, [open, storedUser]);

  const activePlatform: OnboardingPlatform =
    tab === GameOrigin.Lichess ? "lichess" : "chesscom";

  const loadGame = async (user: string, userPlatform: OnboardingPlatform) => {
    setError("");
    setLoading(true);
    setStep("loading");

    try {
      const { game, boardOrientation } = await loadFirstGameForUser(
        user,
        userPlatform
      );
      saveUsername(user, userPlatform);
      onGameLoaded(game, boardOrientation);
    } catch (e) {
      const isStoredUserLoad =
        !!storedUser &&
        user.trim().toLowerCase() === storedUser.username.toLowerCase() &&
        userPlatform === storedUser.platform;
      setStep(isStoredUserLoad ? "welcome" : "username");
      setError(
        e instanceof Error ? e.message : "Could not load a game. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    onClose();
  };

  const displayName = username.trim() || "Player";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.85)" } },
        paper: {
          sx: {
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            overflow: "visible",
            mx: 2,
          },
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 }, position: "relative" }}>
        <Button
          size="small"
          onClick={handleSkip}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: palette.textMuted,
            fontSize: "0.75rem",
          }}
        >
          Skip
        </Button>

        {step === "loading" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
              gap: 2,
            }}
          >
            <CircularProgress sx={{ color: palette.accent }} />
            <Typography color="text.secondary">
              Loading your latest game…
            </Typography>
          </Box>
        ) : step === "welcome" && storedUser ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: palette.surface,
                  border: `1px solid ${palette.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  icon="mdi:chess-knight"
                  width={26}
                  color={palette.accent}
                />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  bgcolor: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  px: 1.75,
                  py: 1.25,
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: -6,
                    top: 14,
                    width: 12,
                    height: 12,
                    bgcolor: palette.surface,
                    borderLeft: `1px solid ${palette.border}`,
                    borderBottom: `1px solid ${palette.border}`,
                    transform: "rotate(45deg)",
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, color: palette.text }}>
                  Is that you?
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: 2.5,
                  bgcolor: palette.surface,
                  border: `2px solid ${palette.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "2.25rem",
                    fontWeight: 700,
                    color: palette.accent,
                    lineHeight: 1,
                  }}
                >
                  {initial}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <PlatformBadge platform={storedUser.platform} />
              </Box>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: palette.text,
                  textAlign: "center",
                  wordBreak: "break-word",
                }}
              >
                {storedUser.username}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              onClick={() => loadGame(storedUser.username, storedUser.platform)}
              sx={{
                py: 1.35,
                borderRadius: 2,
                fontSize: "1rem",
                bgcolor: palette.accent,
                color: palette.bg,
                "&:hover": { bgcolor: palette.accentHover },
              }}
            >
              Yes, analyze my games
            </Button>

            <Box sx={{ textAlign: "center", mt: 1.5 }}>
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => {
                  setStep("username");
                  setError("");
                }}
                sx={{ color: palette.textMuted, fontSize: "0.875rem" }}
              >
                Use a different username
              </Link>
            </Box>
          </>
        ) : (
          <>
            <Typography
              variant="h2"
              sx={{ fontSize: "1.25rem", mb: 0.75, color: palette.text }}
            >
              Enter your username
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We&apos;ll load your most recent game and show you how analysis
              works.
            </Typography>

            <Tabs
              value={tab}
              onChange={(_, value: GameOrigin) => setTab(value)}
              sx={{
                minHeight: 40,
                mb: 2,
                borderBottom: `1px solid ${palette.border}`,
                "& .MuiTab-root": {
                  minHeight: 40,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: palette.textMuted,
                  "&.Mui-selected": { color: palette.accent },
                },
              }}
            >
              {PLATFORM_TABS.map(({ value, label }) => (
                <Tab key={value} value={value} label={label} />
              ))}
            </Tabs>

            <TextField
              fullWidth
              label={
                activePlatform === "chesscom"
                  ? "Chess.com username"
                  : "Lichess username"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim()) {
                  loadGame(username, activePlatform);
                }
              }}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!username.trim() || loading}
              onClick={() => loadGame(username, activePlatform)}
              sx={{
                py: 1.35,
                borderRadius: 2,
                bgcolor: palette.accent,
                color: palette.bg,
                "&:hover": { bgcolor: palette.accentHover },
              }}
            >
              Analyze my latest game
            </Button>

            {storedUser && (
              <Box sx={{ textAlign: "center", mt: 1.5 }}>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => {
                    setStep("welcome");
                    setUsername(storedUser.username);
                    setError("");
                  }}
                  sx={{ color: palette.textMuted, fontSize: "0.875rem" }}
                >
                  Back to saved username
                </Link>
              </Box>
            )}
          </>
        )}
      </Box>
    </Dialog>
  );
}
