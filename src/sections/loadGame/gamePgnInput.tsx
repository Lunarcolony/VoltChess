import { FormControl, TextField, Button, Box } from "@mui/material";
import { Icon } from "@iconify/react";
import React from "react";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

interface Props {
  pgn: string;
  setPgn: (pgn: string) => void;
}

export default function GamePgnInput({ pgn, setPgn }: Props) {
  const palette = usePalette();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      setPgn(fileContent);
    };

    reader.readAsText(file);
  };

  return (
    <FormControl fullWidth>
      <TextField
        placeholder="Paste PGN here…"
        variant="outlined"
        multiline
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        minRows={8}
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: palette.bg,
            fontFamily: "monospace",
            fontSize: "0.82rem",
          },
        }}
      />
      <Box>
        <Button
          variant="outlined"
          component="label"
          startIcon={<Icon icon="mdi:upload" width={18} />}
          sx={{
            borderRadius: 2,
            borderColor: alpha(palette.accent, 0.35),
            color: palette.text,
            "&:hover": {
              borderColor: palette.accent,
              bgcolor: alpha(palette.accent, 0.06),
            },
          }}
        >
          Upload PGN file
          <input type="file" hidden accept=".pgn" onChange={handleFileChange} />
        </Button>
      </Box>
    </FormControl>
  );
}
