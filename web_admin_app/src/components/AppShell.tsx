import { NavLink, Outlet } from "react-router-dom";
import { modules } from "../data/modules";
import { mockUser } from "../data/mockUser";
import { PermissionBadge } from "./PermissionBadge";

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主要導覽">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            福
          </div>
          <div>
            <span>A13</span>
            <h1>中原福德宮 Web 後台</h1>
          </div>
        </div>
        <PermissionBadge role={mockUser.role} />
        <nav className="nav-list">
          <NavLink to="/dashboard">主控台</NavLink>
          {modules.map((moduleItem) => (
            <NavLink key={moduleItem.key} to={moduleItem.route}>
              {moduleItem.title}
            </NavLink>
          ))}
          <NavLink to="/settings">管理者設定</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">後台預覽</span>
            <h2>中原福德宮 Web 後台</h2>
          </div>
          <PermissionBadge role={mockUser.role} />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
