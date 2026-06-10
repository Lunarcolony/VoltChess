import { Button } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { palette } from "@/theme/voltchessTheme";

export default function FollowBestLineButton() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);
  const { addMoves } = useChessActions(boardAtom);

  const bestLine = position?.eval?.lines?.[0]?.pv;
  const disabled = !bestLine?.length || board.isGameOver();

  const handleClick = () => {
    if (!bestLine?.length) return;
    addMoves(bestLine);
  };

  return (
    <Button
      fullWidth
      disabled={disabled}
      onClick={handleClick}
      startIcon={<Icon icon="mdi:chevron-double-right" width={18} />}
      sx={{
        mb: 1.5,
        py: 1,
        borderRadius: 1.5,
        bgcolor: palette.accent,
        color: "#0a0a0a",
        fontWeight: 700,
        fontSize: "0.85rem",
        textTransform: "none",
        "&:hover": { bgcolor: palette.accentHover },
        "&.Mui-disabled": {
          bgcolor: "rgba(232, 185, 35, 0.25)",
          color: "rgba(10, 10, 10, 0.4)",
        },
      }}
    >
      Follow Best Line
    </Button>
  );
}
