import axios from "axios";
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
    const refresh = getRefreshToken();
    if (!refresh) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/token/refresh/", { refresh })
        .then((res) => {
          const access = res.data.access as string;
          const nextRefresh = (res.data.refresh as string | undefined) ?? refresh;
          setTokens(access, nextRefresh);
          return access;
        })
        .catch(() => {
          clearAuthStorage();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const access = await refreshPromise;
    if (!access) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  }
);

export default api;
