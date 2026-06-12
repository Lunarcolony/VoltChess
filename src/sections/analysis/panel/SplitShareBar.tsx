import { Box } from "@mui/material";
import { REPORT_COLORS } from "./reportColors";

interface Props {
  leftShare: number;
  rightShare: number;
  height?: number;
}

export default function SplitShareBar({
  leftShare,
  rightShare,
  height = 10,
}: Props) {
  const left = Math.max(0, Math.min(100, leftShare));
  const right = Math.max(0, Math.min(100, rightShare));

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: REPORT_COLORS.track,
      }}
    >
      <Box
        sx={{
          width: `${left}%`,
          bgcolor: REPORT_COLORS.whitePlayer,
          minWidth: left > 0 ? 3 : 0,
        }}
      />
      <Box
        sx={{
          width: `${right}%`,
          bgcolor: REPORT_COLORS.blackPlayer,
          minWidth: right > 0 ? 3 : 0,
        }}
      />
    </Box>
  );
}
