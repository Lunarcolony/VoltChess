import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Chess } from "chess.js";
import { setContext as setSentryContext } from "@sentry/react";
import { useSetAtom } from "jotai";
import { getGameFromPgn } from "@/lib/chess";
import { GameOrigin } from "@/types/enums";
import { boardOrientationAtom } from "@/sections/analysis/states";
import ChessComInput from "@/sections/loadGame/chessComInput";
import LichessInput from "@/sections/loadGame/lichessInput";
import GamePgnInput from "@/sections/loadGame/gamePgnInput";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

interface Props {
  onGameLoaded: (game: Chess, boardOrientation?: boolean) => void;
}

const TABS = [
  { value: GameOrigin.ChessCom, label: "Chess.com" },
  { value: GameOrigin.Lichess, label: "Lichess.org" },
  { value: GameOrigin.Pgn, label: "PGN" },
] as const;

const QUICK_USERS = ["MagnusCarlsen", "GothamChess", "Hikaru"];

export default function HomeGameLoader({ onGameLoaded }: Props) {
  const palette = usePalette();
  const cardSx = useCardSx();
  const [tab, setTab] = useState<GameOrigin>(GameOrigin.ChessCom);
  const [pgn, setPgn] = useState("");
  const [chessComUser, setChessComUser] = useState("");
  const [error, setError] = useState("");
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  const loadGame = (pgnText: string, boardOrientation = true) => {
    if (!pgnText) return;

    try {
      const game = getGameFromPgn(pgnText);
      setSentryContext("loadedGame", { pgn: pgnText });
      setBoardOrientation(boardOrientation);
      onGameLoaded(game, boardOrientation);
    } catch (e) {
      setError(
        e instanceof Error ? `${e.message}` : "Invalid PGN. Please check the input."
      );
    }
  };

  return (
    <Box sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{
          minHeight: 48,
          borderBottom: `1px solid ${palette.border}`,
          px: 2,
          "& .MuiTab-root": {
            minHeight: 48,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: palette.textMuted,
            borderRadius: "8px 8px 0 0",
            mx: 0.25,
            "&.Mui-selected": {
              color: palette.accent,
              bgcolor: alpha(palette.accent, 0.06),
            },
          },
        }}
      >
        {TABS.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} />
        ))}
      </Tabs>

      <Box sx={{ p: 3 }}>
        {tab === GameOrigin.ChessCom && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a Chess.com username to load recent games for analysis.
            </Typography>
            <ChessComInput onSelect={loadGame} presetUsername={chessComUser} />
          </>
        )}

        {tab === GameOrigin.Lichess && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a Lichess username to load recent games for analysis.
            </Typography>
            <LichessInput onSelect={loadGame} />
          </>
        )}

        {tab === GameOrigin.Pgn && (
          <>
            <GamePgnInput pgn={pgn} setPgn={setPgn} />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1.25 }}
              onClick={() => loadGame(pgn)}
              disabled={!pgn.trim()}
            >
              Analyze Game
            </Button>
          </>
        )}

        {tab === GameOrigin.ChessCom && (
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${palette.borderSubtle}` }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Try it out:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {QUICK_USERS.map((user) => (
                <Button
                  key={user}
                  size="small"
                  variant="outlined"
                  onClick={() => setChessComUser(user)}
                  sx={{
                    borderColor: palette.border,
                    color: palette.text,
                    fontSize: "0.8rem",
                    "&:hover": {
                      borderColor: palette.accent,
                      bgcolor: alpha(palette.accent, 0.06),
                    },
                  }}
                >
                  {user}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" variant="filled" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
