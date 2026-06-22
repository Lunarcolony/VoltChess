export const ONBOARDING_COMPLETE_KEY = "voltchess-onboarding-complete";
export const CHESSCOM_USERNAME_KEY = "chesscom-username";
export const LICHESS_USERNAME_KEY = "lichess-username";

export type OnboardingPlatform = "chesscom" | "lichess";

export interface StoredUsername {
  username: string;
  platform: OnboardingPlatform;
}
