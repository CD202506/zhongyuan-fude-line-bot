import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { findModuleByKey, modules } from "../data/modules";
import { mockUser, roleOptions, type UserRole } from "../data/mockUser";
import { canEditDailyWork, canUseAdminSettings, permissionLabel } from "../lib/permissions";
import { moduleKeysForRole, navGroupsForRole } from "../lib/navigation";
import { RoleContext } from "../lib/roleContext";

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
  const routeIsActive = (route: string) => {
    const [pathname, search = ""] = route.split("?");
    if (location.pathname !== pathname) return false;
    if (!search) return location.search === "";

    const expectedParams = new URLSearchParams(search);
    const currentParams = new URLSearchParams(location.search);
    for (const [key, value] of expectedParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return currentParams.toString() === expectedParams.toString();
  };
  const navItemIsActive = (item: (typeof navGroups)[number]["items"][number]) => {
    if (item.type === "route") return routeIsActive(item.route);

    const moduleItem = findModuleByKey(item.key);
    return Boolean(moduleItem && (location.pathname === moduleItem.route || location.pathname.startsWith(`${moduleItem.route}/`)));
  };
  const activeGroupTitle = navGroups.find((group) => group.items.some(navItemIsActive))?.title;
  const [openGroupKeys, setOpenGroupKeys] = useState<Set<string>>(() => activeGroupTitle ? new Set([`${role}:${activeGroupTitle}`]) : new Set());

  useEffect(() => {
    if (!activeGroupTitle) return;
    const activeGroupKey = `${role}:${activeGroupTitle}`;
    setOpenGroupKeys((current) => current.has(activeGroupKey) ? current : new Set(current).add(activeGroupKey));
  }, [activeGroupTitle, role, location.pathname, location.search]);

  const toggleGroup = (groupTitle: string) => {
    const groupKey = `${role}:${groupTitle}`;
    setOpenGroupKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

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
                {(() => {
                  const groupKey = `${role}:${group.title}`;
                  const isOpen = openGroupKeys.has(groupKey);

                  return (
                    <>
                      <button type="button" className="nav-group-toggle" aria-expanded={isOpen} onClick={() => toggleGroup(group.title)}>
                        <span>{group.title}</span>
                        <span aria-hidden="true">{isOpen ? "▼" : "▶"}</span>
                      </button>
                      {isOpen ? (
                        <div className="nav-group-items">
                          {group.items.map((item) => {
                            if (item.type === "route") {
                              if (item.route.startsWith("/settings") && !canUseAdminSettings(role)) return null;
                              const isActive = routeIsActive(item.route);
                              return (
                                <Link key={`${group.title}-${item.label}`} to={item.route} className={isActive ? "active" : undefined} aria-current={isActive ? "page" : undefined}>
                                  {item.label}
                                </Link>
                              );
                            }

                            const moduleItem = findModuleByKey(item.key);
                            if (!moduleItem) return null;
                            return <NavLink key={`${group.title}-${item.key}-${item.label ?? moduleItem.title}`} to={moduleItem.route}>{item.label ?? moduleItem.title}</NavLink>;
                          })}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            ))}
          </nav>
        </aside>
        ) : null}
        <main className="main-content">
          <header className="topbar">
            <div className="topbar-main">
              <div className="topbar-title">
                {!sidebarOpen ? (
                  <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                    ☰ 展開選單
                  </button>
                ) : null}
                <div>
                  <h2>{currentModule ? currentModule.title : "主控台"}</h2>
                </div>
              </div>
              {currentModule ? (
                <div className="topbar-module-summary">
                  <p>{currentModule.description}</p>
                </div>
              ) : null}
              {canAddCurrentModule && canAddVisibleModule && currentModule ? (
                <Link to={`${currentModule.route}/new`} className="primary-action topbar-action">
                  {currentModule.addLabel}
                </Link>
              ) : null}
            </div>
            <div className="topbar-role preview-role-panel">
              <span>目前角色：{permissionLabel(role)}</span>
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
