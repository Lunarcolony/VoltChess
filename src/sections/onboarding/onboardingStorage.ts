import {
  CHESSCOM_USERNAME_KEY,
  LICHESS_USERNAME_KEY,
  ONBOARDING_COMPLETE_KEY,
  type OnboardingPlatform,
  type StoredUsername,
} from "./constants";

function parseUsernameList(raw: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string") {
      return parsed.split(",")[0]?.trim() ?? "";
    }
  } catch {
    return raw.split(",")[0]?.trim() ?? "";
  }
  return "";
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export function getStoredUsername(): StoredUsername | null {
  if (typeof window === "undefined") return null;

  const chessCom = parseUsernameList(
    localStorage.getItem(CHESSCOM_USERNAME_KEY)
  );
  if (chessCom) {
    return { username: chessCom, platform: "chesscom" };
  }

  const lichess = parseUsernameList(localStorage.getItem(LICHESS_USERNAME_KEY));
  if (lichess) {
    return { username: lichess, platform: "lichess" };
  }

  return null;
}

function readUsernameList(key: string): string[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string") {
      return parsed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function saveUsername(
  username: string,
  platform: OnboardingPlatform
): void {
  const key =
    platform === "chesscom" ? CHESSCOM_USERNAME_KEY : LICHESS_USERNAME_KEY;
  const trimmed = username.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();
  const updated = [
    trimmed,
    ...readUsernameList(key).filter((u) => u.toLowerCase() !== lower),
  ].slice(0, 8);

  localStorage.setItem(key, JSON.stringify(updated.join(",")));
}
