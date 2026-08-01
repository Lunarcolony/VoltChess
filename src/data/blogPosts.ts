export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogStepItem {
  title: string;
  body: string;
}

export interface BlogChecklistItem {
  title: string;
  body: string;
  icon?: string;
}

export interface BlogGradeItem {
  classification: string;
  label: string;
  description: string;
}

export interface BlogCompareRow {
  feature: string;
  left: string;
  right: string;
}

export type BlogSection =
  | {
      type: "prose";
      heading?: string;
      paragraphs: string[];
    }
  | {
      type: "steps";
      heading?: string;
      steps: BlogStepItem[];
    }
  | {
      type: "checklist";
      heading?: string;
      items: BlogChecklistItem[];
    }
  | {
      type: "callout";
      title?: string;
      body: string;
      variant?: "tip" | "note";
    }
  | {
      type: "faq";
      heading?: string;
      items: BlogFaqItem[];
    }
  | {
      type: "loader";
      heading?: string;
      caption?: string;
    }
  | {
      type: "grades";
      heading?: string;
      items: BlogGradeItem[];
    }
  | {
      type: "compare";
      heading?: string;
      leftLabel: string;
      rightLabel: string;
      rows: BlogCompareRow[];
    };

export type BlogLoaderTab = "chesscom" | "lichess" | "pgn";

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  publishedAt: string;
  excerpt: string;
  icon?: string;
  sections: BlogSection[];
  showGameLoader?: boolean;
  defaultLoaderTab?: BlogLoaderTab;
  relatedSlugs?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "free-chess-game-review",
    title: "Free Chess Game Review — Analyze Every Move with Stockfish",
    metaTitle:
      "Free Chess Game Review Online | VoltChess — Stockfish Game Analysis",
    metaDescription:
      "Get a free chess game review for every game you play. VoltChess uses Stockfish to score accuracy, flag blunders, and show where you won or lost the game. No subscription.",
    keywords:
      "free chess game review, chess game review free, online game review chess, stockfish game review",
    publishedAt: "2025-06-12",
    excerpt:
      "See what a full game review report includes — accuracy, move grades, the evaluation graph, and critical moments — then load a game and review it free.",
    icon: "mdi:clipboard-text-search-outline",
    showGameLoader: true,
    defaultLoaderTab: "pgn",
    relatedSlugs: [
      "how-to-analyze-chess-games",
      "chesscom-game-review-free",
      "unlimited-free-chess-game-analysis",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "A chess game review is not a wall of engine lines. It is a structured report that answers three questions: where did the evaluation swing, which moves were mistakes or blunders, and how closely did you play the engine's top choices?",
          "VoltChess builds that report in your browser with Stockfish. You import a Chess.com link, a Lichess game, or a PGN, then step through the board with accuracy scores, classified moves, and an evaluation graph in one panel.",
        ],
      },
      {
        type: "loader",
        heading: "Load a game and open the review",
        caption:
          "Paste a Chess.com or Lichess URL, or drop a PGN. Analysis opens on the board as soon as Stockfish is ready.",
      },
      {
        type: "checklist",
        heading: "Anatomy of a VoltChess game review",
        items: [
          {
            title: "Evaluation graph",
            body: "A move-by-move curve of who was better. Flat stretches mean stable play; sharp drops mark the moments worth studying first.",
            icon: "mdi:chart-line",
          },
          {
            title: "Move classifications",
            body: "Best, excellent, inaccuracy, mistake, and blunder labels based on how much evaluation you lost versus Stockfish's top choice.",
            icon: "mdi:label-outline",
          },
          {
            title: "Accuracy scores",
            body: "Separate White and Black percentages summarizing how closely each side matched the engine, plus good-versus-bad move counts.",
            icon: "mdi:percent-outline",
          },
          {
            title: "Critical moments",
            body: "Jump from the Good and Bad lists straight to turning points instead of scrubbing through every move equally.",
            icon: "mdi:target",
          },
          {
            title: "Engine lines on the board",
            body: "Step through the game, show principal variations, and compare your move to the engine suggestion in the same position.",
            icon: "mdi:chess-knight",
          },
        ],
      },
      {
        type: "grades",
        heading: "Move grades you will see in the report",
        items: [
          {
            classification: "best",
            label: "Best",
            description: "Matched Stockfish's top choice.",
          },
          {
            classification: "excellent",
            label: "Excellent",
            description: "Near-best; tiny evaluation loss.",
          },
          {
            classification: "inaccuracy",
            label: "Inaccuracy",
            description: "Small slip that still keeps you in the game.",
          },
          {
            classification: "mistake",
            label: "Mistake",
            description: "Meaningful loss of advantage.",
          },
          {
            classification: "blunder",
            label: "Blunder",
            description: "Large drop — usually the study priority.",
          },
        ],
      },
      {
        type: "callout",
        title: "Free browser review vs paywalled Game Review",
        variant: "note",
        body: "Sites like Chess.com often gate full Game Review behind Premium. VoltChess runs Stockfish locally via WebAssembly: no daily review cap, no account required to start, and your PGN is not sent to a remote analysis queue.",
      },
      {
        type: "faq",
        heading: "Game review FAQ",
        items: [
          {
            question: "What formats can I import for a free game review?",
            answer:
              "Chess.com game URLs, Lichess game URLs, and standard PGN text or files. Public usernames also work when you pick a recent game from the loader.",
          },
          {
            question: "Do I need an account to review a game?",
            answer:
              "No. Load a game and start analysis without signing up. Academy features for coaches and students are optional and separate.",
          },
          {
            question:
              "Is the review the same as Chess.com Premium Game Review?",
            answer:
              "You get the same study essentials: accuracy, move grades, blunder highlighting, and an evaluation graph powered by Stockfish. Chess.com Premium adds platform-native visuals; VoltChess focuses on unlimited free review across Chess.com, Lichess, and PGN.",
          },
          {
            question: "Where does Stockfish run?",
            answer:
              "In your browser on your device. Heavier depth uses more CPU, but there is no shared server queue and no daily analysis credit system.",
          },
        ],
      },
    ],
  },
  {
    slug: "chesscom-game-review-free",
    title: "Free Chess.com Game Review — No Premium Required",
    metaTitle:
      "Free Chess.com Game Review Alternative | VoltChess — No Premium",
    metaDescription:
      "Analyze Chess.com games for free without Chess.com Premium. Import by link or PGN and get Stockfish game review, accuracy, and blunder detection on VoltChess.",
    keywords:
      "chess.com game review free, free chess.com analysis, chess.com alternative game review, analyze chess.com games free",
    publishedAt: "2025-06-12",
    excerpt:
      "Import any public Chess.com game and get accuracy, blunders, and an eval graph — without Chess.com Premium.",
    icon: "mdi:chess-pawn",
    showGameLoader: true,
    defaultLoaderTab: "chesscom",
    relatedSlugs: [
      "voltchess-vs-chesscom-premium",
      "free-chess-game-review",
      "how-to-analyze-chess-games",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Chess.com Game Review is useful, but full access often requires Premium. VoltChess is built for the same feedback loop — accuracy, move grades, evaluation graph — using Stockfish in your browser, with no subscription gate on public games.",
        ],
      },
      {
        type: "loader",
        heading: "Import a Chess.com game",
        caption:
          "Enter your Chess.com username, pick a recent game, or paste a game URL. Analysis starts on the board.",
      },
      {
        type: "steps",
        heading: "Three clicks to a full review",
        steps: [
          {
            title: "Copy the game URL or enter your username",
            body: "Open a finished game on Chess.com and copy the browser URL, or type your username into the Chess.com tab above and pick from recent games.",
          },
          {
            title: "Wait for Stockfish to finish the pass",
            body: "VoltChess loads the PGN with player names and ratings, then evaluates every position locally. Progress shows while the engine works.",
          },
          {
            title: "Jump to the Bad moves list",
            body: "Open the report panel, click your worst mistakes, and study those positions before scrolling the whole game.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "What you get without Premium",
        items: [
          {
            title: "Accuracy for both sides",
            body: "White and Black percentages plus estimated performance for the game.",
            icon: "mdi:percent-outline",
          },
          {
            title: "Blunder and mistake tags",
            body: "Clickable classifications so you land on the turning points immediately.",
            icon: "mdi:alert-circle-outline",
          },
          {
            title: "Evaluation graph",
            body: "See where the advantage swung without opening Chess.com Premium review.",
            icon: "mdi:chart-line",
          },
          {
            title: "No daily review cap",
            body: "Analyze a tournament batch or a night of blitz without burning credits.",
            icon: "mdi:infinity",
          },
        ],
      },
      {
        type: "faq",
        heading: "Chess.com import FAQ",
        items: [
          {
            question: "Do I need Chess.com Premium to use VoltChess?",
            answer:
              "No. You only need a public Chess.com username or game link. VoltChess does not require Chess.com Premium.",
          },
          {
            question: "Are private Chess.com games supported?",
            answer:
              "Public games import by username or URL. If a game is not publicly accessible, export the PGN from Chess.com and paste it into the PGN tab.",
          },
          {
            question: "Will my games be uploaded to a server?",
            answer:
              "Analysis runs in your browser with Stockfish WASM. You are not waiting in a remote analysis queue for the engine pass.",
          },
        ],
      },
    ],
  },
  {
    slug: "how-to-analyze-chess-games",
    title: "How to Analyze Your Chess Games (Step-by-Step Guide)",
    metaTitle:
      "How to Analyze Chess Games — Free Step-by-Step Guide | VoltChess",
    metaDescription:
      "Learn how to analyze chess games effectively. Import your PGN, read the evaluation graph, find blunders, and build a study routine with free Stockfish analysis.",
    keywords:
      "how to analyze chess games, chess game analysis guide, study chess games, analyze my chess games",
    publishedAt: "2025-06-12",
    excerpt:
      "A practical study routine: import a game, read the eval graph, isolate mistakes, and write one takeaway — not a full engine dump.",
    icon: "mdi:map-marker-path",
    showGameLoader: true,
    defaultLoaderTab: "chesscom",
    relatedSlugs: [
      "free-chess-game-review",
      "find-chess-blunders-free",
      "chess-game-analysis-for-beginners",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Analyzing your own games is the highest-leverage habit for players under 2000. The goal is not to memorize Stockfish's first line in every position. The goal is to find the two or three moments where the evaluation changed, understand why, and leave with a concrete takeaway you can reuse next game.",
          "This walkthrough uses VoltChess as the review board: import → evaluation graph → accuracy and classifications → critical positions → short notes.",
        ],
      },
      {
        type: "steps",
        heading: "The five-step review routine",
        steps: [
          {
            title: "Import the game",
            body: "Load a Chess.com link, Lichess URL, or PGN. For over-the-board games, export PGN from your scoresheet app, then start analysis so Stockfish evaluates every position.",
          },
          {
            title: "Read the evaluation graph first",
            body: "Ignore individual lines until you know where the story changed. Flat sections mean the position was stable; sharp drops mark mistakes. Write down those move numbers — that is your study queue.",
          },
          {
            title: "Check accuracy and classified moves",
            body: "Use the Good and Bad panels to jump to brilliancies, mistakes, and blunders. Filter to expensive errors first.",
          },
          {
            title: "Study only the critical positions",
            body: "On each turning point, pause before revealing the engine line: list your candidates, then compare. Was it calculation or judgment?",
          },
          {
            title: "Write one takeaway note",
            body: "Close with a single sentence you can reuse: opening rule, endgame pattern, or tactical theme. If you cannot phrase a takeaway, you reviewed too much data.",
          },
        ],
      },
      {
        type: "loader",
        heading: "Try it on a real game",
        caption:
          "Import a recent Chess.com, Lichess, or PGN game, then follow the steps above on the analysis board.",
      },
      {
        type: "callout",
        title: "Engine data vs understanding",
        variant: "tip",
        body: "Stockfish shows where you lost evaluation; it does not automatically teach you the idea. Spend most of your time on the position before the drop — your thought process — then check the engine to confirm.",
      },
      {
        type: "faq",
        heading: "Analysis FAQ",
        items: [
          {
            question: "How deep should I set Stockfish?",
            answer:
              "For a first pass, the default depth is enough to spot blunders and major swings. Increase depth only on the two or three critical positions you already marked.",
          },
          {
            question: "How often should I analyze?",
            answer:
              "Two or three serious reviews per week beat dumping twenty games into the engine. Consistency matters more than volume.",
          },
          {
            question: "Should beginners use engine analysis?",
            answer:
              "Yes — but start with blunders only. If a move lost roughly a pawn or more of evaluation, study it. Ignore tiny centipawn differences until tactics are solid.",
          },
          {
            question: "What if I do not understand the engine move?",
            answer:
              "Play through the first few plies and name the idea (check, trade, fix a weakness). If you still cannot explain it, note the theme and move on.",
          },
        ],
      },
    ],
  },
  {
    slug: "free-chess-analysis-stockfish",
    title: "Free Chess Analysis with Stockfish — In Your Browser",
    metaTitle:
      "Free Chess Analysis with Stockfish | VoltChess — Browser Engine",
    metaDescription:
      "Run Stockfish chess analysis free in your browser. Deep evaluation, multi-PV lines, game review, and blunder detection. No download, no subscription.",
    keywords:
      "free chess analysis, stockfish analysis free, stockfish online, chess engine analysis browser",
    publishedAt: "2025-06-12",
    excerpt:
      "Stockfish 17 runs in your browser on VoltChess — full-game review, multi-PV lines, and no install.",
    icon: "mdi:chip",
    showGameLoader: true,
    defaultLoaderTab: "pgn",
    relatedSlugs: [
      "free-chess-game-review",
      "unlimited-free-chess-game-analysis",
      "analyze-pgn-online-free",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Stockfish is the strongest widely used open-source chess engine. VoltChess ships Stockfish builds as WebAssembly so analysis happens on your device — no desktop install, no waiting for a shared server queue.",
        ],
      },
      {
        type: "loader",
        heading: "Run Stockfish on a game now",
        caption:
          "Load a PGN or platform game. Engine settings (depth, lines, threads) stay under Settings once you are on the analysis board.",
      },
      {
        type: "checklist",
        heading: "What Stockfish powers on VoltChess",
        items: [
          {
            title: "Position evaluation",
            body: "Centipawn scores and mate distances for the current position.",
            icon: "mdi:gauge",
          },
          {
            title: "Best-move arrows",
            body: "Visual hints on the board for Stockfish's top choice.",
            icon: "mdi:arrow-top-right",
          },
          {
            title: "Multi-PV lines",
            body: "Compare alternative candidate moves, not just one principal variation.",
            icon: "mdi:file-tree-outline",
          },
          {
            title: "Full-game pass",
            body: "Every move classified for the report panel after the analysis pass finishes.",
            icon: "mdi:playlist-check",
          },
        ],
      },
      {
        type: "callout",
        title: "Privacy note",
        variant: "note",
        body: "Because the engine runs locally, heavier analysis uses your CPU rather than a remote machine. That is also why there is no daily analysis credit system.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Which Stockfish version does VoltChess use?",
            answer:
              "VoltChess bundles modern Stockfish builds including Stockfish 17 and lighter variants. You can switch engines in Settings based on device speed.",
          },
          {
            question: "Do I need to download Stockfish separately?",
            answer:
              "No. The WebAssembly build loads in the browser when you open analysis.",
          },
          {
            question: "Is browser Stockfish weaker than a desktop install?",
            answer:
              "Same engine family; depth and threads depend on your device. For post-game review, browser Stockfish is more than strong enough to find blunders and major swings.",
          },
        ],
      },
    ],
  },
  {
    slug: "find-chess-blunders-free",
    title: "Find Chess Blunders Free — Spot Mistakes Instantly",
    metaTitle:
      "Find Chess Blunders Free | VoltChess Blunder & Mistake Detection",
    metaDescription:
      "Find blunders and mistakes in your chess games for free. VoltChess classifies every move and lets you jump to the worst errors with one click.",
    keywords:
      "chess blunder finder, find chess mistakes, blunder detection chess, chess mistake analyzer",
    publishedAt: "2025-06-12",
    excerpt:
      "Jump straight to the moves that cost you the game. VoltChess tags blunders and mistakes automatically.",
    icon: "mdi:alert-octagon-outline",
    showGameLoader: true,
    defaultLoaderTab: "chesscom",
    relatedSlugs: [
      "how-to-analyze-chess-games",
      "chess-move-accuracy-scores",
      "free-chess-game-review",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Most games are decided by a handful of moves. After a loss, open the Bad list first — not the opening. VoltChess tags every move by how much evaluation you lost compared with Stockfish's top choice, then lets you click straight to that position on the board.",
        ],
      },
      {
        type: "loader",
        heading: "Find the blunders in a recent game",
        caption:
          "Load a game, wait for the analysis pass, then open the Bad moves in the report panel.",
      },
      {
        type: "grades",
        heading: "How VoltChess labels mistakes",
        items: [
          {
            classification: "inaccuracy",
            label: "Inaccuracy",
            description: "Small slip — note it if it repeats as a theme.",
          },
          {
            classification: "mistake",
            label: "Mistake",
            description:
              "Clear loss of advantage; usually worth a short pause.",
          },
          {
            classification: "blunder",
            label: "Blunder",
            description:
              "Large evaluation drop — study these first every session.",
          },
          {
            classification: "best",
            label: "Best / Excellent",
            description: "Use the Good list to see what you already do well.",
          },
        ],
      },
      {
        type: "steps",
        heading: "A five-minute blunder hunt",
        steps: [
          {
            title: "Open the Bad panel",
            body: "After analysis finishes, click the worst blunder — usually the largest evaluation drop.",
          },
          {
            title: "Cover the engine line",
            body: "Before revealing Stockfish, write one candidate you missed. Then compare.",
          },
          {
            title: "Name the theme",
            body: "Tactic, hanging piece, king safety, or wrong plan. One word is enough for your notes.",
          },
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "What counts as a blunder?",
            answer:
              "A move that loses a large amount of evaluation versus the engine's top choice — typically enough to change the practical result of the position.",
          },
          {
            question: "Should I study every inaccuracy?",
            answer:
              "No. Prioritize blunders and mistakes. Inaccuracies matter when the same theme keeps showing up across games.",
          },
        ],
      },
    ],
  },
  {
    slug: "analyze-pgn-online-free",
    title: "Analyze PGN Files Online Free",
    metaTitle: "Analyze PGN Online Free | VoltChess PGN Chess Analyzer",
    metaDescription:
      "Upload or paste a PGN file and analyze it free online. Stockfish game review, accuracy, and move list — no software install required.",
    keywords:
      "analyze pgn online, pgn analyzer free, chess pgn analysis, upload pgn chess",
    publishedAt: "2025-06-12",
    excerpt:
      "Paste or upload any PGN and get a full Stockfish report in seconds — no desktop software.",
    icon: "mdi:file-document-outline",
    showGameLoader: true,
    defaultLoaderTab: "pgn",
    relatedSlugs: [
      "free-chess-analysis-stockfish",
      "free-chess-game-review",
      "unlimited-free-chess-game-analysis",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "PGN is the universal chess game format. Whether your file comes from Chess.com export, Lichess, ChessBase, or a tournament arbiter, VoltChess accepts pasted text or file upload and runs a full Stockfish review in the browser.",
        ],
      },
      {
        type: "loader",
        heading: "Paste or upload a PGN",
        caption:
          "Use the PGN tab below. Headers (players, event, result) appear on the board once the game loads.",
      },
      {
        type: "steps",
        heading: "From file to report",
        steps: [
          {
            title: "Export or copy the PGN",
            body: "From Chess.com or Lichess, use Share / Export PGN. From ChessBase or other tools, save a standard .pgn file.",
          },
          {
            title: "Paste into VoltChess or choose the file",
            body: "Open the PGN tab, paste the text or upload the file, then confirm the load.",
          },
          {
            title: "Review the graph and classifications",
            body: "When Stockfish finishes, use accuracy and the Good/Bad lists the same way you would for a platform import.",
          },
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "Does VoltChess support multi-game PGN files?",
            answer:
              "Load one game at a time for analysis. If your file contains multiple games, paste the game you want to study or split the file first.",
          },
          {
            question: "Is PGN analysis free?",
            answer:
              "Yes. There is no upload fee and no daily cap on PGN reviews.",
          },
        ],
      },
    ],
  },
  {
    slug: "lichess-game-review-free",
    title: "Free Lichess Game Review & Analysis",
    metaTitle: "Free Lichess Game Review | VoltChess — Analyze Lichess Games",
    metaDescription:
      "Analyze Lichess games for free with Stockfish on VoltChess. Paste a Lichess game URL or PGN export for full game review and accuracy scores.",
    keywords:
      "lichess game review, lichess analysis free, analyze lichess games, lichess game analysis tool",
    publishedAt: "2025-06-12",
    excerpt:
      "Import any public Lichess game by username or URL and get a Stockfish report with accuracy and blunders.",
    icon: "mdi:horse",
    showGameLoader: true,
    defaultLoaderTab: "lichess",
    relatedSlugs: [
      "chesscom-game-review-free",
      "free-chess-game-review",
      "how-to-analyze-chess-games",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Lichess already offers strong free analysis. VoltChess is useful when you want the same review layout across Chess.com and Lichess games, a dedicated report panel, or unlimited imports in one place.",
        ],
      },
      {
        type: "loader",
        heading: "Load a Lichess game",
        caption:
          "Enter a Lichess username for recent games, or paste a lichess.org game URL.",
      },
      {
        type: "checklist",
        heading: "Why review Lichess games on VoltChess",
        items: [
          {
            title: "Same UI as Chess.com imports",
            body: "One report style whether the game came from Lichess, Chess.com, or PGN.",
            icon: "mdi:view-dashboard-outline",
          },
          {
            title: "Local Stockfish pass",
            body: "Engine analysis runs in your browser with no VoltChess account required.",
            icon: "mdi:laptop",
          },
          {
            title: "Jump to critical moments",
            body: "Good/Bad lists and the evaluation graph work the same as on other imports.",
            icon: "mdi:target",
          },
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "Can I analyze someone else's Lichess games?",
            answer:
              "Yes, if the games are public. Enter their username or paste a public game URL.",
          },
          {
            question: "Do I need a Lichess account?",
            answer:
              "Not to review public games on VoltChess. You only need a username or URL.",
          },
        ],
      },
    ],
  },
  {
    slug: "chess-move-accuracy-scores",
    title: "Chess Move Accuracy — What Your Score Really Means",
    metaTitle: "Chess Move Accuracy Explained | VoltChess Game Analysis Guide",
    metaDescription:
      "Understand chess move accuracy scores from engine analysis. Learn how VoltChess calculates accuracy and how to use it to improve your play.",
    keywords:
      "chess move accuracy, accuracy score chess, chess accuracy analysis, move accuracy chess.com",
    publishedAt: "2025-06-12",
    excerpt:
      "Accuracy summarizes how closely you matched the engine — here is how to read it without chasing a vanity number.",
    icon: "mdi:percent-outline",
    showGameLoader: true,
    defaultLoaderTab: "pgn",
    relatedSlugs: [
      "find-chess-blunders-free",
      "how-to-analyze-chess-games",
      "free-chess-game-review",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Accuracy is a percentage that summarizes how close your moves were to Stockfish's best choices, weighted by how hard the position was. A 90% game usually means strong practical play; dropping below 70% often means several significant mistakes — but the number alone never tells you what to study.",
        ],
      },
      {
        type: "checklist",
        heading: "How to use accuracy on VoltChess",
        items: [
          {
            title: "Compare sides, not just yourself",
            body: "White and Black accuracy sit side by side so you see who played cleaner, not only your ego score.",
            icon: "mdi:compare-horizontal",
          },
          {
            title: "Pair it with Bad moves",
            body: "A high accuracy with one late blunder still lost. Always open the expensive errors.",
            icon: "mdi:link-variant",
          },
          {
            title: "Track themes across games",
            body: "If accuracy dips in the same phase (e.g. late middlegame), that is a study signal.",
            icon: "mdi:chart-timeline-variant",
          },
        ],
      },
      {
        type: "grades",
        heading: "Accuracy is built from move grades",
        items: [
          {
            classification: "best",
            label: "Best",
            description: "Helps the accuracy score the most.",
          },
          {
            classification: "excellent",
            label: "Excellent",
            description: "Still strong; tiny deviations.",
          },
          {
            classification: "mistake",
            label: "Mistake",
            description: "Pulls accuracy down meaningfully.",
          },
          {
            classification: "blunder",
            label: "Blunder",
            description: "Hurts accuracy and usually the result.",
          },
        ],
      },
      {
        type: "loader",
        heading: "Check accuracy on one of your games",
        caption:
          "Load a game and read White/Black accuracy in the report panel after analysis.",
      },
      {
        type: "callout",
        title: "Do not chase 98%",
        variant: "tip",
        body: "Practical chess is about decisions under time pressure. Use accuracy to find phases that need work, not as a scoreboard for every blitz session.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Is VoltChess accuracy the same as Chess.com accuracy?",
            answer:
              "Both summarize closeness to engine choices, but exact formulas differ by platform. Treat the number as a relative signal inside VoltChess, then study the classified moves.",
          },
          {
            question: "Why is my accuracy high if I lost?",
            answer:
              "One blunder can decide a game while the rest of your moves stayed close to the engine. Open the Bad list — that single moment is the lesson.",
          },
        ],
      },
    ],
  },
  {
    slug: "chess-game-analysis-for-beginners",
    title: "Chess Game Analysis for Beginners",
    metaTitle: "Chess Game Analysis for Beginners | Free Guide | VoltChess",
    metaDescription:
      "New to chess game review? Learn how beginners can use free Stockfish analysis to find mistakes, understand evaluations, and improve faster.",
    keywords:
      "chess analysis for beginners, beginner chess game review, learn chess analysis, improve chess beginner",
    publishedAt: "2025-06-12",
    excerpt:
      "You do not need master-level theory to benefit from game review. Start with blunders and a fifteen-minute routine.",
    icon: "mdi:school-outline",
    showGameLoader: true,
    defaultLoaderTab: "chesscom",
    relatedSlugs: [
      "how-to-analyze-chess-games",
      "find-chess-blunders-free",
      "free-chess-game-review",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Beginners often assume engine analysis is too advanced. It is not — you only need to focus on the big mistakes. If a move lost about a pawn or more of evaluation, it deserves attention. Ignore tiny centipawn noise until tactics and development habits are solid.",
        ],
      },
      {
        type: "steps",
        heading: "A fifteen-minute beginner routine",
        steps: [
          {
            title: "Five minutes on the opening",
            body: "Did you develop pieces, castle, and connect rooks? Ignore deep engine opening prep.",
          },
          {
            title: "Five minutes on the first blunder",
            body: "Open the Bad list, jump to the first big drop, and ask what you missed (hanging piece, fork, mate threat).",
          },
          {
            title: "Five minutes on the endgame transition",
            body: "When queens came off or the last pawn race started, were your king and rook active?",
          },
        ],
      },
      {
        type: "loader",
        heading: "Review one game as a beginner",
        caption:
          "Load a recent game and practice the three timers above. Stop when fifteen minutes are up.",
      },
      {
        type: "callout",
        title: "One game a day beats a binge",
        variant: "tip",
        body: "A short daily review compounds faster than dumping ten games into the engine on Sunday night and remembering none of them.",
      },
      {
        type: "faq",
        items: [
          {
            question: "What rating should start using engines?",
            answer:
              "Any rating can use engines for blunder checking. Keep the focus narrow: hanging pieces and missed one-movers first.",
          },
          {
            question: "Should I memorize the engine's best move?",
            answer:
              "No. Memorize the idea (protect the piece, develop, check the king). Ideas transfer; long variations usually do not at beginner level.",
          },
        ],
      },
    ],
  },
  {
    slug: "unlimited-free-chess-game-analysis",
    title: "Unlimited Free Chess Game Analysis — No Daily Caps",
    metaTitle: "Unlimited Free Chess Game Analysis | VoltChess — No Limits",
    metaDescription:
      "Analyze unlimited chess games for free with no daily caps. VoltChess offers full Stockfish game review, PGN import, and blunder detection without a paywall.",
    keywords:
      "unlimited chess analysis free, free chess analysis no limit, chess analysis without subscription",
    publishedAt: "2025-06-12",
    excerpt:
      "No credits, no daily cap, no premium tier. Analyze as many games as your device can handle.",
    icon: "mdi:infinity",
    showGameLoader: true,
    defaultLoaderTab: "pgn",
    relatedSlugs: [
      "free-chess-game-review",
      "free-chess-analysis-stockfish",
      "voltchess-vs-chesscom-premium",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Many tools limit free users to one or two analyses per day. VoltChess does not. Load a tournament batch, review every game from a weekend blitz session, or re-run a position at higher depth — the product stays free because Stockfish runs on your device.",
        ],
      },
      {
        type: "loader",
        heading: "Analyze another game — no meter",
        caption:
          "There is no credit counter after this load. Import the next game whenever you are ready.",
      },
      {
        type: "checklist",
        heading: "What unlimited means here",
        items: [
          {
            title: "No daily review credits",
            body: "You are not rationed by a free-tier meter.",
            icon: "mdi:calendar-remove",
          },
          {
            title: "No account wall to start",
            body: "Public analysis works without signing up.",
            icon: "mdi:account-off-outline",
          },
          {
            title: "Device is the limit",
            body: "Deeper analysis uses more CPU. That is the tradeoff for local Stockfish.",
            icon: "mdi:cpu-64-bit",
          },
          {
            title: "Chess.com, Lichess, and PGN",
            body: "Unlimited applies across the import methods VoltChess supports.",
            icon: "mdi:swap-horizontal",
          },
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "Is there really no premium analysis tier?",
            answer:
              "Public game review on VoltChess is free. Optional Academy features for coaches and students are separate from the unlimited analysis tool.",
          },
          {
            question: "Why do some sites cap free analysis?",
            answer:
              "Server-side engines cost money per game. VoltChess shifts that work to your browser, so there is no shared queue to meter.",
          },
        ],
      },
    ],
  },
  {
    slug: "voltchess-vs-chesscom-premium",
    title: "VoltChess vs Chess.com Premium — Free Game Review Alternative",
    metaTitle: "VoltChess vs Chess.com Premium Game Review | Free Alternative",
    metaDescription:
      "Compare VoltChess free game review to Chess.com Premium analysis. Same Stockfish-powered accuracy, blunders, and eval graph — no subscription required.",
    keywords:
      "voltchess vs chess.com premium, chess.com game review free alternative, free chess.com analysis",
    publishedAt: "2026-06-21",
    excerpt:
      "Side-by-side: what Chess.com Premium Game Review includes versus free VoltChess review.",
    icon: "mdi:scale-balance",
    showGameLoader: true,
    defaultLoaderTab: "chesscom",
    relatedSlugs: [
      "chesscom-game-review-free",
      "unlimited-free-chess-game-analysis",
      "free-chess-game-review",
    ],
    sections: [
      {
        type: "prose",
        paragraphs: [
          "Chess.com Premium includes Game Review with move classification, accuracy, and an evaluation graph. VoltChess offers the same core study loop for free: import a public Chess.com game, run Stockfish in your browser, and open a full report without a subscription.",
        ],
      },
      {
        type: "compare",
        heading: "Feature comparison",
        leftLabel: "Chess.com Premium",
        rightLabel: "VoltChess",
        rows: [
          {
            feature: "Move grades & blunders",
            left: "Yes (Premium)",
            right: "Yes (free)",
          },
          {
            feature: "Accuracy scores",
            left: "Yes (Premium)",
            right: "Yes (free)",
          },
          {
            feature: "Evaluation graph",
            left: "Yes (Premium)",
            right: "Yes (free)",
          },
          {
            feature: "Daily review limits",
            left: "Membership rules apply",
            right: "No daily cap",
          },
          {
            feature: "Where analysis runs",
            left: "Chess.com servers / product",
            right: "Your browser (Stockfish WASM)",
          },
          {
            feature: "Lichess + PGN import",
            left: "Platform-focused",
            right: "Chess.com, Lichess, PGN",
          },
          {
            feature: "Price for core review",
            left: "Subscription",
            right: "$0",
          },
        ],
      },
      {
        type: "loader",
        heading: "Try VoltChess on a Chess.com game",
        caption:
          "Enter your Chess.com username or paste a game link — no Premium required.",
      },
      {
        type: "callout",
        title: "When Premium still makes sense",
        variant: "note",
        body: "If you want Chess.com-native lessons, bots, and platform integration, Premium may still be worth it. If your goal is studying your own games without another subscription, VoltChess covers that job.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Can VoltChess replace Chess.com Premium entirely?",
            answer:
              "For game review and blunder study, yes for many players. Premium still includes other Chess.com features VoltChess does not try to copy.",
          },
          {
            question: "How do I switch a review workflow?",
            answer:
              "Play on Chess.com as usual, then open /free-chess-com-analysis on VoltChess, load the game, and review there.",
          },
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getBlogFaqs(post: BlogPost): BlogFaqItem[] {
  return post.sections.flatMap((section) =>
    section.type === "faq" ? section.items : []
  );
}
