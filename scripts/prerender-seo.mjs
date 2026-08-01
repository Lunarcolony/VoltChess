import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { SITE_URL } from "./seo-urls.mjs";
import {
  loadSeoData,
  escapeHtml,
  buildHomeBody,
  buildLandingBody,
  buildBlogIndexBody,
  buildBlogPostBody,
  buildBlogFaqSchema,
  buildAppPageBody,
} from "./seo-body.mjs";

const OG_IMAGE = `${SITE_URL}/og-image.png`;

/** @typedef {{ path: string, title: string, description: string, bodyHtml: string, jsonLd?: object | object[] }} SeoPage */

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

function homeJsonLd() {
  const github = "https://github.com/Lunarcolony/VoltChess";
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "VoltChess",
      applicationCategory: "GameApplication",
      description:
        "Free chess game review and analysis powered by Stockfish. Import Chess.com or Lichess games, find blunders, check accuracy, and improve your play.",
      url: `${SITE_URL}/`,
      codeRepository: github,
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
        url: SITE_URL,
        logo: `${SITE_URL}/logo-512.png`,
        sameAs: [github],
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
      sameAs: [github],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "VoltChess",
      url: `${SITE_URL}/`,
      description:
        "Free unlimited chess game analysis and review powered by Stockfish.",
      publisher: {
        "@type": "Organization",
        name: "VoltChess",
        sameAs: [github],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "VoltChess",
      description:
        "Open-source VoltChess — free Stockfish chess game analysis for Chess.com and Lichess.",
      url: github,
      codeRepository: github,
      programmingLanguage: ["TypeScript", "Python"],
      runtimePlatform: "Web browser",
      license: "https://www.gnu.org/licenses/agpl-3.0.html",
      isPartOf: { "@type": "WebApplication", name: "VoltChess", url: SITE_URL },
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
        {
          "@type": "SiteNavigationElement",
          position: 5,
          name: "VoltChess on GitHub",
          url: github,
        },
      ],
    },
  ];
}

const APP_PAGES = [
  {
    path: "/analysis",
    title: "Chess Game Analysis — Free Stockfish Review | VoltChess",
    description:
      "Analyze chess games free with Stockfish in your browser. Import Chess.com, Lichess, or PGN files for move grades, accuracy, and blunder detection.",
  },
  {
    path: "/openings",
    title: "Chess Openings Explorer | VoltChess",
    description:
      "Explore chess openings and build your repertoire on VoltChess alongside free Stockfish game analysis.",
  },
  {
    path: "/puzzles",
    title: "Chess Puzzles | VoltChess",
    description:
      "Practice chess tactics and puzzles on VoltChess. Improve alongside free Stockfish game review.",
  },
  {
    path: "/terms-and-conditions",
    title: "Terms and Conditions | VoltChess",
    description: "Terms of use for VoltChess free chess analysis and Academy features.",
  },
  {
    path: "/moved",
    title: "VoltChess moved — new official URL | VoltChess",
    description:
      "voltchess.me expired. VoltChess free chess analysis is now at voltchess.vercel.app — same app, no sign-up.",
  },
];

/** @returns {Promise<SeoPage[]>} */
async function buildPages() {
  const { blogPosts, landingPages } = await loadSeoData();

  /** @type {SeoPage[]} */
  const pages = [
    {
      path: "/",
      title:
        "Free Chess Game Analysis — Chess.com & Lichess, No Premium | VoltChess",
      description:
        "Free Stockfish analysis for Chess.com and Lichess games. Enter your username, get blunders, accuracy, and eval graph — no premium, unlimited, no sign-up.",
      bodyHtml: buildHomeBody(),
      jsonLd: homeJsonLd(),
    },
    ...landingPages.map((page) => ({
      path: page.path,
      title: page.metaTitle,
      description: page.metaDescription,
      bodyHtml: buildLandingBody(page),
    })),
    {
      path: "/blog",
      title: "Chess Game Review & Analysis Guides | VoltChess Blog",
      description:
        "Free guides on chess game review, Chess.com analysis, Stockfish game analysis, blunder finding, and PGN review. Learn how to study your games on VoltChess.",
      bodyHtml: buildBlogIndexBody(blogPosts),
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
    ...blogPosts.map((post) => {
      const faqSchema = buildBlogFaqSchema(post);
      return {
        path: `/blog/${post.slug}`,
        title: post.metaTitle,
        description: post.metaDescription,
        bodyHtml: buildBlogPostBody(post, blogPosts),
        jsonLd: faqSchema
          ? [articleSchema(post.title, post.metaDescription, post.publishedAt), faqSchema]
          : articleSchema(post.title, post.metaDescription, post.publishedAt),
      };
    }),
    ...APP_PAGES.map((page) => ({
      path: page.path,
      title: page.title,
      description: page.description,
      bodyHtml: buildAppPageBody(page.path),
    })),
  ];

  return pages;
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

  return `<title>
      ${title}
    </title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
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

  if (page.bodyHtml) {
    result = result.replace(
      '<div id="root"></div>',
      `<div id="root">${page.bodyHtml}</div>`
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
  const pages = await buildPages();

  for (const page of pages) {
    writePage(distDir, page, template);
  }

  console.log(`prerender-seo: ${pages.length} routes prerendered`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
