import { useEffect, useState } from "react";
import { Alert, Box, Button, Snackbar, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Chess } from "chess.js";
import { setContext as setSentryContext } from "@sentry/react";
import { useSetAtom } from "jotai";
import { alpha } from "@mui/material/styles";
import { getGameFromPgn } from "@/lib/chess";
import { GameOrigin } from "@/types/enums";
import { boardOrientationAtom } from "@/sections/analysis/states";
import { SAMPLE_GAME_PGN } from "@/data/sampleGame";
import GamePgnInput from "@/sections/loadGame/gamePgnInput";
import GameFenInput, { fenToPgn } from "@/sections/loadGame/gameFenInput";
import PlatformTabs from "@/sections/loadGame/PlatformTabs";
import UsernameGameSearch from "@/sections/loadGame/UsernameGameSearch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePalette } from "@/hooks/usePalette";

export type PlatformGameLoaderVariant = "home" | "inline";

interface Props {
  onGameLoaded: (game: Chess, boardOrientation?: boolean) => void;
  defaultTab?: GameOrigin;
  showSampleGame?: boolean;
  variant?: PlatformGameLoaderVariant;
  title?: string;
  fillHeight?: boolean;
}

const QUICK_USERS = ["MagnusCarlsen", "GothamChess", "Hikaru"];

export default function PlatformGameLoader({
  onGameLoaded,
  defaultTab = GameOrigin.ChessCom,
  showSampleGame = true,
  variant = "home",
  title,
  fillHeight = false,
}: Props) {
  const palette = usePalette();
  const isHome = variant === "home";
  const [storedTab, setStoredTab] = useLocalStorage(
    "preferred-game-origin",
    defaultTab
  );
  const [tab, setTab] = useState<GameOrigin>(defaultTab);
  const activeTab = isHome ? tab : (storedTab ?? defaultTab);

  const handleTabChange = (next: GameOrigin) => {
    if (isHome) {
      setTab(next);
    } else {
      setStoredTab(next);
    }
  };
  const [pgn, setPgn] = useState("");
  const [fen, setFen] = useState("");
  const [chessComUser, setChessComUser] = useState("");
  const [error, setError] = useState("");
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  useEffect(() => {
    if (isHome) {
      setTab(defaultTab);
    }
  }, [defaultTab, isHome]);

  const loadGame = (pgnText: string, boardOrientation = true) => {
    if (!pgnText) return;

    try {
      const game = getGameFromPgn(pgnText);
      setSentryContext("loadedGame", { pgn: pgnText });
      setBoardOrientation(boardOrientation);
      onGameLoaded(game, boardOrientation);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Invalid PGN. Please check the input."
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        borderRadius: isHome ? 3 : 2,
        border: `1px solid ${palette.border}`,
        bgcolor: palette.surfaceRaised,
        overflow: "hidden",
        boxShadow: isHome
          ? `0 24px 64px ${alpha(palette.bg, 0.35)}`
          : undefined,
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: isHome ? 3 : 1.5 },
          pt: { xs: 2, sm: isHome ? 3 : 1.5 },
          pb: 1.5,
          borderBottom: `1px solid ${palette.borderSubtle}`,
          background: isHome
            ? `linear-gradient(180deg, ${alpha(palette.accent, 0.05)} 0%, transparent 100%)`
            : undefined,
        }}
      >
        {title ? (
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1.25, color: palette.text }}
          >
            {title}
          </Typography>
        ) : isHome ? (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(palette.accent, 0.12),
                  color: palette.accent,
                }}
              >
                <Icon icon="mdi:chart-timeline-variant" width={20} />
              </Box>
              <Box>
                <Typography
                  variant="h2"
                  sx={{ fontSize: "1.15rem", fontWeight: 800 }}
                >
                  Analyze a game
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stockfish review in your browser — free, no sign-up
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : null}

        <PlatformTabs
          value={activeTab}
          onChange={handleTabChange}
          compact={!isHome}
        />
      </Box>

      <Box
        sx={{
          p: { xs: 2, sm: isHome ? 3 : 1.5 },
          flex: fillHeight ? 1 : undefined,
          minHeight: fillHeight ? 0 : undefined,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeTab === GameOrigin.ChessCom && (
          <UsernameGameSearch
            platform="chesscom"
            presetUsername={chessComUser}
            onSelect={loadGame}
            variant={isHome ? "home" : "inline"}
            fillHeight={fillHeight}
          />
        )}

        {activeTab === GameOrigin.Lichess && (
          <UsernameGameSearch
            platform="lichess"
            onSelect={loadGame}
            variant={isHome ? "home" : "inline"}
            fillHeight={fillHeight}
          />
        )}

        {activeTab === GameOrigin.Pgn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Paste a PGN or upload a file to analyze any game.
            </Typography>
            <GamePgnInput pgn={pgn} setPgn={setPgn} />
            <Button
              variant="contained"
              fullWidth
              disabled={!pgn.trim()}
              onClick={() => loadGame(pgn)}
              sx={{
                py: 1.25,
                borderRadius: 2,
                bgcolor: palette.accent,
                color: palette.onAccent,
                fontWeight: 700,
              }}
            >
              Analyze game
            </Button>
          </Box>
        )}

        {activeTab === GameOrigin.Fen && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <GameFenInput fen={fen} setFen={setFen} />
            <Button
              variant="contained"
              fullWidth
              disabled={!fen.trim()}
              onClick={() => {
                try {
                  loadGame(fenToPgn(fen.trim()));
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Invalid FEN. Please check the input."
                  );
                }
              }}
              sx={{
                py: 1.25,
                borderRadius: 2,
                bgcolor: palette.accent,
                color: palette.onAccent,
                fontWeight: 700,
              }}
            >
              Analyze position
            </Button>
          </Box>
        )}

        {isHome && activeTab === GameOrigin.ChessCom && showSampleGame && (
          <Box
            sx={{
              mt: 3,
              pt: 2.5,
              borderTop: `1px solid ${palette.borderSubtle}`,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: "block",
                mb: 1.25,
                color: palette.textMuted,
                letterSpacing: "0.08em",
              }}
            >
              Quick start
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              {QUICK_USERS.map((user) => (
                <Button
                  key={user}
                  size="small"
                  variant="outlined"
                  onClick={() => setChessComUser(user)}
                  sx={{
                    borderRadius: 999,
                    borderColor: palette.border,
                    color: palette.text,
                    fontSize: "0.78rem",
                    px: 1.5,
                    "&:hover": {
                      borderColor: alpha(palette.accent, 0.45),
                      bgcolor: alpha(palette.accent, 0.06),
                    },
                  }}
                >
                  {user}
                </Button>
              ))}
            </Box>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => loadGame(SAMPLE_GAME_PGN)}
              startIcon={<Icon icon="mdi:chess-knight" width={18} />}
              sx={{
                py: 1.1,
                borderRadius: 2,
                borderColor: alpha(palette.accent, 0.35),
                color: palette.text,
                "&:hover": {
                  borderColor: palette.accent,
                  bgcolor: alpha(palette.accent, 0.06),
                },
              }}
            >
              Try Morphy&apos;s Opera Game
            </Button>
          </Box>
        )}
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
      >
        <Alert severity="error" variant="filled" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
