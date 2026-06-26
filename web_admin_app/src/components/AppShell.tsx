import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { modules } from "../data/modules";
import { mockUser, roleOptions, type UserRole } from "../data/mockUser";
import { canEditDailyWork, canUseAdminSettings, permissionLabel, roleHelpText } from "../lib/permissions";
import { RoleContext } from "../lib/roleContext";

export function AppShell() {
  const [role, setRole] = useState<UserRole>(mockUser.role);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainModules = modules.filter((moduleItem) => !["procurements", "documents"].includes(moduleItem.key));
  const affairsModules = modules.filter((moduleItem) => ["procurements", "documents"].includes(moduleItem.key));
  const canSeeSettings = canUseAdminSettings(role);
  const currentModule = modules.find((moduleItem) => location.pathname === moduleItem.route || location.pathname.startsWith(`${moduleItem.route}/`));
  const isModuleHome = currentModule ? location.pathname === currentModule.route : false;
  const canAddCurrentModule = Boolean(currentModule && isModuleHome && canEditDailyWork(role));

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
            <div className="nav-group">
              <span>常用</span>
              <NavLink to="/dashboard">主控台</NavLink>
              {canSeeSettings ? <NavLink to="/settings">管理者設定</NavLink> : null}
            </div>
            <div className="nav-group">
              <span>日常作業</span>
              {mainModules.map((moduleItem) => (
                <NavLink key={moduleItem.key} to={moduleItem.route}>
                  {moduleItem.title}
                </NavLink>
              ))}
            </div>
            <div className="nav-group">
              <span>廟務文件</span>
              {affairsModules.map((moduleItem) => (
                <NavLink key={moduleItem.key} to={moduleItem.route}>
                  {moduleItem.title}
                </NavLink>
              ))}
            </div>
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
              {canAddCurrentModule && currentModule ? (
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
