/**
 * Fixed report palette — matches Good/Bad & accuracy colors in the report,
 * but never reads from the global theme so settings can't change it.
 */
export const REPORT_COLORS = {
  good: "#22ac38",
  bad: "#df5353",
  opening: "#5b9bd5",
  middle: "#22ac38",
  endgame: "#c9a227",
  control: "#5b9bd5",
  peak: "#22ac38",
  recovery: "#e8a838",
  worst: "#df5353",
  neutral: "#9a9a9a",
  text: "#e0e0e0",
  textMuted: "#888888",
  /** White player — blue, same family as Opening / Control */
  whitePlayer: "#5b9bd5",
  whitePlayerDark: "#3a7ab8",
  /** Black player — green, same family as Good / Peak */
  blackPlayer: "#22ac38",
  blackPlayerDark: "#1a7a2e",
  whiteAvatarText: "#ffffff",
  blackAvatarText: "#ffffff",
  rowBg: "#181818",
  rowBorder: "#2c2c2c",
  track: "#2a2a2a",
  barOutline: "rgba(255, 255, 255, 0.14)",
} as const;

export const PHASE_COLORS = {
  opening: REPORT_COLORS.opening,
  middlegame: REPORT_COLORS.middle,
  endgame: REPORT_COLORS.endgame,
} as const;
