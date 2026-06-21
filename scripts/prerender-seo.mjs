import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const SITE_URL = "https://voltchess.me";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

/** @typedef {{ path: string, title: string, description: string, jsonLd?: object | object[] }} SeoPage */

/** @type {SeoPage[]} */
const pages = [
  {
    path: "/",
    title:
      "Free Chess Game Analysis — Chess.com & Lichess, No Premium | VoltChess",
    description:
      "Enter your Chess.com or Lichess username, pick a game, and get a full Stockfish analysis report in seconds. Unlimited free game review — no premium, no daily cap, no sign-up.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "VoltChess",
        applicationCategory: "GameApplication",
        description:
          "Free chess game review and analysis powered by Stockfish. Import Chess.com or Lichess games, find blunders, check accuracy, and improve your play.",
        url: `${SITE_URL}/`,
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        creator: {
          "@type": "Organization",
          name: "VoltChess",
          logo: `${SITE_URL}/logo-512.png`,
        },
        featureList: [
          "Free chess game review",
          "Stockfish engine analysis",
          "Chess.com game import",
          "Lichess game import",
          "PGN file analysis",
          "Blunder and mistake detection",
          "Move accuracy scores",
          "Evaluation graph",
          "No registration required",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "VoltChess",
        url: SITE_URL,
        logo: `${SITE_URL}/logo-512.png`,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "VoltChess",
        url: `${SITE_URL}/`,
        description:
          "Free unlimited chess game analysis and review powered by Stockfish.",
        publisher: { "@type": "Organization", name: "VoltChess" },
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "VoltChess main sections",
        itemListElement: [
          {
            "@type": "SiteNavigationElement",
            position: 1,
            name: "Free Chess.com Analysis",
            url: `${SITE_URL}/free-chess-com-analysis`,
          },
          {
            "@type": "SiteNavigationElement",
            position: 2,
            name: "Free Lichess Game Review",
            url: `${SITE_URL}/free-lichess-game-review`,
          },
          {
            "@type": "SiteNavigationElement",
            position: 3,
            name: "Chess Analysis Guides",
            url: `${SITE_URL}/blog`,
          },
          {
            "@type": "SiteNavigationElement",
            position: 4,
            name: "Game Analysis",
            url: `${SITE_URL}/analysis`,
          },
        ],
      },
    ],
  },
  {
    path: "/free-chess-com-analysis",
    title: "Free Chess.com Game Analysis — No Premium Required | VoltChess",
    description:
      "Analyze Chess.com games for free with Stockfish. Get move classifications, accuracy scores, blunder detection, and evaluation graphs — same features as Chess.com Premium, no subscription.",
  },
  {
    path: "/free-lichess-game-review",
    title: "Free Lichess Game Review & Analysis | VoltChess",
    description:
      "Review Lichess games for free with Stockfish. Enter your Lichess username, load any recent game, and get a full analysis report in seconds. Unlimited and free.",
  },
  {
    path: "/free-chess-game-analysis",
    title: "Free Unlimited Chess Game Analysis with Stockfish | VoltChess",
    description:
      "Unlimited free chess game analysis powered by Stockfish 17. Import PGN files, Chess.com and Lichess games. No daily caps, no premium tier, no sign-up required.",
  },
  {
    path: "/blog",
    title: "Chess Game Review & Analysis Guides | VoltChess Blog",
    description:
      "Free guides on chess game review, Chess.com analysis, Stockfish game analysis, blunder finding, and PGN review. Learn how to study your games on VoltChess.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "VoltChess Guides",
      description:
        "Free chess game review and analysis guides powered by Stockfish.",
      url: `${SITE_URL}/blog`,
      publisher: { "@type": "Organization", name: "VoltChess" },
    },
  },
  {
    path: "/blog/free-chess-game-review",
    title: "Free Chess Game Review Online | VoltChess — Stockfish Game Analysis",
    description:
      "Get a free chess game review for every game you play. VoltChess uses Stockfish to score accuracy, flag blunders, and show where you won or lost the game. No subscription.",
    jsonLd: articleSchema(
      "Free Chess Game Review — Analyze Every Move with Stockfish",
      "Get a free chess game review for every game you play. VoltChess uses Stockfish to score accuracy, flag blunders, and show where you won or lost the game. No subscription.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/chesscom-game-review-free",
    title: "Free Chess.com Game Review Alternative | VoltChess — No Premium",
    description:
      "Analyze Chess.com games for free without Chess.com Premium. Import by link or PGN and get Stockfish game review, accuracy, and blunder detection on VoltChess.",
    jsonLd: articleSchema(
      "Free Chess.com Game Review — No Premium Required",
      "Analyze Chess.com games for free without Chess.com Premium. Import by link or PGN and get Stockfish game review, accuracy, and blunder detection on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/how-to-analyze-chess-games",
    title: "How to Analyze Your Chess Games | Free Step-by-Step Guide | VoltChess",
    description:
      "Learn how to analyze chess games step by step. Use Stockfish to find blunders, review openings, and improve faster — free on VoltChess with PGN or Chess.com import.",
    jsonLd: articleSchema(
      "How to Analyze Your Chess Games (Step-by-Step Guide)",
      "Learn how to analyze chess games step by step with Stockfish on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/free-chess-analysis-stockfish",
    title: "Free Chess Analysis with Stockfish | VoltChess Browser Engine",
    description:
      "Run Stockfish chess analysis free in your browser. VoltChess loads Stockfish 17 locally — no server queue, no account, full game review with evaluation graph and move grades.",
    jsonLd: articleSchema(
      "Free Chess Analysis with Stockfish — In Your Browser",
      "Run Stockfish chess analysis free in your browser on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/find-chess-blunders-free",
    title: "Find Chess Blunders Free | VoltChess Blunder Finder",
    description:
      "Find blunders in your chess games for free. VoltChess highlights mistakes, inaccuracies, and missed wins with Stockfish — import from Chess.com, Lichess, or PGN.",
    jsonLd: articleSchema(
      "Find Chess Blunders Free — Spot Mistakes Instantly",
      "Find blunders in your chess games for free with VoltChess and Stockfish.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/analyze-pgn-online-free",
    title: "Analyze PGN Online Free | VoltChess PGN Chess Analyzer",
    description:
      "Upload or paste a PGN file for free chess analysis online. VoltChess runs Stockfish in your browser and produces a full game review with accuracy and blunder detection.",
    jsonLd: articleSchema(
      "Analyze PGN Files Online Free",
      "Upload or paste a PGN file for free chess analysis online on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/lichess-game-review-free",
    title: "Free Lichess Game Review | VoltChess — Analyze Lichess Games",
    description:
      "Get a free Lichess game review with Stockfish on VoltChess. Import Lichess games by username or link — accuracy scores, blunder finder, and evaluation graph included.",
    jsonLd: articleSchema(
      "Free Lichess Game Review & Analysis",
      "Get a free Lichess game review with Stockfish on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/chess-move-accuracy-scores",
    title: "Chess Move Accuracy Explained | VoltChess Game Analysis Guide",
    description:
      "What does chess move accuracy mean? Learn how accuracy scores work, how Stockfish calculates them, and how to use accuracy in your free game review on VoltChess.",
    jsonLd: articleSchema(
      "Chess Move Accuracy — What Your Score Really Means",
      "Learn how chess move accuracy scores work in VoltChess game review.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/chess-game-analysis-for-beginners",
    title: "Chess Game Analysis for Beginners | Free Guide | VoltChess",
    description:
      "New to chess game analysis? Start here — free beginner guide to reviewing games, finding blunders, and improving with Stockfish on VoltChess.",
    jsonLd: articleSchema(
      "Chess Game Analysis for Beginners",
      "Free beginner guide to reviewing chess games on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/unlimited-free-chess-game-analysis",
    title: "Unlimited Free Chess Game Analysis | VoltChess — No Limits",
    description:
      "Analyze unlimited chess games for free with no daily caps. VoltChess offers full Stockfish game review, PGN import, and blunder detection without a paywall.",
    jsonLd: articleSchema(
      "Unlimited Free Chess Game Analysis — No Daily Caps",
      "Analyze unlimited chess games for free with no daily caps on VoltChess.",
      "2025-06-12"
    ),
  },
  {
    path: "/blog/voltchess-vs-chesscom-premium",
    title: "VoltChess vs Chess.com Premium Game Review | Free Alternative",
    description:
      "Compare VoltChess free game review to Chess.com Premium analysis. Same Stockfish-powered accuracy, blunders, and eval graph — no subscription required.",
    jsonLd: articleSchema(
      "VoltChess vs Chess.com Premium — Free Game Review Alternative",
      "Compare VoltChess free game review to Chess.com Premium analysis.",
      "2026-06-21"
    ),
  },
];

function articleSchema(headline, description, datePublished) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    datePublished,
    author: { "@type": "Organization", name: "VoltChess" },
    publisher: {
      "@type": "Organization",
      name: "VoltChess",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-512.png` },
    },
  };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHeadTags(page) {
  const canonical = `${SITE_URL}${page.path === "/" ? "/" : page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);

  const jsonLdBlocks = page.jsonLd
    ? (Array.isArray(page.jsonLd) ? page.jsonLd : [page.jsonLd])
        .map(
          (data) =>
            `    <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`
        )
        .join("\n")
    : "";

  return `<title>\n      ${title}\n    </title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="VoltChess" />
    <meta property="og:locale" content="en_US" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonical}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${OG_IMAGE}" />
${jsonLdBlocks}`;
}

function injectSeo(html, page) {
  const headTags = buildHeadTags(page);

  let result = html.replace(
    /<!-- Primary Meta Tags -->[\s\S]*?<!-- Structured Data for Search Engines -->[\s\S]*?<\/script>\s*/,
    `<!-- Primary Meta Tags (prerendered) -->\n    ${headTags}\n`
  );

  if (result === html) {
    result = html.replace(
      /<title>[\s\S]*?<\/title>/,
      headTags.split("\n").slice(0, 3).join("\n")
    );
  }

  return result;
}

function normalizeAssetPaths(html) {
  return html.replace(/(?:href|src)="\.\//g, (match) =>
    match.replace("./", "/")
  );
}

function writePage(distDir, page, html) {
  const outPath =
    page.path === "/"
      ? join(distDir, "index.html")
      : join(distDir, page.path.slice(1), "index.html");

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, normalizeAssetPaths(injectSeo(html, page)));
  console.log(`prerender-seo: ${page.path} → ${outPath}`);
}

async function main() {
  const distDir = "dist";
  const templatePath = join(distDir, "index.html");

  if (!existsSync(templatePath)) {
    console.error("prerender-seo: dist/index.html not found — run vite build first");
    process.exit(1);
  }

  const template = readFileSync(templatePath, "utf8");

  for (const page of pages) {
    writePage(distDir, page, template);
  }

  console.log(`prerender-seo: ${pages.length} routes prerendered`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
