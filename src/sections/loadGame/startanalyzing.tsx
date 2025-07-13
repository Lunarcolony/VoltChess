import { Button, Typography } from "@mui/material";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
import { Chess } from "chess.js";

interface Props {
  setGame?: (game: Chess) => Promise<void>;
  label?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadGameButton({ setGame, label, size }: Props) {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        size={size}
        sx={{
          background: "linear-gradient(135deg, #3b9ac6, #1de9b6)",
          paddingX: 5,
          paddingY: 2.2,
          fontSize: "1.1rem",
          fontWeight: 600,
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textTransform: "none",
          transition: "all 0.25s ease-in-out",
          ":hover": {
            transform: "scale(1.05)",
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3)",
            background: "linear-gradient(135deg, #2e88b0, #19c7a1)",
          },
        }}
      >
        <Typography fontSize="0.95em" fontWeight="600" lineHeight="1.4em">
          {label || "Add Game"}
        </Typography>
      </Button>

      <NewGameDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        setGame={setGame}
      />
    </>
  );
}
