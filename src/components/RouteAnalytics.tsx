import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@vercel/analytics";

/** Tracks HashRouter page views for Vercel Analytics. */
export default function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    track("pageview", { path: location.pathname + location.search });
  }, [location.pathname, location.search]);

  return null;
}
