import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { modules } from "../data/modules";
import { recordsForModule } from "../data/mockRecords";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import type { ModuleKey } from "../data/modules";

type StatusFilter = "active" | "archived" | "all";

const searchLabels: Record<ModuleKey, string> = {
  "temple-affairs": "搜尋廟務資料",
  devotees: "搜尋善信資料",
  shrines: "搜尋友宮資料",
  visits: "搜尋來訪或請帖",
  announcements: "搜尋公告",
  events: "搜尋活動",
  procurements: "搜尋採購資料",
  documents: "搜尋公文或通知",
  team: "搜尋團隊成員",
  ledger: "搜尋帳務資料",
};

export function ModuleListPage() {
  const location = useLocation();
  const { role } = useRole();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const moduleItem = modules.find((item) => item.route === location.pathname) ?? modules[0];
  const records = recordsForModule(moduleItem.key);
  const effectiveStatusFilter = role === "viewer" ? "active" : statusFilter;
  const visibleRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return records.filter((record) => {
      const activeRecord = record.statusCategory !== "archived" && record.statusCategory !== "disabled";
      const archivedRecord = record.statusCategory === "archived" || record.statusCategory === "disabled";
      const matchesStatus =
        effectiveStatusFilter === "all" || (effectiveStatusFilter === "active" && activeRecord) || (effectiveStatusFilter === "archived" && archivedRecord);
      const searchableText = [
        record.title,
        record.summary,
        record.status,
        record.owner,
        record.dateLabel,
        ...record.listFields.flatMap((field) => [field.label, field.value]),
      ].join(" ").toLowerCase();
      const matchesKeyword = normalizedKeyword.length === 0 || searchableText.includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });
  }, [effectiveStatusFilter, keyword, records]);

  return (
    <div className="page-stack">
      <section className="content-panel">
        <div className="section-heading">
          <h3>搜尋與列表</h3>
          <span>先查看詳情，再處理資料</span>
        </div>
        <label className="search-field">
          <span>{searchLabels[moduleItem.key]}</span>
          <input type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={searchLabels[moduleItem.key]} />
        </label>
        <div className="status-filter-panel">
          <span>狀態篩選</span>
          {role === "viewer" ? (
            <div className="permission-strip compact">
              <strong>未停用 / 未封存</strong>
              <span>查看模式只顯示日常可瀏覽資料。</span>
            </div>
          ) : (
            <div className="status-filter-buttons" role="group" aria-label="狀態篩選">
              <button type="button" className={statusFilter === "active" ? "selected" : ""} onClick={() => setStatusFilter("active")}>
                使用中 / 進行中 / 未封存
              </button>
              <button type="button" className={statusFilter === "archived" ? "selected" : ""} onClick={() => setStatusFilter("archived")}>
                已停用 / 已封存
              </button>
              <button type="button" className={statusFilter === "all" ? "selected" : ""} onClick={() => setStatusFilter("all")}>
                全部
              </button>
            </div>
          )}
        </div>
        <div className="record-list">
          {visibleRecords.map((record) => (
            <article key={record.id} className="record-card">
              <div className="record-status">
                <StatusBadge status={record.status} />
              </div>
              <div className="record-main">
                <h3>{record.title}</h3>
                <p>{record.summary}</p>
              </div>
              <div className="record-fields">
                {record.listFields.slice(0, 3).map((field) => (
                  <span key={field.label}>
                    <b>{field.label}</b>{field.value}
                  </span>
                ))}
                <span>
                  <b>日期 / 負責</b>{record.dateLabel} / {record.owner}
                </span>
              </div>
              <Link to={`${moduleItem.route}/${record.id}`} className="detail-link">
                查看詳情
              </Link>
            </article>
          ))}
          {visibleRecords.length === 0 ? (
            <div className="empty-state">
              <strong>目前沒有符合條件的資料</strong>
              <span>可調整搜尋文字或狀態篩選，再重新查看列表。</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
