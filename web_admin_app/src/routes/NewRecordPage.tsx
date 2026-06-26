import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { NewRecordPanel } from "../components/NewRecordPanel";
import { modules } from "../data/modules";
import { canEditDailyWork } from "../lib/permissions";
import { useRole } from "../lib/roleContext";

export function NewRecordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  const moduleItem = modules.find((item) => `${item.route}/new` === location.pathname);

  if (!moduleItem) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canEditDailyWork(role)) {
    return (
      <div className="page-stack">
        <section className="content-panel detail-header">
          <div>
            <Link to={moduleItem.route} className="back-link">
              返回列表
            </Link>
            <span className="eyebrow">{moduleItem.title}</span>
            <h2>{moduleItem.addLabel}</h2>
            <div className="permission-strip compact">
              <strong>查看模式</strong>
              <span>目前可瀏覽資料內容；如需新增資料請洽管理者或廟方人員。</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="content-panel detail-header">
        <div>
          <Link to={moduleItem.route} className="back-link">
            返回列表
          </Link>
          <span className="eyebrow">{moduleItem.boundary}</span>
          <h2>{moduleItem.addLabel}</h2>
          <p>{moduleItem.description}</p>
        </div>
      </section>
      <NewRecordPanel
        moduleItem={moduleItem}
        role={role}
        onCancel={() => navigate(moduleItem.route)}
        onComplete={() => navigate(moduleItem.route)}
      />
    </div>
  );
}
