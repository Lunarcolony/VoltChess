import { Box, SxProps, Theme } from "@mui/material";

interface Props {
  size?: number;
  sx?: SxProps<Theme>;
}

/** VoltChess brand mark — lightning on chess squares */
export default function VoltChessLogo({ size = 28, sx }: Props) {
  return (
    <Box
      component="img"
      src="/logo.svg"
      alt="VoltChess"
      sx={{ width: size, height: size, display: "block", flexShrink: 0, ...sx }}
    />
  );
}
