import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  SITE_URL,
  blogSlugs,
  staticPaths,
} from "./seo-urls.mjs";

const lastmod = new Date().toISOString().slice(0, 10);

const staticMeta = {
  "/": { priority: "1.0", changefreq: "weekly", image: true },
  "/free-chess-com-analysis": { priority: "0.95", changefreq: "weekly" },
  "/free-lichess-game-review": { priority: "0.95", changefreq: "weekly" },
  "/free-chess-game-analysis": { priority: "0.95", changefreq: "weekly" },
  "/blog": { priority: "0.95", changefreq: "weekly" },
  "/analysis": { priority: "0.9", changefreq: "weekly" },
  "/openings": { priority: "0.7", changefreq: "monthly" },
  "/puzzles": { priority: "0.7", changefreq: "monthly" },
  "/terms-and-conditions": { priority: "0.3", changefreq: "yearly" },
  "/moved": { priority: "0.4", changefreq: "yearly" },
};

function urlEntry(path, priority, changefreq, image = false) {
  const loc = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
  const imageBlock = image
    ? `
    <image:image>
      <image:loc>${SITE_URL}/og-image.png</image:loc>
      <image:title>VoltChess — Free Chess Game Analysis</image:title>
      <image:caption>Free chess game review and analysis powered by Stockfish</image:caption>
    </image:image>`
    : "";

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlock}
  </url>`;
}

const urls = [
  ...staticPaths.map((path) => {
    const meta = staticMeta[path] ?? {
      priority: "0.5",
      changefreq: "monthly",
    };
    return urlEntry(path, meta.priority, meta.changefreq, meta.image);
  }),
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

const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /sign-in
Disallow: /coach/
Disallow: /student
Disallow: /play
Disallow: /review
Disallow: /thanks

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /
`;

for (const dir of ["public", "dist"]) {
  try {
    writeFileSync(join(dir, "sitemap.xml"), xml);
    console.log(`generate-sitemap: wrote ${dir}/sitemap.xml (${lastmod})`);
  } catch {
    if (dir === "public") throw new Error("public/sitemap.xml write failed");
  }
}

for (const dir of ["public", "dist"]) {
  try {
    writeFileSync(join(dir, "robots.txt"), robotsTxt);
    console.log(`generate-sitemap: wrote ${dir}/robots.txt`);
  } catch {
    if (dir === "public") throw new Error("public/robots.txt write failed");
  }
}

// Keep IndexNow key file in sync when key is rotated via env.
const keyFromEnv = process.env.INDEXNOW_KEY?.trim();
if (keyFromEnv) {
  writeFileSync(join("public", `${keyFromEnv}.txt`), `${keyFromEnv}\n`);
  console.log(`generate-sitemap: wrote public/${keyFromEnv}.txt`);
}
