import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@vercel/analytics";
import { debug } from "@/lib/debug";

/** Tracks page views and key funnel events for Vercel Analytics. */
export default function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    debug.log("route", "navigation", { path });
    track("pageview", { path });

    if (location.pathname === "/analysis") {
      track("analysis_started");
    }
  }, [location.pathname, location.search]);

  return null;
}
