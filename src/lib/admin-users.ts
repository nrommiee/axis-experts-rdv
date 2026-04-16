/**
 * Helpers to classify a portal_clients row according to its blocking / soft-delete
 * state. Kept as pure functions so they can be reused on the server (API routes)
 * and in the client (badge / actions rendering).
 */

export type UserStatus = "active" | "blocked" | "deleted";

export interface UserStatusRow {
  blocked_at: string | null;
  deleted_at: string | null;
}

export function isUserActive(user: UserStatusRow): boolean {
  return user.blocked_at === null && user.deleted_at === null;
}

export function isUserBlocked(user: UserStatusRow): boolean {
  return user.blocked_at !== null && user.deleted_at === null;
}

export function isUserDeleted(user: UserStatusRow): boolean {
  return user.deleted_at !== null;
}

export function getUserStatus(user: UserStatusRow): UserStatus {
  if (user.deleted_at !== null) return "deleted";
  if (user.blocked_at !== null) return "blocked";
  return "active";
}

export function filterVisibleUsers<T extends UserStatusRow>(users: T[]): T[] {
  return users.filter((u) => u.deleted_at === null);
}
