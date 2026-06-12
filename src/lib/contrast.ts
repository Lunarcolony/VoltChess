/** Relative luminance (sRGB) — returns 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0.5;

  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Pick light or dark foreground for readable contrast on a solid background. */
export function getReadableTextOn(bgHex: string): string {
  return luminance(bgHex) > 0.45 ? "#0d0d0d" : "#f5f5f5";
}
