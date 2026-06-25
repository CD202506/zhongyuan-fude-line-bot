import { modules } from "../data/modules";

export const appRoutes = [
  { path: "/", label: "主控台" },
  { path: "/dashboard", label: "主控台" },
  ...modules.map((moduleItem) => ({ path: moduleItem.route, label: moduleItem.title })),
  { path: "/settings", label: "管理者設定" },
];
