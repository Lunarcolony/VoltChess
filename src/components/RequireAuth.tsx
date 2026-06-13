import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";

/** Redirects unauthenticated users to /login (Academy entry point). */
export default function RequireAuth() {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();

  if (!ENABLE_AUTHENTICATION) {
    return <Outlet />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading VoltChess Academy…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
