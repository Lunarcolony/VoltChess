import { SITE_HOST } from "@/data/seo";

export type DeviceSnapshot = Record<string, unknown>;

function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ] as const;
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

export function collectDeviceSnapshot(): DeviceSnapshot {
  if (typeof window === "undefined") return {};

  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
    userAgentData?: { platform?: string; mobile?: boolean };
  };
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  let timezone = "";
  let timezoneOffset = 0;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    timezoneOffset = new Date().getTimezoneOffset();
  } catch {
    timezoneOffset = new Date().getTimezoneOffset();
  }

  return {
    userAgent: navigator.userAgent,
    platform: nav.userAgentData?.platform || "unknown",
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    timezone,
    timezoneOffset,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    touchSupport:
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0,
    prefersColorScheme: window.matchMedia?.("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light",
    connectionEffectiveType: connection?.effectiveType,
    connectionDownlink: connection?.downlink,
    connectionRtt: connection?.rtt,
    connectionSaveData: connection?.saveData,
    referrer: document.referrer || "",
    landingPath: window.location.pathname + window.location.search,
    host: window.location.host || SITE_HOST,
    mode: import.meta.env.MODE,
    uaPlatform: nav.userAgentData?.platform,
    uaMobile: nav.userAgentData?.mobile,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    utm: readUtm(window.location.search),
  };
}

export function getUtmFromLocation(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return readUtm(window.location.search);
}
