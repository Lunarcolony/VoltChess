import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<null | boolean>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN) : null;
    if (!token) {
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        setIsAuthorized(false);
        router.replace("/login");
      } else {
        setIsAuthorized(true);
      }
    } catch {
      setIsAuthorized(false);
      router.replace("/login");
    }
  }, [router]);

  if (isAuthorized === null) return <div>Loading...</div>;
  if (!isAuthorized) return null;
  return children;
}

export default ProtectedRoute;
