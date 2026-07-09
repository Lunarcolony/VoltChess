import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SITE_URL } from "./seo-urls.mjs";

async function loadTsModule(entryPath) {
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    format: "esm",
    write: false,
    platform: "node",
  });
  const tempDir = mkdtempSync(join(tmpdir(), "voltchess-seo-"));
  const tempFile = join(tempDir, "module.mjs");
  writeFileSync(tempFile, result.outputFiles[0].text);
  return import(pathToFileURL(tempFile).href);
}

export async function loadSeoData() {
  const [blogMod, landingMod] = await Promise.all([
    loadTsModule("src/data/blogPosts.ts"),
    loadTsModule("src/data/landingPages.ts"),
  ]);
  return {
    blogPosts: blogMod.BLOG_POSTS,
    landingPages: landingMod.LANDING_PAGES,
  };
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function abs(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function buildHomeBody() {
  return `<main>
  <h1>Free Chess Game Analysis — Chess.com &amp; Lichess, No Premium</h1>
  <p>Free Stockfish analysis for Chess.com and Lichess games. Enter your username, get blunders, accuracy, and an evaluation graph — no premium, unlimited, no sign-up.</p>
  <nav aria-label="Main sections">
    <ul>
      <li><a href="${abs("/free-chess-com-analysis")}">Free Chess.com Game Analysis</a></li>
      <li><a href="${abs("/free-lichess-game-review")}">Free Lichess Game Review</a></li>
      <li><a href="${abs("/free-chess-game-analysis")}">Free Unlimited Chess Game Analysis</a></li>
      <li><a href="${abs("/blog")}">Chess Analysis Guides</a></li>
      <li><a href="${abs("/analysis")}">Game Analysis Tool</a></li>
    </ul>
  </nav>
</main>`;
}

export function buildLandingBody(page) {
  const intro = page.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n  ");
  const faqs = page.faqs
    .map(
      (faq) =>
        `<section><h2>${escapeHtml(faq.question)}</h2><p>${escapeHtml(faq.answer)}</p></section>`
    )
    .join("\n  ");

  return `<main>
  <h1>${escapeHtml(page.h1)}</h1>
  ${intro}
  ${faqs}
  <p><a href="${abs("/blog")}">Read our chess analysis guides</a></p>
</main>`;
}

export function buildBlogIndexBody(posts) {
  const links = posts
    .map(
      (post) =>
        `<li><a href="${abs(`/blog/${post.slug}`)}">${escapeHtml(post.title)}</a> — ${escapeHtml(post.excerpt)}</li>`
    )
    .join("\n      ");

  return `<main>
  <h1>Chess Analysis Guides</h1>
  <p>Free guides on chess game review, Chess.com analysis, Stockfish game analysis, blunder finding, and PGN review.</p>
  <ul>
      ${links}
  </ul>
</main>`;
}

export function buildBlogPostBody(post) {
  const sections = post.sections
    .map((section) => {
      const heading = section.heading
        ? `<h2>${escapeHtml(section.heading)}</h2>`
        : "";
      const paragraphs = section.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("\n    ");
      return `${heading}\n    ${paragraphs}`;
    })
    .join("\n  ");

  const ctaPath = post.slug.includes("lichess")
    ? "/free-lichess-game-review"
    : post.slug.includes("chesscom") ||
        post.slug === "voltchess-vs-chesscom-premium"
      ? "/free-chess-com-analysis"
      : "/free-chess-game-analysis";

  return `<main>
  <nav><a href="${abs("/blog")}">All guides</a></nav>
  <article>
    <h1>${escapeHtml(post.title)}</h1>
    <p>${escapeHtml(post.excerpt)}</p>
    ${sections}
    <p><a href="${abs(ctaPath)}">Try free chess analysis on VoltChess</a></p>
  </article>
</main>`;
}

const APP_PAGE_BODIES = {
  "/analysis": `<main>
  <h1>Chess Game Analysis</h1>
  <p>Analyze chess games free with Stockfish in your browser. Import from Chess.com, Lichess, or paste a PGN file to get move classifications, accuracy scores, blunder detection, and an evaluation graph.</p>
  <p><a href="${abs("/free-chess-game-analysis")}">Start a free game review</a> · <a href="${abs("/blog/how-to-analyze-chess-games")}">How to analyze your games</a></p>
</main>`,
  "/openings": `<main>
  <h1>Chess Openings Explorer</h1>
  <p>Explore chess openings and build your repertoire on VoltChess. Study opening lines alongside free Stockfish game analysis.</p>
  <p><a href="${abs("/analysis")}">Analyze a game</a> · <a href="${abs("/blog")}">Analysis guides</a></p>
</main>`,
  "/puzzles": `<main>
  <h1>Chess Puzzles</h1>
  <p>Practice tactics with chess puzzles on VoltChess. Improve calculation and pattern recognition alongside free game review.</p>
  <p><a href="${abs("/analysis")}">Analyze a game</a> · <a href="${abs("/blog/find-chess-blunders-free")}">Find blunders in your games</a></p>
</main>`,
  "/terms-and-conditions": `<main>
  <h1>Terms and Conditions</h1>
  <p>Terms of use for VoltChess — free chess game analysis and optional Academy coaching features.</p>
  <p><a href="${abs("/")}">Back to VoltChess home</a></p>
</main>`,
};

export function buildAppPageBody(path) {
  return APP_PAGE_BODIES[path] ?? "";
}
