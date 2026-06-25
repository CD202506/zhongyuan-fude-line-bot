import type { UserRole } from "../data/mockUser";

export function canUseAdminSettings(role: UserRole) {
  return role === "admin";
}

export function permissionLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: "管理者",
    staff: "廟方人員",
    viewer: "檢視者",
  };

  return labels[role];
}
