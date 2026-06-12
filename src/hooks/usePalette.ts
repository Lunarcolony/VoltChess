import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { alpha } from "@mui/material/styles";
import { colorThemeAtom } from "@/theme/colorThemeAtom";
import { getPalette, type ColorPalette } from "@/theme/themes";
import { getReadableTextOn } from "@/lib/contrast";

export function usePalette(): ColorPalette {
  const themeId = useAtomValue(colorThemeAtom);
  return useMemo(() => {
    const palette = getPalette(themeId);
    return {
      ...palette,
      onAccent: getReadableTextOn(palette.accent),
    };
  }, [themeId]);
}

export function useCardSx() {
  const palette = usePalette();
  return useMemo(
    () =>
      ({
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,
        p: 3,
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: alpha(palette.accent, 0.35),
        },
      }) as const,
    [palette]
  );
}
