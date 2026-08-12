import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { usePalette } from "@/hooks/usePalette";
import { GameOrigin } from "@/types/enums";

export type LoaderTab = GameOrigin;

const TABS: {
  value: LoaderTab;
  label: string;
  icon: string;
}[] = [
  { value: GameOrigin.ChessCom, label: "Chess.com", icon: "mdi:chess-pawn" },
  { value: GameOrigin.Lichess, label: "Lichess", icon: "mdi:horse" },
  { value: GameOrigin.Pgn, label: "PGN", icon: "mdi:file-document-outline" },
  { value: GameOrigin.Fen, label: "FEN", icon: "mdi:chess-board" },
];

interface Props {
  value: LoaderTab;
  onChange: (tab: LoaderTab) => void;
  compact?: boolean;
}

export default function PlatformTabs({ value, onChange, compact }: Props) {
  const palette = usePalette();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        p: 0.5,
        borderRadius: 2.5,
        bgcolor: palette.bg,
        border: `1px solid ${palette.border}`,
        flexWrap: compact ? "wrap" : { xs: "wrap", sm: "nowrap" },
      }}
    >
      {TABS.map(({ value: tabValue, label, icon }) => {
        const selected = value === tabValue;
        return (
          <Button
            key={tabValue}
            onClick={() => onChange(tabValue)}
            sx={{
              flex: compact ? "1 1 auto" : { xs: "1 1 45%", sm: 1 },
              minWidth: 0,
              py: compact ? 0.75 : 1,
              px: compact ? 1.25 : 1.75,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: compact ? "0.78rem" : "0.85rem",
              color: selected ? palette.text : palette.textMuted,
              bgcolor: selected ? palette.surfaceRaised : "transparent",
              border: selected
                ? `1px solid ${alpha(palette.accent, 0.35)}`
                : "1px solid transparent",
              boxShadow: selected
                ? `0 1px 0 ${alpha(palette.accent, 0.12)}`
                : "none",
              "&:hover": {
                bgcolor: selected
                  ? palette.surfaceRaised
                  : alpha(palette.accent, 0.06),
              },
            }}
          >
            <Icon
              icon={icon}
              width={compact ? 16 : 18}
              style={{ marginRight: 8, flexShrink: 0 }}
            />
            <Typography
              component="span"
              fontSize="inherit"
              fontWeight="inherit"
              noWrap
            >
              {label}
            </Typography>
          </Button>
        );
      })}
    </Box>
  );
}
