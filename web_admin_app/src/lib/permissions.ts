import type { UserRole } from "../data/mockUser";

export function canUseAdminSettings(role: UserRole) {
  return role === "admin";
}

export function canEditDailyWork(role: UserRole) {
  return role === "admin" || role === "staff";
}

export function canUseRiskAction(role: UserRole) {
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

export function roleHelpText(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: "可調整設定與處理高風險操作。",
    staff: "可處理日常作業，管理者設定與停用封存需管理者確認。",
    viewer: "以查看資料為主，無法編輯或停用。",
  };

  return labels[role];
}
