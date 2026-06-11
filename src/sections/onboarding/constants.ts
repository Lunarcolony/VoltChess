export const ONBOARDING_COMPLETE_KEY = "voltchess-onboarding-complete";
export const CHESSCOM_USERNAME_KEY = "chesscom-username";
export const LICHESS_USERNAME_KEY = "lichess-username";

export type OnboardingPlatform = "chesscom" | "lichess";

export interface StoredUsername {
  username: string;
  platform: OnboardingPlatform;
}

export const ANALYSIS_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Game Analysis",
    content:
      "Your game is loaded and the engine is analyzing each move. Let's walk through the key features.",
  },
  {
    id: "report-tab",
    target: "report-tab",
    title: "Report tab",
    content:
      "The Report tab summarizes your game — accuracy scores, move quality, and critical moments.",
    placement: "bottom" as const,
  },
  {
    id: "eval-graph",
    target: "eval-graph",
    title: "Evaluation graph",
    content:
      "This graph shows how the position changed over time. Spikes often mean blunders or missed tactics.",
    placement: "bottom" as const,
  },
  {
    id: "accuracy",
    target: "accuracy",
    title: "Accuracy scores",
    content:
      "See each player's accuracy percentage and how many good vs. bad moves they played.",
    placement: "bottom" as const,
  },
  {
    id: "classification",
    target: "classification",
    title: "Move classification",
    content:
      "Every move is classified — from perfect and best to inaccuracies, mistakes, and blunders.",
    placement: "top" as const,
  },
  {
    id: "analysis-tab",
    target: "analysis-tab",
    title: "Analysis tab",
    content:
      "Open the Analysis tab for engine lines, best moves, and deep position evaluation.",
    placement: "bottom" as const,
  },
  {
    id: "bottom-nav",
    target: "bottom-nav",
    title: "Move navigation",
    content:
      "Use these controls to step through moves, jump to the start or end, and review the game on the board.",
    placement: "top" as const,
  },
  {
    id: "done",
    title: "You're all set!",
    content:
      "Load more games from the home page anytime. Happy analyzing!",
  },
] as const;
