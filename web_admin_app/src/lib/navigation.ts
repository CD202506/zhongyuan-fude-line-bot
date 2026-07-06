import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";

export type NavItem =
  | { type: "route"; label: string; route: string }
  | { type: "module"; key: ModuleKey; label?: string };

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const adminNavGroups: NavGroup[] = [
  { title: "常用", items: [{ type: "route", label: "主控台", route: "/dashboard" }] },
  {
    title: "資料主檔",
    items: [
      { type: "module", key: "devotees" },
      { type: "module", key: "shrines" },
      { type: "module", key: "team" },
      { type: "route", label: "基礎資料設定", route: "/settings" },
    ],
  },
  {
    title: "內部作業",
    items: [
      { type: "module", key: "visits" },
      { type: "module", key: "procurements" },
      { type: "module", key: "ledger" },
      { type: "module", key: "documents" },
    ],
  },
  {
    title: "內容發布",
    items: [
      { type: "module", key: "announcements", label: "發布內容" },
      { type: "module", key: "events", label: "活動消息" },
      { type: "route", label: "發布管道", route: "/settings" },
      { type: "route", label: "類別 / 標籤", route: "/settings" },
    ],
  },
  {
    title: "權限與系統治理",
    items: [
      { type: "route", label: "權限設定", route: "/settings" },
      { type: "route", label: "操作紀錄", route: "/settings" },
      { type: "route", label: "測試資料狀態", route: "/settings" },
    ],
  },
];

const staffNavGroups: NavGroup[] = [
  { title: "常用", items: [{ type: "route", label: "主控台", route: "/dashboard" }] },
  {
    title: "資料主檔",
    items: [
      { type: "module", key: "devotees" },
      { type: "module", key: "shrines" },
    ],
  },
  {
    title: "內部作業",
    items: [
      { type: "module", key: "visits" },
      { type: "module", key: "procurements" },
      { type: "module", key: "ledger" },
    ],
  },
  {
    title: "內容發布",
    items: [
      { type: "module", key: "announcements", label: "發布內容" },
      { type: "module", key: "events", label: "活動消息" },
    ],
  },
];

const devoteeNavGroups: NavGroup[] = [
  {
    title: "對外資訊",
    items: [
      { type: "module", key: "announcements", label: "公告 / 活動" },
    ],
  },
  {
    title: "我的資料",
    items: [{ type: "module", key: "devotees", label: "我的資料" }],
  },
];

export function navGroupsForRole(role: UserRole) {
  if (role === "admin") return adminNavGroups;
  if (role === "staff") return staffNavGroups;
  return devoteeNavGroups;
}

export function moduleKeysForRole(role: UserRole) {
  return new Set(
    navGroupsForRole(role)
      .flatMap((group) => group.items)
      .filter((item): item is Extract<NavItem, { type: "module" }> => item.type === "module")
      .map((item) => item.key),
  );
}
