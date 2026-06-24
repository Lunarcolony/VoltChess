import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { debug, maskToken } from "@/lib/debug";
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
    debug.log("storage", "migrated legacy access token → voltchess_access", {
      token: maskToken(legacyAccess),
    });
  }
  if (legacyRefresh && !localStorage.getItem(REFRESH_TOKEN)) {
    localStorage.setItem(REFRESH_TOKEN, legacyRefresh);
    debug.log("storage", "migrated legacy refresh token → voltchess_refresh", {
      token: maskToken(legacyRefresh),
    });
  }

  if (legacyAccess) localStorage.removeItem(LEGACY_ACCESS);
  if (legacyRefresh) localStorage.removeItem(LEGACY_REFRESH);
  if (legacyAccess || legacyRefresh) {
    debug.log("storage", "legacy auth key migration complete");
  }
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
  debug.log("storage", "wrote tokens to localStorage", {
    access: maskToken(access),
    refresh: maskToken(refresh),
    keys: [ACCESS_TOKEN, REFRESH_TOKEN],
  });
}

export function clearAuthStorage(): void {
  debug.log("storage", "clearing all auth storage", {
    keys: [
      ACCESS_TOKEN,
      REFRESH_TOKEN,
      USER_CACHE,
      LEGACY_ACCESS,
      LEGACY_REFRESH,
    ],
  });
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(USER_CACHE);
  localStorage.removeItem(LEGACY_ACCESS);
  localStorage.removeItem(LEGACY_REFRESH);
  if (typeof window !== "undefined") {
    debug.log("storage", "dispatching voltchess:auth-expired event");
    window.dispatchEvent(new Event("voltchess:auth-expired"));
  }
}

export function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_CACHE);
  if (!raw) {
    debug.log("storage", "read cached user — miss (no entry)");
    return null;
  }
  try {
    const user = JSON.parse(raw) as User;
    debug.log("storage", "read cached user — hit", {
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    return user;
  } catch {
    debug.warn("storage", "cached user JSON corrupt — removing entry");
    localStorage.removeItem(USER_CACHE);
    return null;
  }
}

export function writeCachedUser(user: User): void {
  localStorage.setItem(USER_CACHE, JSON.stringify(user));
  debug.log("storage", "wrote cached user to localStorage", {
    userId: user.id,
    username: user.username,
    role: user.role,
    key: USER_CACHE,
  });
}
