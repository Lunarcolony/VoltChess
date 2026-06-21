import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = "https://voltchess.me";
const lastmod = new Date().toISOString().slice(0, 10);

const blogSlugs = [
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

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  {
    loc: "/free-chess-com-analysis",
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    loc: "/free-lichess-game-review",
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    loc: "/free-chess-game-analysis",
    priority: "0.95",
    changefreq: "weekly",
  },
  { loc: "/blog", priority: "0.95", changefreq: "weekly" },
  { loc: "/analysis", priority: "0.9", changefreq: "weekly" },
  { loc: "/openings", priority: "0.7", changefreq: "monthly" },
  { loc: "/puzzles", priority: "0.7", changefreq: "monthly" },
  {
    loc: "/terms-and-conditions",
    priority: "0.3",
    changefreq: "yearly",
  },
];

function urlEntry(loc, priority, changefreq, image = false) {
  const imageBlock = image
    ? `
    <image:image>
      <image:loc>${SITE_URL}/og-image.png</image:loc>
      <image:title>VoltChess — Free Chess Game Analysis</image:title>
      <image:caption>Free chess game review and analysis powered by Stockfish</image:caption>
    </image:image>`
    : "";

  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlock}
  </url>`;
}

const urls = [
  urlEntry("/", "1.0", "weekly", true),
  ...staticPages.slice(1).map(({ loc, priority, changefreq }) =>
    urlEntry(loc, priority, changefreq)
  ),
  ...blogSlugs.map((slug) =>
    urlEntry(`/blog/${slug}`, "0.85", "monthly")
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;

for (const dir of ["public", "dist"]) {
  try {
    writeFileSync(join(dir, "sitemap.xml"), xml);
    console.log(`generate-sitemap: wrote ${dir}/sitemap.xml (${lastmod})`);
  } catch {
    if (dir === "public") throw new Error("public/sitemap.xml write failed");
  }
}
