import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api, { refreshAccessToken } from "@/api";
import { ENABLE_AUTHENTICATION } from "@/constants";
import {
  clearAuthStorage,
  hasStoredSession,
  readCachedUser,
  setTokens,
  writeCachedUser,
} from "@/lib/authStorage";
import type { User } from "@/types/user";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    ENABLE_AUTHENTICATION ? readCachedUser() : null
  );
  const [loading, setLoading] = useState(
    () => ENABLE_AUTHENTICATION && hasStoredSession()
  );

  const refreshUser = useCallback(async () => {
    if (!ENABLE_AUTHENTICATION) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (!hasStoredSession()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
    }

    // Renew the access token up front when a refresh token is available. This
    // keeps a reload from depending on a 401 → retry round-trip and, crucially,
    // `refreshAccessToken` only clears the session when the refresh token
    // itself is rejected (a real, permanent auth failure) — transient
    // network/CORS errors leave the session intact.
    await refreshAccessToken().catch(() => null);
    if (!hasStoredSession()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<User>("/api/me/");
      setUser(res.data);
      writeCachedUser(res.data);
    } catch {
      // We get here when `/api/me/` (and the interceptor's refresh retry) could
      // not complete. Only sign the user out if the session was actually
      // invalidated — i.e. the refresh token was rejected, which clears
      // storage. Otherwise this is a transient failure (flaky backend/tunnel,
      // offline, CORS hiccup); keep the cached session so a reload does not
      // bounce an otherwise-valid user back to the login page.
      if (!hasStoredSession() || !cached) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Keep the session alive while the tab is open: proactively rotate the
  // access token well before it expires so an actively-used app effectively
  // never forces a re-login (and avoids a 401 round-trip on the next request).
  useEffect(() => {
    if (!ENABLE_AUTHENTICATION) return;
    const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h (< 12h access lifetime)
    const tick = () => {
      if (hasStoredSession()) void refreshAccessToken();
    };
    const id = window.setInterval(tick, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("voltchess:auth-expired", onExpired);
    return () =>
      window.removeEventListener("voltchess:auth-expired", onExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<{ access: string; refresh: string }>(
      "/api/token/",
      { username, password }
    );
    setTokens(res.data.access, res.data.refresh);

    try {
      const me = await api.get<User>("/api/me/");
      setUser(me.data);
      writeCachedUser(me.data);
      setLoading(false);
      return me.data;
    } catch {
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      throw new Error("Signed in but could not load your profile.");
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user && hasStoredSession(),
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
