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
import { debug, maskToken } from "@/lib/debug";
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
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
  const [user, setUser] = useState<User | null>(() => {
    if (!ENABLE_AUTHENTICATION) return null;
    const cached = readCachedUser();
    debug.log("auth", "AuthProvider init — hydrated user from cache", {
      cached: !!cached,
      username: cached?.username,
      role: cached?.role,
    });
    return cached;
  });
  const [loading, setLoading] = useState(() => {
    const session = ENABLE_AUTHENTICATION && hasStoredSession();
    debug.log("auth", "AuthProvider init — loading state", {
      loading: session,
      authEnabled: ENABLE_AUTHENTICATION,
      hasSession: session,
    });
    return session;
  });

  const refreshUser = useCallback(async () => {
    debug.log("auth", "refreshUser — start", {
      authEnabled: ENABLE_AUTHENTICATION,
      hasSession: hasStoredSession(),
      access: maskToken(getAccessToken()),
      refresh: maskToken(getRefreshToken()),
    });

    if (!ENABLE_AUTHENTICATION) {
      debug.log("auth", "refreshUser — auth disabled, clearing user");
      setUser(null);
      setLoading(false);
      return;
    }

    if (!hasStoredSession()) {
      debug.log("auth", "refreshUser — no stored session, clearing user");
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      debug.log(
        "auth",
        "refreshUser — applying cached user while /api/me/ loads",
        {
          username: cached.username,
          role: cached.role,
        }
      );
      setUser(cached);
    }

    try {
      debug.log("auth", "refreshUser — GET /api/me/");
      const res = await api.get<User>("/api/me/");
      debug.log("auth", "refreshUser — /api/me/ success", {
        userId: res.data.id,
        username: res.data.username,
        role: res.data.role,
      });
      setUser(res.data);
      writeCachedUser(res.data);
    } catch (err) {
      debug.warn("auth", "refreshUser — /api/me/ failed", {
        stillHasSession: hasStoredSession(),
        message: err instanceof Error ? err.message : String(err),
      });
      if (!hasStoredSession()) {
        setUser(null);
      }
    } finally {
      setLoading(false);
      debug.log("auth", "refreshUser — complete", { loading: false });
    }
  }, []);

  useEffect(() => {
    debug.log("auth", "AuthProvider mounted — calling refreshUser");
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!ENABLE_AUTHENTICATION) return;
    const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
    debug.log("auth", "proactive refresh timer started", {
      intervalHours: REFRESH_INTERVAL_MS / 3_600_000,
    });
    const tick = () => {
      if (hasStoredSession()) {
        debug.log("auth", "proactive refresh timer tick — refreshing token");
        void refreshAccessToken();
      }
    };
    const id = window.setInterval(tick, REFRESH_INTERVAL_MS);
    return () => {
      debug.log("auth", "proactive refresh timer cleared");
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      debug.warn("auth", "voltchess:auth-expired — clearing user state");
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("voltchess:auth-expired", onExpired);
    return () =>
      window.removeEventListener("voltchess:auth-expired", onExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    debug.log("auth", "login — POST /api/token/", { username });
    const res = await api.post<{ access: string; refresh: string }>(
      "/api/token/",
      { username, password }
    );
    debug.log("auth", "login — tokens received, persisting", {
      access: maskToken(res.data.access),
      refresh: maskToken(res.data.refresh),
    });
    setTokens(res.data.access, res.data.refresh);

    try {
      debug.log("auth", "login — GET /api/me/");
      const me = await api.get<User>("/api/me/");
      debug.log("auth", "login — success", {
        userId: me.data.id,
        username: me.data.username,
        role: me.data.role,
      });
      setUser(me.data);
      writeCachedUser(me.data);
      setLoading(false);
      return me.data;
    } catch (err) {
      debug.error("auth", "login — profile load failed, rolling back session", {
        message: err instanceof Error ? err.message : String(err),
      });
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      throw new Error("Signed in but could not load your profile.");
    }
  }, []);

  const logout = useCallback(() => {
    debug.log("auth", "logout — clearing storage and user state");
    clearAuthStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: hasStoredSession(),
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser]
  );

  useEffect(() => {
    debug.log("auth", "auth state changed", {
      loading,
      isAuthenticated: hasStoredSession(),
      userId: user?.id,
      username: user?.username,
      role: user?.role,
    });
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
