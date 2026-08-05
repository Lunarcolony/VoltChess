import api from "@/api";
import { debug } from "@/lib/debug";
import { readCachedUser } from "@/lib/authStorage";
import { collectDeviceSnapshot } from "./environment";
import { getSessionSnapshot } from "./session";
import {
  getAggregates,
  getOrCreateClientId,
  getQueue,
  peekVisitMeta,
  removeAcceptedEvents,
} from "./storage";

type IngestResponse = {
  accepted: number;
  accepted_event_ids: string[];
  client_id: string;
  created: boolean;
};

let flushInFlight: Promise<boolean> | null = null;

async function isBackendHealthy(): Promise<boolean> {
  try {
    const res = await api.get("/api/health/", { timeout: 8_000 });
    return res.status === 200 && res.data?.status === "ok";
  } catch (err) {
    debug.log("telemetry", "health check failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function flushTelemetry(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    const queue = getQueue();
    const session = getSessionSnapshot();
    if (queue.length === 0 && session.active_ms === 0) {
      const visit = peekVisitMeta();
      if (!visit || visit.visitCount <= 0) return false;
    }

    const healthy = await isBackendHealthy();
    if (!healthy) {
      debug.log("telemetry", "skip flush — backend unhealthy");
      return false;
    }

    const cachedUser = readCachedUser();
    const body = {
      client_id: getOrCreateClientId(),
      user_id: cachedUser?.id,
      device: {
        ...collectDeviceSnapshot(),
        visit: peekVisitMeta(),
      },
      session,
      aggregates: getAggregates(),
      events: queue,
    };

    try {
      const res = await api.post<IngestResponse>(
        "/api/telemetry/ingest/",
        body,
        {
          timeout: 15_000,
        }
      );
      const accepted = res.data?.accepted_event_ids ?? [];
      removeAcceptedEvents(accepted);
      debug.log("telemetry", "flush ok", {
        accepted: accepted.length,
        remaining: getQueue().length,
      });
      return true;
    } catch (err) {
      debug.warn("telemetry", "flush failed", {
        message: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  })().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
}
