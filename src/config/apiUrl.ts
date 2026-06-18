/**
 * API base URL resolution.
 *
 * - Production (Vercel): set `VITE_API_URL` to your HTTPS API (Cloudflare tunnel or custom domain).
 * - Local dev: leave `VITE_API_URL` unset; Vite proxies `/api` to `API_PROXY_TARGET` (see vite.config.ts).
 * - Optional runtime override: `/api-config.json` with `"apiUrl": "https://..."` (HTTPS only).
 *
 * Never commit private LAN IPs or tunnel URLs to the repository.
 */

const PRIVATE_HOST =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function assertSafeApiUrl(url: string): void {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid API URL: ${url}`);
  }

  if (import.meta.env.PROD && PRIVATE_HOST.test(parsed.hostname)) {
    throw new Error(
      "VITE_API_URL must not use private or local IP addresses in production builds."
    );
  }

  if (
    import.meta.env.PROD &&
    parsed.protocol === "http:" &&
    !PRIVATE_HOST.test(parsed.hostname)
  ) {
    console.warn("VITE_API_URL should use HTTPS in production.");
  }
}

export function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    const normalized = normalizeUrl(fromEnv);
    assertSafeApiUrl(normalized);
    return normalized;
  }

  // Same-origin relative URLs — Vite dev proxy handles /api in development.
  if (import.meta.env.DEV) {
    return "";
  }

  return "";
}

let runtimeApiUrl: string | null = null;

export function getApiBaseUrl(): string {
  return runtimeApiUrl ?? resolveApiBaseUrl();
}

export function setApiBaseUrl(url: string): void {
  runtimeApiUrl = normalizeUrl(url);
}

/** Load /api-config.json for HTTPS URL overrides without a full frontend redeploy. */
export async function loadApiConfig(): Promise<string> {
  const base = resolveApiBaseUrl();
  try {
    const res = await fetch("/api-config.json", { cache: "no-store" });
    if (!res.ok) return base;
    const data = (await res.json()) as { apiUrl?: string };
    const candidate = data.apiUrl?.trim();
    if (candidate?.startsWith("https://")) {
      assertSafeApiUrl(candidate);
      setApiBaseUrl(candidate);
      return normalizeUrl(candidate);
    }
  } catch {
    // use resolved default
  }
  return base;
}
