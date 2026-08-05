/** Local-first product telemetry (anonymous client id + event queue). */

export type TelemetryAggregates = {
  games_analyzed_total: number;
  active_ms_total: number;
  sessions_total: number;
};

export type TelemetryQueuedEvent = {
  event_id: string;
  name: string;
  ts: string;
  properties: Record<string, unknown>;
};

export type TelemetrySessionSnapshot = {
  session_id: string;
  started_at: string;
  ended_at?: string | null;
  active_ms: number;
  landing_path: string;
  referrer: string;
  utm: Record<string, string>;
  route_times: Record<string, number>;
};

const CLIENT_ID_KEY = "voltchess_telemetry_client_id";
const AGGREGATES_KEY = "voltchess_telemetry_aggregates";
const QUEUE_KEY = "voltchess_telemetry_queue";
const VISIT_KEY = "voltchess_telemetry_visit_meta";

const MAX_QUEUE = 500;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateClientId(): string {
  if (typeof window === "undefined") return newId();
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const id = newId();
  localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

export function getAggregates(): TelemetryAggregates {
  if (typeof window === "undefined") {
    return {
      games_analyzed_total: 0,
      active_ms_total: 0,
      sessions_total: 0,
    };
  }
  const data = safeParse<Partial<TelemetryAggregates>>(
    localStorage.getItem(AGGREGATES_KEY),
    {}
  );
  return {
    games_analyzed_total: Number(data.games_analyzed_total) || 0,
    active_ms_total: Number(data.active_ms_total) || 0,
    sessions_total: Number(data.sessions_total) || 0,
  };
}

export function setAggregates(next: TelemetryAggregates): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AGGREGATES_KEY, JSON.stringify(next));
}

export function bumpAggregate(
  key: keyof TelemetryAggregates,
  by = 1
): TelemetryAggregates {
  const current = getAggregates();
  const next = { ...current, [key]: Math.max(0, current[key] + by) };
  setAggregates(next);
  return next;
}

export function getQueue(): TelemetryQueuedEvent[] {
  if (typeof window === "undefined") return [];
  const q = safeParse<TelemetryQueuedEvent[]>(
    localStorage.getItem(QUEUE_KEY),
    []
  );
  return Array.isArray(q) ? q : [];
}

export function enqueueEvent(
  name: string,
  properties: Record<string, unknown> = {}
): TelemetryQueuedEvent {
  const event: TelemetryQueuedEvent = {
    event_id: newId(),
    name,
    ts: new Date().toISOString(),
    properties,
  };
  if (typeof window === "undefined") return event;
  const queue = getQueue();
  queue.push(event);
  while (queue.length > MAX_QUEUE) queue.shift();
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return event;
}

export function removeAcceptedEvents(eventIds: string[]): void {
  if (typeof window === "undefined" || eventIds.length === 0) return;
  const drop = new Set(eventIds);
  const remaining = getQueue().filter((e) => !drop.has(e.event_id));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export type VisitMeta = {
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
};

export function touchVisitMeta(): VisitMeta {
  if (typeof window === "undefined") {
    const now = new Date().toISOString();
    return { firstSeen: now, lastSeen: now, visitCount: 1 };
  }
  const prev = safeParse<Partial<VisitMeta>>(
    localStorage.getItem(VISIT_KEY),
    {}
  );
  const now = new Date().toISOString();
  const next: VisitMeta = {
    firstSeen: prev.firstSeen || now,
    lastSeen: now,
    visitCount: (Number(prev.visitCount) || 0) + 1,
  };
  localStorage.setItem(VISIT_KEY, JSON.stringify(next));
  return next;
}

export function peekVisitMeta(): VisitMeta | null {
  if (typeof window === "undefined") return null;
  const prev = safeParse<Partial<VisitMeta> | null>(
    localStorage.getItem(VISIT_KEY),
    null
  );
  if (!prev?.firstSeen) return null;
  return {
    firstSeen: prev.firstSeen,
    lastSeen: prev.lastSeen || prev.firstSeen,
    visitCount: Number(prev.visitCount) || 0,
  };
}
