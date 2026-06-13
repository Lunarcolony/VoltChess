import axios from "axios";
import { getApiBaseUrl } from "@/config/apiUrl";

export function getApiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "Something went wrong. Please try again.";
  }

  if (!err.response) {
    const apiUrl = err.config?.baseURL ?? getApiBaseUrl();
    if (apiUrl.includes("internal-isolation") || apiUrl.includes("trycloudflare")) {
      return "Cannot reach the API. The Pi tunnel URL may have changed — redeploy the latest site build.";
    }
    const isHttpsPage =
      typeof window !== "undefined" && window.location.protocol === "https:";
    if (isHttpsPage && apiUrl.startsWith("http://")) {
      return "Cannot connect: the site uses HTTPS but the API URL is HTTP.";
    }
    return "Cannot reach the VoltChess API. Check your connection or try again later.";
  }

  const data = err.response.data;
  if (typeof data === "object" && data !== null) {
    if ("detail" in data && typeof data.detail === "string") {
      return data.detail;
    }
    const fieldErrors = Object.entries(data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`);
    if (fieldErrors.length) return fieldErrors.join("; ");
  }

  if (err.response.status === 401) {
    return "Invalid username or password.";
  }

  return `Request failed (${err.response.status}).`;
}
