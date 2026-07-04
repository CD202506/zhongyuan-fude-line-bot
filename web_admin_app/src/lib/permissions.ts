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
    viewer: "善信",
  };

  return labels[role];
}

export function roleHelpText(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: "測試身份：管理者，可查看權限設定示意與處理高風險操作。",
    staff: "測試身份：廟方人員，可處理被授權的日常作業與對外發布，停用封存需管理者確認。",
    viewer: "測試身份：善信，可瀏覽對外資訊與本人相關紀錄，不進入內部廟務或帳務。",
  };

  return labels[role];
}
