import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  endTelemetrySession,
  flushTelemetry,
  heartbeatSession,
  onRouteChange,
  onVisibilityChange,
  startTelemetrySession,
} from "@/lib/telemetry";
import { touchVisitMeta } from "@/lib/telemetry/storage";

/**
 * Starts anonymous session tracking, queues events locally, and flushes to the
 * backend whenever `/api/health/` reports OK.
 */
export default function TelemetryProvider() {
  const location = useLocation();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    touchVisitMeta();
    startTelemetrySession();
    void flushTelemetry();

    const onVis = () => {
      onVisibilityChange();
      if (document.visibilityState === "hidden") {
        void flushTelemetry();
      }
    };
    const onPageHide = () => {
      endTelemetrySession();
      void flushTelemetry();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);

    const heartbeat = window.setInterval(() => {
      heartbeatSession();
      void flushTelemetry();
    }, 30_000);

    const flushInterval = window.setInterval(() => {
      void flushTelemetry();
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(heartbeat);
      window.clearInterval(flushInterval);
      endTelemetrySession();
      void flushTelemetry();
      started.current = false;
    };
  }, []);

  useEffect(() => {
    if (!started.current) return;
    const path = location.pathname + location.search;
    onRouteChange(path);
  }, [location.pathname, location.search]);

  return null;
}
