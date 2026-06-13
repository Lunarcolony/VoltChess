import { useEffect, ReactNode } from "react";
import { useRouter } from "@/hooks/useRouter";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ENABLE_AUTHENTICATION || loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (!ENABLE_AUTHENTICATION) {
    return children;
  }

  if (loading) {
    return <LoadingSpinner message="Checking session…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
