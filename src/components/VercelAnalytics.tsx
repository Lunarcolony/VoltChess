import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { track } from "@vercel/analytics";

/**
 * Tracks page views for HashRouter SPA navigation.
 * The Analytics component alone listens to history API; hash routes need manual tracking.
 */
export default function VercelAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    track("pageview", { path });
  }, [location.pathname, location.search]);

  return <Analytics />;
}
