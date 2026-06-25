import { Link, useLocation } from "react-router-dom";
import { modules } from "../data/modules";
import { recordsForModule } from "../data/mockRecords";
import { StatusBadge } from "../components/StatusBadge";

export function ModuleListPage() {
  const location = useLocation();
  const moduleItem = modules.find((item) => item.route === location.pathname) ?? modules[0];
  const records = recordsForModule(moduleItem.key);

  return (
    <div className="page-stack">
      <section className="content-panel module-header">
        <div>
          <span className="eyebrow">{moduleItem.boundary}</span>
          <h2>{moduleItem.title}</h2>
          <p>{moduleItem.description}</p>
        </div>
        <button type="button" className="primary-action">
          {moduleItem.addLabel}
        </button>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <h3>列表 / 搜尋</h3>
          <span>列表頁不直接編輯 / 刪除</span>
        </div>
        <label className="search-field">
          <span>搜尋測試資料</span>
          <input type="search" placeholder={`搜尋${moduleItem.title}`} />
        </label>
        <div className="record-list">
          {records.map((record) => (
            <article key={record.id} className="record-card">
              <div>
                <StatusBadge status={record.status} />
                <h3>{record.title}</h3>
                <p>{record.summary}</p>
                <span>{record.dateLabel} / {record.owner}</span>
              </div>
              <Link to={`${moduleItem.route}/${record.id}`} className="detail-link">
                查看詳情
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
