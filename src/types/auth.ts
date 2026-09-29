export type AppRole = "student" | "mentor" | "admin";

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: AppRole;
  createdAt?: string;
}
