import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { getApiBaseUrl, resolveApiBaseUrl } from "@/config/apiUrl";

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000,
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem(ACCESS_TOKEN);
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
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/token/refresh/", { refresh })
        .then((res) => {
          const access = res.data.access as string;
          localStorage.setItem(ACCESS_TOKEN, access);
          if (res.data.refresh) {
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
          }
          return access;
        })
        .catch(() => {
          localStorage.removeItem(ACCESS_TOKEN);
          localStorage.removeItem(REFRESH_TOKEN);
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
