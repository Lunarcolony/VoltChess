const DEFAULT_SITE_URL = "https://voltchess.vercel.app";

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || DEFAULT_SITE_URL
).replace(/\/$/, "");

export const SITE_HOST = new URL(SITE_URL).host;

/** Former production host — keep for PGN / session compatibility. */
export const LEGACY_SITE_HOSTS = ["voltchess.me"] as const;

export function isVoltChessSiteHost(host: string | undefined | null): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase();
  return (
    normalized === SITE_HOST.toLowerCase() ||
    LEGACY_SITE_HOSTS.some((h) => h === normalized)
  );
}

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const DEFAULT_SEO = {
  title:
    "Free Chess Game Analysis — Chess.com & Lichess, No Premium | VoltChess",
  description:
    "Free Stockfish analysis for Chess.com and Lichess games. Enter your username, get blunders, accuracy, and eval graph — no premium, unlimited, no sign-up.",
  keywords: [
    "free chess game analysis",
    "free chess game review",
    "chess.com game analysis free",
    "chess.com game review free",
    "free chess analysis",
    "stockfish analysis",
    "chess blunder finder",
    "PGN analyzer",
    "lichess game review",
    "chess move accuracy",
    "online chess analysis tool",
    "chess game review tool",
    "chess improvement",
    "chess.com alternative",
    "unlimited chess analysis free",
  ].join(", "),
} as const;

export const TRUST_BULLETS = [
  "No premium required",
  "Unlimited reviews",
  "Stockfish 17 in your browser",
] as const;
