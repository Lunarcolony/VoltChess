import { ENABLE_AUTHENTICATION } from "@/constants";
import { hasStoredSession } from "@/lib/authStorage";

/**
 * Check if user authentication is required and if user is authenticated
 * Returns true if authentication is disabled OR if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  // If authentication is disabled, always return true
  if (!ENABLE_AUTHENTICATION) {
    return true;
  }

  // If authentication is enabled, check for valid token
  if (typeof window !== "undefined") {
    return hasStoredSession();
  }
  return false;
};

/**
 * Check if authentication is enabled for the application
 */
export const isAuthenticationEnabled = (): boolean => {
  return ENABLE_AUTHENTICATION;
};

/**
 * Get authentication status message for debugging
 */
export const getAuthStatus = (): string => {
  if (!ENABLE_AUTHENTICATION) {
    return "Authentication disabled - all routes accessible";
  }

  const hasToken = typeof window !== "undefined" ? hasStoredSession() : false;
  return hasToken ? "User authenticated" : "User not authenticated";
};
