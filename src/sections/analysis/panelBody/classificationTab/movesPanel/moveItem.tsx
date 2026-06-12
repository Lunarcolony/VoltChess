import { MoveClassification } from "@/types/enums";
import { Grid2 as Grid } from "@mui/material";

import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom, gameAtom } from "../../../states";
import { useChessActions } from "@/hooks/useChessActions";
import { useEffect, useRef } from "react";
import { CLASSIFICATION_COLORS } from "@/constants";
import PrettyMoveSan from "@/components/prettyMoveSan";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

interface Props {
  san: string;
  moveClassification?: MoveClassification;
  moveIdx: number;
  moveColor: "w" | "b";
}

export default function MoveItem({
  san,
  moveClassification,
  moveIdx,
  moveColor,
}: Props) {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const { goToMove } = useChessActions(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const palette = usePalette();
  const color = getMoveColor(moveClassification);

  const isCurrentMove = position?.currentMoveIdx === moveIdx;

  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCurrentMove) return;
    const moveItem = itemRef.current;
    if (!moveItem) return;
    const movePanel = document.getElementById("moves-panel");
    if (!movePanel) return;
    // Manual scroll: only scroll the moves panel, not the whole page
    const panelRect = movePanel.getBoundingClientRect();
    const offsetTop = moveItem.offsetTop;
    const offsetBottom = offsetTop + moveItem.offsetHeight;
    if (offsetTop < movePanel.scrollTop) {
      movePanel.scrollTop =
        offsetTop - panelRect.height / 2 + moveItem.offsetHeight / 2;
    } else if (offsetBottom > movePanel.scrollTop + panelRect.height) {
      movePanel.scrollTop =
        offsetBottom - panelRect.height / 2 - moveItem.offsetHeight / 2;
    }
  }, [isCurrentMove, moveIdx]);

  const handleClick = () => {
    if (isCurrentMove) return;
    const gameToUse = game.moveNumber() > 1 ? game : board;
    goToMove(moveIdx, gameToUse);
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={1}
      width={{ xs: "4.5rem", sm: "5rem" }}
      wrap="nowrap"
      onClick={handleClick}
      paddingY={0.5}
      sx={{
        cursor: isCurrentMove ? undefined : "pointer",
        backgroundColor: isCurrentMove
          ? alpha(palette.accent, 0.15)
          : undefined,
        border: isCurrentMove
          ? `1px solid ${alpha(palette.accent, 0.4)}`
          : undefined,
        borderRadius: 1,
      }}
      id={`move-${moveIdx}`}
      ref={itemRef}
    >
      {color && (
        <img
          src={`/icons/${moveClassification}.png`}
          alt="move-icon"
          width={14}
          height={14}
          style={{
            maxWidth: "3.5vw",
            maxHeight: "3.5vw",
          }}
        />
      )}

      <PrettyMoveSan
        san={san}
        color={moveColor}
        typographyProps={{ fontSize: "0.9rem" }}
      />
    </Grid>
  );
}

const getMoveColor = (moveClassification?: MoveClassification) => {
  if (
    !moveClassification ||
    moveClassificationsToIgnore.includes(moveClassification)
  ) {
    return undefined;
  }

  return CLASSIFICATION_COLORS[moveClassification];
};

const moveClassificationsToIgnore: MoveClassification[] = [
  MoveClassification.Okay,
  MoveClassification.Excellent,
  MoveClassification.Forced,
];
