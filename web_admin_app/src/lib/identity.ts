import type { UserRole } from "../data/mockUser";
import type { ModuleKey } from "../data/modules";

export type LineBindingStatus = "not-linked" | "linked-to-staff" | "linked-to-devotee";
export type PermissionMark = "初審" | "覆核" | "核准";
export type ModulePermissionLevel = "none" | "view" | "daily-work" | "review" | "approve";

export type ModulePermission = {
  moduleKey: ModuleKey;
  level: ModulePermissionLevel;
  reviewMarks: PermissionMark[];
};

export type MockIdentity = {
  userId: string;
  displayName: string;
  role: UserRole;
  staffMemberId?: string;
  devoteeId?: string;
  linkedLineUser: LineBindingStatus;
  permissionSet: string;
  modulePermissions: ModulePermission[];
  isTestMode: boolean;
  isLineLinked: boolean;
};

export const identityRuntime = {
  isTestMode: true,
  modeLabel: "測試模式",
  formalModeNote: "正式版將依登入帳號與權限顯示，不能自行切換。",
  lineBindingNote: "LINE 帳號綁定目前為前端示意，尚未啟用正式綁定流程。",
};

export const mockIdentities: Record<UserRole, MockIdentity> = {
  admin: {
    userId: "TEST-ADMIN-001",
    displayName: "系統管理者 A",
    role: "admin",
    staffMemberId: "STAFF-ADMIN-001",
    linkedLineUser: "linked-to-staff",
    permissionSet: "管理者完整權限",
    modulePermissions: [
      { moduleKey: "team", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
      { moduleKey: "devotees", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
      { moduleKey: "ledger", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
    ],
    isTestMode: true,
    isLineLinked: true,
  },
  staff: {
    userId: "TEST-STAFF-001",
    displayName: "廟方人員 A",
    role: "staff",
    staffMemberId: "STAFF-DAILY-001",
    linkedLineUser: "linked-to-staff",
    permissionSet: "日常作業權限",
    modulePermissions: [
      { moduleKey: "devotees", level: "daily-work", reviewMarks: ["初審"] },
      { moduleKey: "visits", level: "daily-work", reviewMarks: ["初審"] },
      { moduleKey: "announcements", level: "review", reviewMarks: ["初審", "覆核"] },
    ],
    isTestMode: true,
    isLineLinked: true,
  },
  viewer: {
    userId: "TEST-DEVOTEE-001",
    displayName: "善信 A",
    role: "viewer",
    devoteeId: "DEVOTEE-001",
    linkedLineUser: "linked-to-devotee",
    permissionSet: "對外資訊與本人紀錄",
    modulePermissions: [
      { moduleKey: "announcements", level: "view", reviewMarks: [] },
      { moduleKey: "events", level: "view", reviewMarks: [] },
      { moduleKey: "devotees", level: "view", reviewMarks: [] },
    ],
    isTestMode: true,
    isLineLinked: true,
  },
};

export const currentUser = mockIdentities.admin;

export function identityForRole(role: UserRole) {
  return mockIdentities[role];
}

export function lineBindingLabel(identity: MockIdentity) {
  if (identity.linkedLineUser === "linked-to-staff") return "已連到團隊成員";
  if (identity.linkedLineUser === "linked-to-devotee") return "已連到善信資料";
  return "尚未連到 LINE 帳號";
}

export function permissionSummary(identity: MockIdentity) {
  return identity.modulePermissions
    .filter((permission) => permission.level !== "none")
    .map((permission) => permission.reviewMarks.length > 0 ? permission.reviewMarks.join(" / ") : "查看")
    .slice(0, 3)
    .join("、");
}
