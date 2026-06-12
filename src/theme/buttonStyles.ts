import type { SxProps, Theme } from "@mui/material/styles";
import type { ColorPalette } from "./themes";
import { getReadableTextOn } from "@/lib/contrast";

/** High-contrast icon button on accent — disabled state stays readable on grey. */
export function accentIconButtonSx(palette: ColorPalette): SxProps<Theme> {
  const iconColor = getReadableTextOn(palette.accent);

  return {
    bgcolor: palette.accent,
    color: iconColor,
    "&:hover": { bgcolor: palette.accentHover, color: iconColor },
    "&.Mui-disabled": {
      opacity: 1,
      bgcolor: palette.surface,
      color: palette.textMuted,
      border: `1px solid ${palette.border}`,
    },
    "& .iconify, & svg": { color: "currentColor" },
    "&.Mui-disabled .iconify, &.Mui-disabled svg": {
      color: palette.textMuted,
    },
  };
}

/** Contained accent button — readable label/icon in enabled and disabled states. */
export function accentContainedButtonSx(palette: ColorPalette): SxProps<Theme> {
  const iconColor = getReadableTextOn(palette.accent);

  return {
    bgcolor: palette.accent,
    color: iconColor,
    fontWeight: 700,
    textTransform: "none",
    "&:hover": { bgcolor: palette.accentHover, color: iconColor },
    "&.Mui-disabled": {
      opacity: 1,
      bgcolor: palette.surface,
      color: palette.textMuted,
      border: `1px solid ${palette.border}`,
    },
    "& .iconify, & svg": { color: "currentColor" },
    "&.Mui-disabled .iconify, &.Mui-disabled svg": {
      color: palette.textMuted,
    },
  };
}
