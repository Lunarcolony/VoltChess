/** Shared public URLs for sitemap.xml and IndexNow submissions. */

export const SITE_URL = "https://voltchess.me";
export const SITE_HOST = "voltchess.me";

export const INDEXNOW_KEY = "30a48e821f564f43bd421d99f842e4e2";

export const blogSlugs = [
  "free-chess-game-review",
  "chesscom-game-review-free",
  "how-to-analyze-chess-games",
  "free-chess-analysis-stockfish",
  "find-chess-blunders-free",
  "analyze-pgn-online-free",
  "lichess-game-review-free",
  "chess-move-accuracy-scores",
  "chess-game-analysis-for-beginners",
  "unlimited-free-chess-game-analysis",
  "voltchess-vs-chesscom-premium",
];

export const staticPaths = [
  "/",
  "/free-chess-com-analysis",
  "/free-lichess-game-review",
  "/free-chess-game-analysis",
  "/blog",
  "/analysis",
  "/openings",
  "/puzzles",
  "/terms-and-conditions",
];

/** Absolute URLs indexed in sitemap.xml (IndexNow-safe). */
export function getPublicUrls() {
  return [
    ...staticPaths.map((path) =>
      path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`
    ),
    ...blogSlugs.map((slug) => `${SITE_URL}/blog/${slug}`),
  ];
}

export function indexNowKeyUrl() {
  return `${SITE_URL}/${INDEXNOW_KEY}.txt`;
}
