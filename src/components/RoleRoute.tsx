import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";

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

  if (loading) {
    return <LoadingSpinner message="Loading…" />;
  }

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
