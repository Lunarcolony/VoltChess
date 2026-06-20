import { UserRole } from "@/types/user";

/**
 * Home route for a signed-in user based on their role. Used by both the login
 * handler and `GuestRoute` so post-authentication redirects always agree (and
 * never race each other to different destinations).
 */
export function landingForRole(role: UserRole | undefined): string {
  if (role === UserRole.Student) return "/student";
  if (role === UserRole.Coach || role === UserRole.Admin) return "/coach";
  return "/";
}
