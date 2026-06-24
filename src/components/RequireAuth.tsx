import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { debug } from "@/lib/debug";

/** Redirects unauthenticated users to /login (Academy entry point). */
export default function RequireAuth() {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    debug.log("route", "RequireAuth check", {
      path: location.pathname,
      loading,
      isAuthenticated,
      authEnabled: ENABLE_AUTHENTICATION,
    });
  }, [location.pathname, loading, isAuthenticated]);

  if (!ENABLE_AUTHENTICATION) {
    return <Outlet />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading VoltChess Academy…" />;
  }

  if (!isAuthenticated) {
    debug.log("route", "RequireAuth — redirect to /login", {
      from: location.pathname,
    });
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
