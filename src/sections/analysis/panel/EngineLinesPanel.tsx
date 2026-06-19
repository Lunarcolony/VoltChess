import { Box, Skeleton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom, engineMultiPvAtom } from "../states";
import { getLineEvalLabel, moveLineUciToSan } from "@/lib/chess";
import { useChessActions } from "@/hooks/useChessActions";
import { LineEval } from "@/types/eval";
import { usePalette } from "@/hooks/usePalette";
import PrettyMoveSan from "@/components/prettyMoveSan";

function EngineLineRow({ line, isBest }: { line: LineEval; isBest: boolean }) {
  const palette = usePalette();
  const board = useAtomValue(boardAtom);
  const { addMoves } = useChessActions(boardAtom);
  const showSkeleton = line.depth < 6;
  const lineLabel = getLineEvalLabel(line);
  const isBlackCp =
    (line.cp !== undefined && line.cp < 0) ||
    (line.mate !== undefined && line.mate < 0);
  const uciToSan = moveLineUciToSan(board.fen());
  const turn = board.turn();
  const firstSan = line.pv[0] ? uciToSan(line.pv[0]) : "";

  const getColorFromMoveIdx = (moveIdx: number): "w" | "b" => {
    return moveIdx % 2 === 0 ? turn : turn === "w" ? "b" : "w";
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1,
        py: 0.85,
        borderRadius: 1,
        mb: 0.5,
        bgcolor: isBest ? "rgba(34, 172, 56, 0.08)" : "transparent",
        border: isBest
          ? "1px solid rgba(34, 172, 56, 0.25)"
          : "1px solid transparent",
        "&:hover": { bgcolor: palette.surface },
      }}
    >
      {isBest ? (
        <Icon
          icon="mdi:crown"
          width={18}
          color={palette.accent}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
      ) : (
        <Box sx={{ width: 18, flexShrink: 0 }} />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
          }}
        >
          {showSkeleton ? (
            <Skeleton width={60} height={20} />
          ) : (
            <>
              <Typography fontWeight={700} fontSize="0.9rem">
                {firstSan}
              </Typography>
              <Typography
                sx={{
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 0.75,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  bgcolor: isBlackCp
                    ? palette.playerDarkBg
                    : palette.playerLightBg,
                  color: isBlackCp
                    ? palette.playerDarkText
                    : palette.playerLightText,
                  border: `1px solid ${palette.border}`,
                }}
              >
                {lineLabel}
              </Typography>
              {isBest && (
                <Typography
                  fontSize="0.75rem"
                  sx={{ color: "#22ac38", fontWeight: 600 }}
                >
                  is best
                </Typography>
              )}
            </>
          )}
        </Box>

        {!showSkeleton && line.pv.length > 1 && (
          <Typography
            noWrap
            fontSize="0.78rem"
            color="text.secondary"
            sx={{ mt: 0.35, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {line.pv.slice(1).map((uci, i) => {
              const san = uciToSan(uci);
              const moveColor = getColorFromMoveIdx(i + 1);
              return (
                <PrettyMoveSan
                  key={i}
                  san={san}
                  color={moveColor}
                  additionalText={i < line.pv.length - 2 ? ", " : ""}
                  boxProps={{
                    component: "span",
                    onClick: () => addMoves(line.pv.slice(0, i + 2)),
                    sx: {
                      cursor: "pointer",
                      "&:hover": { opacity: 0.7 },
                    },
                  }}
                />
              );
            })}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function EngineLinesPanel() {
  const palette = usePalette();
  const board = useAtomValue(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const linesNumber = useAtomValue(engineMultiPvAtom);

  if (board.isCheckmate()) return null;

  const linesSkeleton: LineEval[] = Array.from({ length: linesNumber }).map(
    (_, i) => ({ pv: [`${i}`], depth: 0, multiPv: i + 1 })
  );

  const engineLines = position?.eval?.lines?.length
    ? position.eval.lines
    : linesSkeleton;

  return (
    <Box
      sx={{
        mb: 1.5,
        flexShrink: 0,
        maxHeight: { xs: 150, sm: 176 },
        overflowY: "auto",
        pr: 0.25,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: palette.border,
          borderRadius: 2,
        },
      }}
    >
      {engineLines.map((line, idx) => (
        <EngineLineRow key={line.multiPv} line={line} isBest={idx === 0} />
      ))}
    </Box>
  );
}
