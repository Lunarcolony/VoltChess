import { Box } from "@mui/material";
import { REPORT_COLORS } from "./reportColors";

interface Props {
  leftShare: number;
  rightShare: number;
  height?: number;
  leftColor?: string;
  rightColor?: string;
  leftOutline?: string;
  rightOutline?: string;
}

export default function SplitShareBar({
  leftShare,
  rightShare,
  height = 10,
  leftColor = REPORT_COLORS.whitePlayer,
  rightColor = REPORT_COLORS.blackPlayer,
  leftOutline = REPORT_COLORS.whitePlayerDark,
  rightOutline = REPORT_COLORS.blackPlayerDark,
}: Props) {
  const left = Math.max(0, Math.min(100, leftShare));
  const right = Math.max(0, Math.min(100, rightShare));
  const total = left + right || 1;
  const leftFlex = left / total;
  const rightFlex = right / total;
  const compact = height <= 8;

  if (compact) {
    return (
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: REPORT_COLORS.track,
          border: `1px solid ${REPORT_COLORS.barOutline}`,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
        }}
      >
        {left > 0 && (
          <Box
            sx={{
              width: `${left}%`,
              bgcolor: leftColor,
              minWidth: 2,
              boxShadow: `inset 0 0 0 1px ${leftOutline}`,
              borderRight:
                right > 0 ? "1px solid rgba(0, 0, 0, 0.5)" : undefined,
            }}
          />
        )}
        {right > 0 && (
          <Box
            sx={{
              flex: 1,
              bgcolor: rightColor,
              minWidth: 2,
              boxShadow: `inset 0 0 0 1px ${rightOutline}`,
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        borderRadius: 2,
        gap: "2px",
        p: "2px",
        bgcolor: REPORT_COLORS.track,
        border: `1px solid ${REPORT_COLORS.barOutline}`,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
      }}
    >
      {left > 0 && (
        <Box
          sx={{
            flex: `${leftFlex} 1 0`,
            minWidth: 4,
            height,
            bgcolor: leftColor,
            borderRadius: 1,
            boxShadow: `inset 0 0 0 1px ${leftOutline}`,
          }}
        />
      )}
      {right > 0 && (
        <Box
          sx={{
            flex: `${rightFlex} 1 0`,
            minWidth: 4,
            height,
            bgcolor: rightColor,
            borderRadius: 1,
            boxShadow: `inset 0 0 0 1px ${rightOutline}`,
          }}
        />
      )}
    </Box>
  );
}
