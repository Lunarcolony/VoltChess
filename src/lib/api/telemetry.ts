import api from "@/api";

export type TelemetryStats = {
  totals: {
    clients: number;
    games_analyzed: number;
    active_ms: number;
    sessions: number;
    avg_session_active_ms: number;
  };
  days: number;
  analyses_by_day: { day: string; count: number }[];
  active_by_day: { day: string; active_ms: number; sessions: number }[];
  top_engines: { name: string; count: number }[];
  top_sources: { name: string; count: number }[];
};

export type TelemetryEventRow = {
  event_id: string;
  name: string;
  ts: string;
  client_id: string;
  properties: Record<string, unknown>;
};

export type TelemetryEventsPage = {
  total: number;
  limit: number;
  offset: number;
  results: TelemetryEventRow[];
};

export async function fetchTelemetryStats(days = 30): Promise<TelemetryStats> {
  const res = await api.get<TelemetryStats>("/api/telemetry/stats/", {
    params: { days },
  });
  return res.data;
}

export async function fetchTelemetryEvents(opts?: {
  limit?: number;
  offset?: number;
}): Promise<TelemetryEventsPage> {
  const res = await api.get<TelemetryEventsPage>("/api/telemetry/events/", {
    params: {
      limit: opts?.limit ?? 50,
      offset: opts?.offset ?? 0,
    },
  });
  return res.data;
}
