/**
 * Verbose step-by-step console logging for auth, API, storage, and background
 * workers. Enabled by default in dev; in production toggle with:
 *
 *   localStorage.setItem('voltchess_debug', '1'); location.reload()
 *   localStorage.removeItem('voltchess_debug'); location.reload()
 *
 * Or set VITE_VOLT_DEBUG=true at build time.
 */

export type DebugCategory =
  | "auth"
  | "storage"
  | "api"
  | "queue"
  | "sync"
  | "idb"
  | "route"
  | "bootstrap"
  | "query";

const STORAGE_KEY = "voltchess_debug";

function readStorageFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function isEnabled(): boolean {
  if (import.meta.env.VITE_VOLT_DEBUG === "true") return true;
  if (import.meta.env.DEV) return true;
  return readStorageFlag();
}

function label(category: DebugCategory): string {
  return `[voltchess:${category}]`;
}

function serialize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value instanceof Error) {
      out[key] = { message: value.message, name: value.name };
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Redact JWTs — show prefix + length only. */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "(none)";
  if (token.length <= 12) return "***";
  return `${token.slice(0, 8)}…(${token.length} chars)`;
}

function log(
  level: "log" | "warn" | "error",
  category: DebugCategory,
  step: string,
  data?: Record<string, unknown>
) {
  if (!isEnabled()) return;
  const tag = label(category);
  const ts = new Date().toISOString().slice(11, 23);
  const msg = `${tag} ${ts} ${step}`;
  if (data && Object.keys(data).length > 0) {
    console[level](msg, serialize(data));
  } else {
    console[level](msg);
  }
}

export const debug = {
  enabled: isEnabled,

  enable(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    console.info(
      "[voltchess:debug] Verbose logging enabled (reload to apply everywhere)."
    );
  },

  disable(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    console.info("[voltchess:debug] Verbose logging disabled.");
  },

  log(category: DebugCategory, step: string, data?: Record<string, unknown>) {
    log("log", category, step, data);
  },

  warn(category: DebugCategory, step: string, data?: Record<string, unknown>) {
    log("warn", category, step, data);
  },

  error(category: DebugCategory, step: string, data?: Record<string, unknown>) {
    log("error", category, step, data);
  },

  group(category: DebugCategory, title: string, fn: () => void) {
    if (!isEnabled()) {
      fn();
      return;
    }
    console.groupCollapsed(`${label(category)} ${title}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },
};

/** Attach helpers to window and print a one-line usage hint. */
export function initDebugConsole(): void {
  if (typeof window === "undefined") return;

  const w = window as Window & {
    __voltchessDebug?: {
      enable: () => void;
      disable: () => void;
      enabled: boolean;
      dumpSession: () => void;
    };
  };

  w.__voltchessDebug = {
    enable: debug.enable,
    disable: debug.disable,
    enabled: isEnabled(),
    dumpSession: () => {
      // Lazy import avoids circular deps at module load
      void import("@/lib/authStorage").then(
        ({
          getAccessToken,
          getRefreshToken,
          hasStoredSession,
          readCachedUser,
        }) => {
          const cached = readCachedUser();
          debug.log("auth", "── session dump ──", {
            hasSession: hasStoredSession(),
            access: maskToken(getAccessToken()),
            refresh: maskToken(getRefreshToken()),
            cachedUser: cached
              ? { id: cached.id, username: cached.username, role: cached.role }
              : null,
            localStorageKeys: Object.keys(localStorage).filter((k) =>
              k.startsWith("voltchess")
            ),
          });
        }
      );
    },
  };

  if (isEnabled()) {
    console.info(
      "[voltchess:debug] Verbose logging ON — categories: auth, storage, api, queue, sync, idb, route, bootstrap, query. Toggle: window.__voltchessDebug.enable() / .disable() / .dumpSession()"
    );
  }
}
