import { FormControl, TextField, Button, Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

interface Props {
  fen: string;
  setFen: (fen: string) => void;
}

export default function GameFenInput({ fen, setFen }: Props) {
  const palette = usePalette();
  const trimmed = fen.trim();
  let valid = false;
  try {
    if (trimmed) {
      new Chess(trimmed);
      valid = true;
    }
  } catch {
    valid = false;
  }

  return (
    <FormControl fullWidth>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Paste a FEN to analyze a single position (analysis board starts from
        that setup).
      </Typography>
      <TextField
        placeholder={DEFAULT_POSITION}
        variant="outlined"
        multiline
        value={fen}
        onChange={(e) => setFen(e.target.value)}
        minRows={3}
        error={!!trimmed && !valid}
        helperText={
          trimmed && !valid
            ? "Invalid FEN — check piece placement and fields."
            : " "
        }
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: palette.bg,
            fontFamily: "monospace",
            fontSize: "0.82rem",
          },
        }}
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:restart" width={18} />}
          onClick={() => setFen(DEFAULT_POSITION)}
          sx={{
            borderRadius: 2,
            borderColor: alpha(palette.accent, 0.35),
            color: palette.text,
          }}
        >
          Starting position
        </Button>
      </Box>
    </FormControl>
  );
}

/** Convert a FEN into a minimal PGN VoltChess can load into analysis. */
export function fenToPgn(fen: string): string {
  const chess = new Chess(fen);
  chess.setHeader("Event", "VoltChess Position");
  chess.setHeader("FEN", fen);
  chess.setHeader("SetUp", "1");
  chess.setHeader("Result", "*");
  return chess.pgn();
}
