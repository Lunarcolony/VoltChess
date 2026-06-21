export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingPageConfig {
  slug: string;
  path: string;
  h1: string;
  intro: string[];
  metaTitle: string;
  metaDescription: string;
  defaultTab: "chesscom" | "lichess" | "pgn";
  faqs: LandingFaq[];
  relatedBlogSlugs: string[];
}

export const LANDING_PAGES: LandingPageConfig[] = [
  {
    slug: "free-chess-com-analysis",
    path: "/free-chess-com-analysis",
    h1: "Free Chess.com Game Analysis",
    intro: [
      "Chess.com locks full game review behind Premium on many accounts. VoltChess gives you the same kind of feedback — accuracy scores, blunder detection, move classification, and an evaluation graph — for every Chess.com game, free and unlimited.",
      "Enter your Chess.com username below, pick a recent game, and Stockfish analyzes every move in your browser within seconds. No subscription, no daily cap, no sign-up.",
    ],
    metaTitle: "Free Chess.com Game Analysis — No Premium Required | VoltChess",
    metaDescription:
      "Analyze Chess.com games for free with Stockfish. Get move classifications, accuracy scores, blunder detection, and evaluation graphs — same features as Chess.com Premium, no subscription.",
    defaultTab: "chesscom",
    faqs: [
      {
        question: "Is VoltChess really free for Chess.com games?",
        answer:
          "Yes. VoltChess is completely free with no premium tier and no daily analysis limits. Import as many Chess.com games as you want.",
      },
      {
        question: "Does it work without Chess.com Premium?",
        answer:
          "Absolutely. You only need a Chess.com username to load your public games. VoltChess does not require Chess.com Premium or a VoltChess account.",
      },
      {
        question: "How is this different from Chessigma or Chess It Up?",
        answer:
          "All three offer free Chess.com analysis with Stockfish. VoltChess runs the engine locally in your browser for privacy, includes an interactive onboarding tour, and supports coaches with an optional Academy product.",
      },
      {
        question: "What analysis features do I get?",
        answer:
          "Full game review: evaluation graph, move accuracy, ELO estimate, blunder and mistake highlighting, best-move suggestions, and phase-by-phase breakdown — powered by Stockfish 17.",
      },
    ],
    relatedBlogSlugs: [
      "chesscom-game-review-free",
      "voltchess-vs-chesscom-premium",
      "unlimited-free-chess-game-analysis",
    ],
  },
  {
    slug: "free-lichess-game-review",
    path: "/free-lichess-game-review",
    h1: "Free Lichess Game Review",
    intro: [
      "Review any Lichess game for free with Stockfish-powered analysis. Enter your Lichess username, select a recent game, and get a complete report with accuracy, blunders, and an evaluation graph.",
      "VoltChess imports your public Lichess games instantly. Analysis runs locally in your browser — unlimited reviews with no account required.",
    ],
    metaTitle: "Free Lichess Game Review & Analysis | VoltChess",
    metaDescription:
      "Review Lichess games for free with Stockfish. Enter your Lichess username, load any recent game, and get a full analysis report in seconds. Unlimited and free.",
    defaultTab: "lichess",
    faqs: [
      {
        question: "Can I analyze Lichess games without an account?",
        answer:
          "Yes. Enter any public Lichess username to load recent games. You do not need a Lichess or VoltChess account.",
      },
      {
        question: "Is there a limit on how many games I can review?",
        answer:
          "No daily cap. Analyze as many Lichess games as you want — Stockfish runs on your device, not a shared server queue.",
      },
      {
        question: "Does VoltChess support Lichess study PGNs?",
        answer:
          "You can paste any standard PGN on the PGN tab. For recent games, the Lichess username import is the fastest path.",
      },
    ],
    relatedBlogSlugs: [
      "lichess-game-review-free",
      "free-chess-game-review",
      "how-to-analyze-chess-games",
    ],
  },
  {
    slug: "free-chess-game-analysis",
    path: "/free-chess-game-analysis",
    h1: "Free Unlimited Chess Game Analysis",
    intro: [
      "Analyze any chess game for free with Stockfish 17 — unlimited reviews, no daily caps, no paywall. Import from Chess.com, Lichess, or paste a PGN file.",
      "VoltChess delivers professional-grade game review in seconds: move classification, accuracy scores, blunder detection, and an interactive evaluation graph. Everything runs in your browser.",
    ],
    metaTitle: "Free Unlimited Chess Game Analysis with Stockfish | VoltChess",
    metaDescription:
      "Unlimited free chess game analysis powered by Stockfish 17. Import PGN files, Chess.com and Lichess games. No daily caps, no premium tier, no sign-up required.",
    defaultTab: "chesscom",
    faqs: [
      {
        question: "Is VoltChess really free?",
        answer:
          "Yes — 100% free for game analysis. No credits, no subscription, no hidden premium tier for reviews.",
      },
      {
        question: "Which Stockfish version does VoltChess use?",
        answer:
          "Stockfish 17 runs locally in your browser via WebAssembly. A lightweight 6 MB lite build loads first for faster startup.",
      },
      {
        question: "Can I upload PGN files?",
        answer:
          "Yes. Switch to the PGN tab to paste or upload any standard PGN file for instant analysis.",
      },
    ],
    relatedBlogSlugs: [
      "unlimited-free-chess-game-analysis",
      "free-chess-analysis-stockfish",
      "analyze-pgn-online-free",
    ],
  },
];

export function getLandingPage(slug: string): LandingPageConfig | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
