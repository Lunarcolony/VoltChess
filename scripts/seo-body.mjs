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
  <p>Practical how-tos for reviewing your games: import from Chess.com or Lichess, read the eval graph, find blunders, and turn engine data into real improvement — free, unlimited Stockfish in your browser.</p>
  <p><a href="${abs("/free-chess-game-analysis")}">Start a free game review</a></p>
  <ul>
      ${links}
  </ul>
</main>`;
}

function renderBlogSection(section) {
  const type = section.type ?? "prose";

  if (type === "prose") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const paragraphs = (section.paragraphs ?? [])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("\n    ");
    return `${heading}\n    ${paragraphs}`;
  }

  if (type === "steps") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const steps = (section.steps ?? [])
      .map(
        (step, idx) =>
          `<section><h3>Step ${idx + 1} — ${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></section>`
      )
      .join("\n    ");
    return `${heading}\n    ${steps}`;
  }

  if (type === "checklist") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const items = (section.items ?? [])
      .map(
        (item) =>
          `<section><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></section>`
      )
      .join("\n    ");
    return `${heading}\n    ${items}`;
  }

  if (type === "callout") {
    const title = section.title
      ? `<h2>${escapeHtml(section.title)}</h2>`
      : "";
    return `${title}\n    <p>${escapeHtml(section.body)}</p>`;
  }

  if (type === "faq") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : `<h2>Frequently asked questions</h2>`;
    const items = (section.items ?? [])
      .map(
        (faq) =>
          `<section><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></section>`
      )
      .join("\n    ");
    return `${heading}\n    ${items}`;
  }

  if (type === "loader") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const caption = section.caption
      ? `<p>${escapeHtml(section.caption)}</p>`
      : "";
    return `${heading}\n    ${caption}\n    <p><a href="${abs("/free-chess-game-analysis")}">Load a game and start free analysis</a></p>`;
  }

  if (type === "grades") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const items = (section.items ?? [])
      .map(
        (item) =>
          `<section><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.description)}</p></section>`
      )
      .join("\n    ");
    return `${heading}\n    ${items}`;
  }

  if (type === "compare") {
    const heading = section.heading
      ? `<h2>${escapeHtml(section.heading)}</h2>`
      : "";
    const rows = (section.rows ?? [])
      .map(
        (row) =>
          `<tr><th scope="row">${escapeHtml(row.feature)}</th><td>${escapeHtml(row.left)}</td><td>${escapeHtml(row.right)}</td></tr>`
      )
      .join("\n      ");
    return `${heading}
    <table>
      <thead><tr><th>Feature</th><th>${escapeHtml(section.leftLabel)}</th><th>${escapeHtml(section.rightLabel)}</th></tr></thead>
      <tbody>
      ${rows}
      </tbody>
    </table>`;
  }

  return "";
}

function collectBlogFaqs(post) {
  return (post.sections ?? []).flatMap((section) =>
    section.type === "faq" ? section.items ?? [] : []
  );
}

export function buildBlogPostBody(post, allPosts = []) {
  const sections = (post.sections ?? [])
    .map((section) => renderBlogSection(section))
    .filter(Boolean)
    .join("\n  ");

  const related = (post.relatedSlugs ?? [])
    .map((slug) => {
      const relatedPost = allPosts.find((entry) => entry.slug === slug);
      const title = relatedPost?.title ?? slug;
      return `<li><a href="${abs(`/blog/${slug}`)}">${escapeHtml(title)}</a></li>`;
    })
    .join("\n      ");

  const relatedBlock = related
    ? `<section><h2>Related guides</h2><ul>\n      ${related}\n    </ul></section>`
    : "";

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
    ${relatedBlock}
    <p><a href="${abs(ctaPath)}">Try free chess analysis on VoltChess</a></p>
  </article>
</main>`;
}

export function buildBlogFaqSchema(post) {
  const faqs = collectBlogFaqs(post);
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
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
  "/moved": `<main>
  <h1>VoltChess moved</h1>
  <p>The old domain voltchess.me expired. The free Stockfish analyzer is now at <a href="${abs("/")}">${SITE_URL.replace("https://", "")}</a> — same app, no sign-up. Please update bookmarks.</p>
  <p><a href="${abs("/")}">Open the analyzer</a></p>
</main>`,
};

export function buildAppPageBody(path) {
  return APP_PAGE_BODIES[path] ?? "";
}
