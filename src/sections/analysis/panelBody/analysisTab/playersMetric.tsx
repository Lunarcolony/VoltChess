import { Stack, Typography } from "@mui/material";
import { palette } from "@/theme/voltchessTheme";

interface Props {
  title: string;
  whiteValue: string | number;
  blackValue: string | number;
}

export default function PlayersMetric({
  title,
  whiteValue,
  blackValue,
}: Props) {
  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
      columnGap={{ xs: 3, md: 6 }}
      width="100%"
    >
      <ValueBlock value={whiteValue} side="white" />
      <Typography
        align="center"
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 72 }}
      >
        {title}
      </Typography>
      <ValueBlock value={blackValue} side="black" />
    </Stack>
  );
}

const ValueBlock = ({
  value,
  side,
}: {
  value: string | number;
  side: "white" | "black";
}) => {
  const isWhite = side === "white";

  return (
    <Typography
      align="center"
      sx={{
        minWidth: 56,
        bgcolor: isWhite ? "#e8e8e8" : palette.surface,
        color: isWhite ? "#0a0a0a" : palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: 1,
        py: 0.75,
        px: 1.25,
        fontWeight: 600,
        fontSize: "0.875rem",
      }}
      noWrap
    >
      {value}
    </Typography>
  );
};
