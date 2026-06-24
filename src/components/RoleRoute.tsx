import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";
import { debug } from "@/lib/debug";

interface RoleRouteProps {
  children: ReactNode;
  allowed: UserRole[];
  fallback?: string;
}

export default function RoleRoute({
  children,
  allowed,
  fallback = "/",
}: RoleRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    debug.log("route", "RoleRoute check", {
      loading,
      userRole: user?.role,
      allowed,
      permitted: user ? allowed.includes(user.role) : false,
    });
  }, [user, loading, allowed]);

  if (loading) {
    return <LoadingSpinner message="Loading…" />;
  }

  if (!user || !allowed.includes(user.role)) {
    debug.warn("route", "RoleRoute — access denied, redirect", {
      fallback,
      userRole: user?.role,
      allowed,
    });
    return <Navigate to={fallback} replace />;
  }

  return children;
}
