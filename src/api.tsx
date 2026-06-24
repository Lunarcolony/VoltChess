import axios, { isAxiosError } from "axios";
import { getApiBaseUrl, resolveApiBaseUrl } from "@/config/apiUrl";
import { debug, maskToken } from "@/lib/debug";
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/authStorage";

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000,
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    debug.log("api", "→ request", {
      method: (config.method ?? "get").toUpperCase(),
      url: config.url,
      baseURL: config.baseURL || "(same-origin)",
      hasAuth: !!token,
      token: maskToken(token),
    });
    return config;
  },
  (error) => {
    debug.error("api", "request interceptor error", { message: String(error) });
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh token for a fresh access token (single-flight:
 * concurrent callers share one in-flight request). The session is only cleared
 * when the refresh token itself is rejected (401) — transient network errors
 * keep the session so the user is not logged out spuriously. Callers (the 401
 * interceptor and the proactive refresh timer in AuthContext) share this.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    debug.warn("auth", "refreshAccessToken — no refresh token in storage");
    return null;
  }

  if (!refreshPromise) {
    debug.log("auth", "refreshAccessToken — starting single-flight refresh", {
      refresh: maskToken(refresh),
    });
    refreshPromise = api
      .post("/api/token/refresh/", { refresh })
      .then((res) => {
        const access = res.data.access as string;
        const nextRefresh = (res.data.refresh as string | undefined) ?? refresh;
        setTokens(access, nextRefresh);
        debug.log("auth", "refreshAccessToken — success, tokens updated", {
          access: maskToken(access),
          refreshRotated: nextRefresh !== refresh,
        });
        return access as string | null;
      })
      .catch((err) => {
        if (isAxiosError(err) && err.response?.status === 401) {
          debug.warn(
            "auth",
            "refreshAccessToken — refresh rejected (401), clearing session"
          );
          clearAuthStorage();
        } else {
          debug.warn("auth", "refreshAccessToken — failed (session kept)", {
            status: isAxiosError(err) ? err.response?.status : undefined,
            message: isAxiosError(err) ? err.message : String(err),
          });
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
        debug.log("auth", "refreshAccessToken — single-flight complete");
      });
  } else {
    debug.log("auth", "refreshAccessToken — joining in-flight refresh");
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => {
    debug.log("api", "← response", {
      status: response.status,
      url: response.config.url,
      method: (response.config.method ?? "get").toUpperCase(),
    });
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    debug.warn("api", "← error response", {
      status,
      url: original?.url,
      method: original?.method?.toUpperCase(),
      retry: !!original?._retry,
    });

    if (
      status !== 401 ||
      original._retry ||
      original.url?.includes("/api/token/")
    ) {
      return Promise.reject(error);
    }

    debug.log("auth", "401 interceptor — attempting token refresh + retry", {
      url: original.url,
    });
    original._retry = true;
    if (!getRefreshToken()) {
      debug.warn("auth", "401 interceptor — no refresh token, giving up");
      return Promise.reject(error);
    }

    const access = await refreshAccessToken();
    if (!access) {
      debug.warn(
        "auth",
        "401 interceptor — refresh failed, rejecting original request"
      );
      return Promise.reject(error);
    }

    debug.log(
      "auth",
      "401 interceptor — retrying original request with new token",
      {
        url: original.url,
      }
    );
    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  }
);

export default api;
