import axios, { isAxiosError } from "axios";
import { getApiBaseUrl, resolveApiBaseUrl } from "@/config/apiUrl";
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
    return config;
  },
  (error) => Promise.reject(error)
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
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/token/refresh/", { refresh })
      .then((res) => {
        const access = res.data.access as string;
        const nextRefresh = (res.data.refresh as string | undefined) ?? refresh;
        setTokens(access, nextRefresh);
        return access as string | null;
      })
      .catch((err) => {
        if (isAxiosError(err) && err.response?.status === 401) {
          clearAuthStorage();
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/api/token/")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    if (!getRefreshToken()) {
      return Promise.reject(error);
    }

    const access = await refreshAccessToken();
    if (!access) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  }
);

export default api;
