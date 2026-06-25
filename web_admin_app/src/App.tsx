import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { modules } from "./data/modules";
import { DashboardPage } from "./routes/DashboardPage";
import { ModuleDetailPage } from "./routes/ModuleDetailPage";
import { ModuleListPage } from "./routes/ModuleListPage";
import { SettingsPage } from "./routes/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {modules.map((moduleItem) => (
          <Route key={moduleItem.key} path={moduleItem.route} element={<ModuleListPage />} />
        ))}
        {modules.map((moduleItem) => (
          <Route key={`${moduleItem.key}-detail`} path={`${moduleItem.route}/:id`} element={<ModuleDetailPage />} />
        ))}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
