import { Button } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { usePalette } from "@/hooks/usePalette";
import { accentContainedButtonSx } from "@/theme/buttonStyles";

export default function FollowBestLineButton() {
  const palette = usePalette();
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
        fontSize: "0.85rem",
        ...accentContainedButtonSx(palette),
      }}
    >
      Follow Best Line
    </Button>
  );
}
