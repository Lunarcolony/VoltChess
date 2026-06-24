import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRouter } from "@/hooks/useRouter";
import { LoadingSpinner } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { landingForRole } from "@/lib/auth";
import { debug } from "@/lib/debug";

interface GuestRouteProps {
  children: ReactNode;
  /** Explicit override; otherwise redirect to the user's role home. */
  redirectTo?: string;
}

/** Auth pages — redirect signed-in users away (e.g. login → role dashboard). */
export default function GuestRoute({ children, redirectTo }: GuestRouteProps) {
  const router = useRouter();
  const location = useLocation();
  const { loading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!ENABLE_AUTHENTICATION || loading) return;
    if (isAuthenticated) {
      // Honor an explicit deep link the user was sent here from; otherwise drop
      // them on their role's dashboard. Computed the same way as the login
      // handler so the two redirects never fight over different destinations.
      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      const target =
        redirectTo ??
        (from && from !== "/" && from !== "/login" && from !== "/register"
          ? from
          : landingForRole(user?.role));
      debug.log("route", "GuestRoute — authenticated user redirect", {
        from: location.pathname,
        target,
        role: user?.role,
      });
      router.replace(target);
    }
  }, [
    loading,
    isAuthenticated,
    router,
    redirectTo,
    location.state,
    location.pathname,
    user,
  ]);

  if (ENABLE_AUTHENTICATION && loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (ENABLE_AUTHENTICATION && isAuthenticated) {
    return null;
  }

  return children;
}
