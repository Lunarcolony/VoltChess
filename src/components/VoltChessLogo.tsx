import { Box, SxProps, Theme } from "@mui/material";

interface Props {
  size?: number;
  sx?: SxProps<Theme>;
}

/** DawvioChess brand mark — "D" monogram on chess squares */
export default function VoltChessLogo({ size = 28, sx }: Props) {
  return (
    <Box
      component="img"
      src="/logo.svg"
      alt="DawvioChess"
      sx={{ width: size, height: size, display: "block", flexShrink: 0, ...sx }}
    />
  );
}
