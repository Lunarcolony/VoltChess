export enum UserRole {
  Admin = "admin",
  Coach = "coach",
  Student = "student",
}

export type User = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Coach]: "Coach",
  [UserRole.Student]: "Student",
};
