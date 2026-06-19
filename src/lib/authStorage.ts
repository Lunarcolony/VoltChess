import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import type { User } from "@/types/user";

const USER_CACHE = "voltchess_user";

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
