import {
  bumpAggregate,
  enqueueEvent,
  getAggregates,
  type TelemetrySessionSnapshot,
} from "./storage";
import { getUtmFromLocation } from "./environment";

type SessionRuntime = {
  session_id: string;
  started_at: string;
  active_ms: number;
  landing_path: string;
  referrer: string;
  utm: Record<string, string>;
  route_times: Record<string, number>;
  currentPath: string;
  pathStartedAt: number | null;
  visibleSince: number | null;
  ended_at: string | null;
};

let runtime: SessionRuntime | null = null;
let analysisStartedAt: number | null = null;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function flushRouteTime(now: number): void {
  if (!runtime || runtime.pathStartedAt == null) return;
  const elapsed = Math.max(0, now - runtime.pathStartedAt);
  const path = runtime.currentPath || "/";
  runtime.route_times[path] = (runtime.route_times[path] || 0) + elapsed;
  runtime.pathStartedAt = document.visibilityState === "visible" ? now : null;
}

function accumulateActive(now: number): void {
  if (!runtime || runtime.visibleSince == null) return;
  if (document.visibilityState !== "visible") return;
  const elapsed = Math.max(0, now - runtime.visibleSince);
  runtime.active_ms += elapsed;
  bumpAggregate("active_ms_total", elapsed);
  runtime.visibleSince = now;
}

export function startTelemetrySession(): TelemetrySessionSnapshot {
  const now = Date.now();
  const path =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  runtime = {
    session_id: newId(),
    started_at: new Date(now).toISOString(),
    active_ms: 0,
    landing_path: path,
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    utm: getUtmFromLocation(),
    route_times: {},
    currentPath: path,
    pathStartedAt: document.visibilityState === "visible" ? now : null,
    visibleSince: document.visibilityState === "visible" ? now : null,
    ended_at: null,
  };
  bumpAggregate("sessions_total", 1);
  enqueueEvent("session_start", {
    landing_path: runtime.landing_path,
    referrer: runtime.referrer,
    utm: runtime.utm,
    visit: getAggregates(),
  });
  return getSessionSnapshot();
}

export function getSessionSnapshot(): TelemetrySessionSnapshot {
  const now = Date.now();
  if (runtime) {
    accumulateActive(now);
    flushRouteTime(now);
  }
  if (!runtime) {
    return {
      session_id: newId(),
      started_at: new Date().toISOString(),
      active_ms: 0,
      landing_path: "/",
      referrer: "",
      utm: {},
      route_times: {},
    };
  }
  return {
    session_id: runtime.session_id,
    started_at: runtime.started_at,
    ended_at: runtime.ended_at,
    active_ms: runtime.active_ms,
    landing_path: runtime.landing_path,
    referrer: runtime.referrer,
    utm: runtime.utm,
    route_times: { ...runtime.route_times },
  };
}

export function onVisibilityChange(): void {
  if (!runtime) return;
  const now = Date.now();
  if (document.visibilityState === "hidden") {
    accumulateActive(now);
    flushRouteTime(now);
    runtime.visibleSince = null;
    runtime.pathStartedAt = null;
  } else {
    runtime.visibleSince = now;
    runtime.pathStartedAt = now;
  }
}

export function onRouteChange(path: string): void {
  if (!runtime) return;
  const now = Date.now();
  flushRouteTime(now);
  runtime.currentPath = path;
  runtime.pathStartedAt = document.visibilityState === "visible" ? now : null;
  enqueueEvent("pageview", { path });
}

export function heartbeatSession(): void {
  if (!runtime) return;
  const snap = getSessionSnapshot();
  enqueueEvent("session_heartbeat", {
    active_ms: snap.active_ms,
    route_times: snap.route_times,
  });
}

export function endTelemetrySession(): void {
  if (!runtime) return;
  const now = Date.now();
  accumulateActive(now);
  flushRouteTime(now);
  runtime.ended_at = new Date(now).toISOString();
  runtime.visibleSince = null;
  runtime.pathStartedAt = null;
  enqueueEvent("session_end", {
    active_ms: runtime.active_ms,
    route_times: runtime.route_times,
    duration_ms: now - Date.parse(runtime.started_at),
  });
}

export function markAnalysisStart(): void {
  analysisStartedAt = Date.now();
  enqueueEvent("analysis_started", {});
}

export function takeAnalysisDurationMs(): number | undefined {
  if (analysisStartedAt == null) return undefined;
  const ms = Math.max(0, Date.now() - analysisStartedAt);
  analysisStartedAt = null;
  return ms;
}
