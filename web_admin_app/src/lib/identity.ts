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
  identityId: string;
  displayName: string;
  displayRole: UserRole;
  devoteeId: string;
  teamMemberId?: string;
  linkedLineUser: LineBindingStatus;
  permissionSet: string;
  permissionGrants: string[];
  modulePermissions: ModulePermission[];
  isTestMode: boolean;
  isLineLinked: boolean;
  isActive: boolean;
  description: string;
  allowedScope: string;
};

export const identityRuntime = {
  isTestMode: true,
  modeLabel: "畫面預覽",
  formalModeNote: "正式版將依登入帳號與權限顯示，不能自行切換。",
  lineBindingNote: "LINE 帳號綁定目前為前端示意，尚未啟用正式綁定流程。",
};

export const mockIdentities: Record<UserRole, MockIdentity> = {
  admin: {
    identityId: "mock-admin",
    displayName: "王主委",
    displayRole: "admin",
    devoteeId: "mock-devotee-admin",
    teamMemberId: "mock-team-admin",
    linkedLineUser: "linked-to-staff",
    permissionSet: "管理者完整權限",
    permissionGrants: ["view", "create", "edit", "archive", "restore", "review", "approve", "settings"],
    modulePermissions: [
      { moduleKey: "team", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
      { moduleKey: "devotees", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
      { moduleKey: "ledger", level: "approve", reviewMarks: ["初審", "覆核", "核准"] },
    ],
    isTestMode: true,
    isLineLinked: true,
    isActive: true,
    description: "主任委員身分，可檢視管理者設定與高風險操作。",
    allowedScope: "可管理團隊、權限、目錄、發布管道與日常資料。",
  },
  staff: {
    identityId: "mock-staff",
    displayName: "陳幹事",
    displayRole: "staff",
    devoteeId: "mock-devotee-staff",
    teamMemberId: "mock-team-staff",
    linkedLineUser: "linked-to-staff",
    permissionSet: "日常作業權限",
    permissionGrants: ["view", "create", "edit", "archive-request"],
    modulePermissions: [
      { moduleKey: "devotees", level: "daily-work", reviewMarks: ["初審"] },
      { moduleKey: "visits", level: "daily-work", reviewMarks: ["初審"] },
      { moduleKey: "announcements", level: "review", reviewMarks: ["初審", "覆核"] },
    ],
    isTestMode: true,
    isLineLinked: true,
    isActive: true,
    description: "廟方日常作業人員，可新增與維護被授權的業務資料。",
    allowedScope: "可處理善信、友宮、來訪、採購、帳務、公告與活動等日常作業。",
  },
  viewer: {
    identityId: "mock-devotee",
    displayName: "林善信",
    displayRole: "viewer",
    devoteeId: "mock-devotee-viewer",
    linkedLineUser: "linked-to-devotee",
    permissionSet: "對外資訊與本人紀錄",
    permissionGrants: ["view"],
    modulePermissions: [
      { moduleKey: "announcements", level: "view", reviewMarks: [] },
      { moduleKey: "events", level: "view", reviewMarks: [] },
      { moduleKey: "devotees", level: "view", reviewMarks: [] },
    ],
    isTestMode: true,
    isLineLinked: true,
    isActive: true,
    description: "善信測試身分，只能瀏覽被授權的公開資訊與本人相關資料。",
    allowedScope: "可查詢公告、活動與本人資料，不可新增、編輯、封存或進入設定。",
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
