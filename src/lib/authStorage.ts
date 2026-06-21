import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import type { User } from "@/types/user";

const USER_CACHE = "voltchess_user";
const LEGACY_ACCESS = "access";
const LEGACY_REFRESH = "refresh";

/** One-time migration from generic keys that could be overwritten by other apps. */
function migrateLegacyAuthKeys(): void {
  if (typeof window === "undefined") return;

  const legacyAccess = localStorage.getItem(LEGACY_ACCESS);
  const legacyRefresh = localStorage.getItem(LEGACY_REFRESH);

  if (legacyAccess && !localStorage.getItem(ACCESS_TOKEN)) {
    localStorage.setItem(ACCESS_TOKEN, legacyAccess);
  }
  if (legacyRefresh && !localStorage.getItem(REFRESH_TOKEN)) {
    localStorage.setItem(REFRESH_TOKEN, legacyRefresh);
  }

  if (legacyAccess) localStorage.removeItem(LEGACY_ACCESS);
  if (legacyRefresh) localStorage.removeItem(LEGACY_REFRESH);
}

migrateLegacyAuthKeys();

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN);
}

export function hasStoredSession(): boolean {
  return !!(getAccessToken() || getRefreshToken());
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN, access);
  localStorage.setItem(REFRESH_TOKEN, refresh);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(USER_CACHE);
  localStorage.removeItem(LEGACY_ACCESS);
  localStorage.removeItem(LEGACY_REFRESH);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("voltchess:auth-expired"));
  }
}

export function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_CACHE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_CACHE);
    return null;
  }
}

export function writeCachedUser(user: User): void {
  localStorage.setItem(USER_CACHE, JSON.stringify(user));
}
