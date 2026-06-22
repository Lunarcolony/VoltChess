import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useMediaQuery,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Chess } from "chess.js";
import { usePalette } from "@/hooks/usePalette";
import { GameOrigin } from "@/types/enums";
import type { LoadedGame } from "@/types/game";
import type { OnboardingPlatform } from "./constants";
import GameReviewGrid from "./GameReviewGrid";
import { loadedGameToChess, loadGamesForUser } from "./loadOnboardingGame";
import {
  getStoredUsername,
  markOnboardingComplete,
  saveUsername,
} from "./onboardingStorage";

type ModalStep = "welcome" | "username" | "games" | "loading";

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
  const isMobile = useMediaQuery("(max-width:600px)");
  const storedUser = useMemo(() => (open ? getStoredUsername() : null), [open]);
  const [step, setStep] = useState<ModalStep>("welcome");
  const [tab, setTab] = useState<GameOrigin>(GameOrigin.ChessCom);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<LoadedGame[] | undefined>();
  const [gamesPlatform, setGamesPlatform] =
    useState<OnboardingPlatform>("chesscom");
  const fetchAbortRef = useRef<AbortController | null>(null);

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
    setGames(undefined);
  }, [open, storedUser]);

  const activePlatform: OnboardingPlatform =
    tab === GameOrigin.Lichess ? "lichess" : "chesscom";

  const fetchGames = useCallback(
    async (user: string, userPlatform: OnboardingPlatform) => {
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      setError("");
      setLoading(true);
      setStep("games");
      setGames(undefined);
      setGamesPlatform(userPlatform);
      setUsername(user);

      try {
        const loaded = await loadGamesForUser(
          user,
          userPlatform,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setGames(loaded);
      } catch (e) {
        if (controller.signal.aborted) return;
        const isStoredUserLoad =
          !!storedUser &&
          user.trim().toLowerCase() === storedUser.username.toLowerCase() &&
          userPlatform === storedUser.platform;
        setStep(isStoredUserLoad ? "welcome" : "username");
        setError(
          e instanceof Error ? e.message : "Could not load games. Try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [storedUser]
  );

  const selectGame = async (game: LoadedGame) => {
    setError("");
    setLoading(true);
    setStep("loading");

    try {
      const { game: chessGame, boardOrientation } = loadedGameToChess(
        game,
        username
      );
      saveUsername(username, gamesPlatform);
      onGameLoaded(chessGame, boardOrientation);
    } catch (e) {
      setStep("games");
      setError(
        e instanceof Error ? e.message : "Could not load that game. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    fetchAbortRef.current?.abort();
    markOnboardingComplete();
    onClose();
  };

  const displayName = username.trim() || "Player";
  const initial = displayName.charAt(0).toUpperCase();
  const isGamesStep = step === "games";

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      fullWidth
      maxWidth={isGamesStep ? "lg" : "xs"}
      fullScreen={isGamesStep && isMobile}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isGamesStep
              ? "rgba(0, 0, 0, 0.72)"
              : "rgba(0, 0, 0, 0.85)",
            backdropFilter: isGamesStep ? "blur(8px)" : "none",
          },
        },
        paper: {
          sx: {
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: isGamesStep ? { xs: 0, sm: 3 } : 3,
            overflow: "visible",
            mx: isGamesStep ? { xs: 0, sm: 2 } : 2,
            maxHeight: isGamesStep ? { xs: "100dvh", sm: "90vh" } : undefined,
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
            zIndex: 1,
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
            <Typography color="text.secondary">Loading your game…</Typography>
          </Box>
        ) : step === "games" ? (
          <GameReviewGrid
            username={username}
            platform={gamesPlatform}
            games={games}
            loading={loading}
            error={error}
            onSelectGame={(game) => void selectGame(game)}
            onBack={() => {
              setError("");
              setGames(undefined);
              setStep(storedUser ? "welcome" : "username");
            }}
          />
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
              onClick={() =>
                void fetchGames(storedUser.username, storedUser.platform)
              }
              sx={{
                py: 1.35,
                borderRadius: 2,
                fontSize: "1rem",
                bgcolor: palette.accent,
                color: palette.bg,
                "&:hover": { bgcolor: palette.accentHover },
              }}
            >
              Yes, show my games
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
              We&apos;ll fetch your recent games so you can pick one to analyze.
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
                  void fetchGames(username, activePlatform);
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
              onClick={() => void fetchGames(username, activePlatform)}
              sx={{
                py: 1.35,
                borderRadius: 2,
                bgcolor: palette.accent,
                color: palette.bg,
                "&:hover": { bgcolor: palette.accentHover },
              }}
            >
              Find my games
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
