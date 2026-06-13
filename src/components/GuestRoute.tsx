import { ReactNode, useEffect } from "react";
import { useRouter } from "@/hooks/useRouter";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";

interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/** Auth pages — redirect signed-in users away (e.g. login → home). */
export default function GuestRoute({
  children,
  redirectTo = "/",
}: GuestRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ENABLE_AUTHENTICATION || loading) return;
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  if (ENABLE_AUTHENTICATION && loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (ENABLE_AUTHENTICATION && isAuthenticated) {
    return null;
  }

  return children;
}
