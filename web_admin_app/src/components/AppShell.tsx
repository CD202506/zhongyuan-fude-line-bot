import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { findModuleByKey, modules, type ModuleKey } from "../data/modules";
import { mockUser, roleOptions, type UserRole } from "../data/mockUser";
import { canEditDailyWork, canUseAdminSettings, permissionLabel, roleHelpText } from "../lib/permissions";
import { RoleContext } from "../lib/roleContext";

type NavItem =
  | { type: "route"; label: string; route: string }
  | { type: "module"; key: ModuleKey; label?: string }
  | { type: "placeholder"; label: string; note: string };

type NavGroup = {
  title: string;
  items: NavItem[];
};

const adminNavGroups: NavGroup[] = [
  { title: "常用", items: [{ type: "route", label: "主控台", route: "/dashboard" }] },
  {
    title: "管理設定",
    items: [
      { type: "route", label: "權限設定", route: "/settings" },
      { type: "module", key: "team" },
      { type: "route", label: "基礎資料設定", route: "/settings" },
    ],
  },
  {
    title: "日常作業",
    items: [
      { type: "module", key: "devotees" },
      { type: "module", key: "shrines" },
      { type: "module", key: "visits" },
      { type: "module", key: "procurements" },
      { type: "module", key: "ledger" },
    ],
  },
  {
    title: "對外發布",
    items: [
      { type: "module", key: "announcements" },
      { type: "module", key: "events" },
      { type: "module", key: "documents" },
    ],
  },
  {
    title: "系統維護",
    items: [
      { type: "route", label: "操作紀錄", route: "/settings" },
      { type: "route", label: "測試資料狀態", route: "/settings" },
    ],
  },
];

const staffNavGroups: NavGroup[] = [
  { title: "常用", items: [{ type: "route", label: "主控台", route: "/dashboard" }] },
  {
    title: "日常作業",
    items: [
      { type: "module", key: "devotees" },
      { type: "module", key: "shrines" },
      { type: "module", key: "visits" },
      { type: "module", key: "procurements" },
      { type: "module", key: "ledger" },
    ],
  },
  {
    title: "對外發布",
    items: [
      { type: "module", key: "announcements" },
      { type: "module", key: "events" },
      { type: "module", key: "documents" },
    ],
  },
];

const devoteeNavGroups: NavGroup[] = [
  {
    title: "對外資訊",
    items: [
      { type: "module", key: "announcements" },
      { type: "module", key: "events" },
    ],
  },
  {
    title: "我的紀錄",
    items: [
      { type: "module", key: "devotees", label: "我的資料" },
      { type: "placeholder", label: "我的參與紀錄", note: "未來開放" },
      { type: "placeholder", label: "發財金紀錄", note: "未來開放" },
    ],
  },
];

function navGroupsForRole(role: UserRole) {
  if (role === "admin") return adminNavGroups;
  if (role === "staff") return staffNavGroups;
  return devoteeNavGroups;
}

function moduleKeysForRole(role: UserRole) {
  return new Set(
    navGroupsForRole(role)
      .flatMap((group) => group.items)
      .filter((item): item is Extract<NavItem, { type: "module" }> => item.type === "module")
      .map((item) => item.key),
  );
}

export function AppShell() {
  const [role, setRole] = useState<UserRole>(mockUser.role);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentModule = modules.find((moduleItem) => location.pathname === moduleItem.route || location.pathname.startsWith(`${moduleItem.route}/`));
  const isModuleHome = currentModule ? location.pathname === currentModule.route : false;
  const canAddCurrentModule = Boolean(currentModule && isModuleHome && canEditDailyWork(role));
  const visibleModuleKeys = moduleKeysForRole(role);
  const canAddVisibleModule = Boolean(currentModule && visibleModuleKeys.has(currentModule.key));
  const navGroups = navGroupsForRole(role);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {sidebarOpen ? (
        <aside className="sidebar" aria-label="主要導覽">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              福
            </div>
            <div>
              <span>A14</span>
              <h1>中原福德宮 Web 後台</h1>
            </div>
          </div>
          <button type="button" className="sidebar-toggle in-sidebar" onClick={() => setSidebarOpen(false)}>
            ← 隱藏選單
          </button>
          <nav className="nav-list">
            {navGroups.map((group) => (
              <div className="nav-group" key={group.title}>
                <span>{group.title}</span>
                {group.items.map((item) => {
                  if (item.type === "route") {
                    if (item.route === "/settings" && !canUseAdminSettings(role)) return null;
                    return <NavLink key={`${group.title}-${item.label}`} to={item.route}>{item.label}</NavLink>;
                  }

                  if (item.type === "placeholder") {
                    return <span key={`${group.title}-${item.label}`} className="nav-placeholder">{item.label}<em>{item.note}</em></span>;
                  }

                  const moduleItem = findModuleByKey(item.key);
                  if (!moduleItem) return null;
                  return <NavLink key={`${group.title}-${item.key}-${item.label ?? moduleItem.title}`} to={moduleItem.route}>{item.label ?? moduleItem.title}</NavLink>;
                })}
              </div>
            ))}
          </nav>
        </aside>
        ) : null}
        <main className="main-content">
          <header className="topbar">
            <div className="topbar-main">
              <div className="topbar-title">
                <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                  ☰ 展開選單
                </button>
                <div>
                  <span className="eyebrow">中原福德宮 Web 後台</span>
                  <h2>{currentModule ? currentModule.title : "主控台"}</h2>
                </div>
              </div>
              {currentModule ? (
                <div className="topbar-module-summary">
                  <span>{currentModule.boundary}</span>
                  <p>{currentModule.description}</p>
                </div>
              ) : null}
              {canAddCurrentModule && canAddVisibleModule && currentModule ? (
                <Link to={`${currentModule.route}/new`} className="primary-action topbar-action">
                  {currentModule.addLabel}
                </Link>
              ) : null}
            </div>
            <div className="topbar-role">
              <strong>目前角色：{permissionLabel(role)}</strong>
              <span>{roleHelpText(role)}</span>
              <div className="role-switch" aria-label="角色切換">
                {roleOptions.map((option) => (
                  <button key={option} type="button" className={role === option ? "active" : ""} onClick={() => setRole(option)}>
                    {permissionLabel(option)}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </RoleContext.Provider>
  );
}
