/**
 * Production Pi API (Cloudflare HTTPS tunnel).
 * After Pi reboot: cat ~/VoltChess/backend/PUBLIC_API_URL.txt
 * Then update this file AND public/api-config.json
 */
export const PRODUCTION_API_URL =
  "https://maker-ata-produce-keys.trycloudflare.com";

const VOLT_CHESS_HOSTS = ["voltchess.me", "www.voltchess.me"];

export function isVoltChessProduction(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return VOLT_CHESS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Resolved at runtime in the browser — never trust a stale Vercel VITE_API_URL on voltchess.me */
export function resolveApiBaseUrl(): string {
  // voltchess.me always uses code/config URL (Vercel env may be outdated)
  if (isVoltChessProduction()) {
    return PRODUCTION_API_URL;
  }

  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (import.meta.env.PROD) {
    return PRODUCTION_API_URL;
  }

  return "http://192.168.8.132:8000";
}

let runtimeApiUrl: string | null = null;

export function getApiBaseUrl(): string {
  return runtimeApiUrl ?? resolveApiBaseUrl();
}

export function setApiBaseUrl(url: string): void {
  runtimeApiUrl = url.replace(/\/$/, "");
}

/** Load /api-config.json to pick up URL changes without a full redeploy */
export async function loadApiConfig(): Promise<string> {
  const base = resolveApiBaseUrl();
  try {
    const res = await fetch("/api-config.json", { cache: "no-store" });
    if (!res.ok) return base;
    const data = (await res.json()) as { apiUrl?: string };
    if (data.apiUrl?.startsWith("https://")) {
      setApiBaseUrl(data.apiUrl);
      return data.apiUrl.replace(/\/$/, "");
    }
  } catch {
    // use resolved default
  }
  return base;
}
