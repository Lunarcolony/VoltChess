import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@vercel/analytics";

/** Tracks page views and key funnel events for Vercel Analytics. */
export default function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    track("pageview", { path: location.pathname + location.search });

    if (location.pathname === "/analysis") {
      track("analysis_started");
    }
  }, [location.pathname, location.search]);

  return null;
}
