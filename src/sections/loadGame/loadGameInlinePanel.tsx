import { useCallback, useState } from "react";
import { Chess } from "chess.js";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useSetAtom } from "jotai";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePalette } from "@/hooks/usePalette";
import { GameOrigin } from "@/types/enums";
import { boardOrientationAtom } from "@/sections/analysis/states";
import ChessComInput from "./chessComInput";
import LichessInput from "./lichessInput";
import GamePgnInput from "./gamePgnInput";
import { getGameFromPgn } from "@/lib/chess";

interface Props {
  onLoadGame: (game: Chess) => void | Promise<void>;
  title?: string;
  /** Expand to fill the side panel; game list scrolls inside. */
  fillHeight?: boolean;
}

const gameOriginLabel: Record<GameOrigin, string> = {
  [GameOrigin.ChessCom]: "Chess.com",
  [GameOrigin.Lichess]: "Lichess",
  [GameOrigin.Pgn]: "PGN",
};

export default function LoadGameInlinePanel({
  onLoadGame,
  title = "Load a game",
  fillHeight = false,
}: Props) {
  const palette = usePalette();
  const [gameOrigin, setGameOrigin] = useLocalStorage(
    "preferred-game-origin",
    GameOrigin.ChessCom
  );
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const [pgn, setPgn] = useState("");

  const handlePgn = useCallback(
    async (rawPgn: string, boardOrientation?: boolean) => {
      const game = getGameFromPgn(rawPgn);
      setBoardOrientation(boardOrientation ?? true);
      await onLoadGame(game);
    },
    [onLoadGame, setBoardOrientation]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        height: fillHeight ? "100%" : undefined,
        mb: fillHeight ? 0 : 2,
        borderRadius: 1.5,
        border: `1px dashed ${palette.border}`,
        bgcolor: palette.surface,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: 1.5,
          pt: 1.5,
          pb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel id="inline-game-origin">Platform</InputLabel>
          <Select
            labelId="inline-game-origin"
            value={gameOrigin ?? GameOrigin.ChessCom}
            label="Platform"
            input={<OutlinedInput label="Platform" />}
            onChange={(e) => setGameOrigin(e.target.value as GameOrigin)}
          >
            {Object.entries(gameOriginLabel).map(([origin, label]) => (
              <MenuItem key={origin} value={origin}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          flex: fillHeight ? 1 : undefined,
          minHeight: fillHeight ? 0 : undefined,
          display: "flex",
          flexDirection: "column",
          px: 1.5,
          pt: fillHeight ? 1.25 : 0.5,
          pb: 1,
          overflow: "visible",
        }}
      >
        {gameOrigin === GameOrigin.ChessCom && (
          <ChessComInput
            fullWidth
            fillHeight={fillHeight}
            onSelect={handlePgn}
          />
        )}
        {gameOrigin === GameOrigin.Lichess && (
          <LichessInput
            fullWidth
            fillHeight={fillHeight}
            onSelect={handlePgn}
          />
        )}
        {gameOrigin === GameOrigin.Pgn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <GamePgnInput pgn={pgn} setPgn={setPgn} />
            <Typography
              component="button"
              type="button"
              variant="body2"
              fontWeight={600}
              onClick={() => pgn && void handlePgn(pgn)}
              sx={{
                alignSelf: "flex-start",
                border: "none",
                bgcolor: "transparent",
                color: palette.accent,
                cursor: pgn ? "pointer" : "not-allowed",
                opacity: pgn ? 1 : 0.5,
                p: 0,
              }}
            >
              Load PGN
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
