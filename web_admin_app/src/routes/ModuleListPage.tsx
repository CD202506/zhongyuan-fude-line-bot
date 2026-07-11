import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { modules } from "../data/modules";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import type { ModuleKey } from "../data/modules";
import { apiConnectionErrorMessage, listRecords, type StatusFilter } from "../services/recordService";
import type { MockRecord } from "../data/mockRecords";

type ListRouteState = {
  notice?: string;
};

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

const listHints: Record<ModuleKey, string> = {
  "temple-affairs": "請先確認廟務內容，再更新處理狀態或封存紀錄。",
  devotees: "查看詳情後，可維護本人資料授權、發財金或基本資料。",
  shrines: "查看詳情後，可維護聯絡窗口與相關往來紀錄。",
  visits: "查看詳情後，可確認來訪、請帖回覆與承辦進度。",
  announcements: "查看詳情後，可整理發布內容、管道與可見對象。",
  events: "查看詳情後，可整理活動消息、發布管道與參與紀錄。",
  procurements: "查看詳情後，可確認採購內容與帳務紀錄。",
  documents: "查看詳情後，可整理文件內容與後續通知。",
  team: "查看詳情後，可維護職稱、任期與權限標記。",
  ledger: "查看詳情後，可確認帳務分類、金額與相關採購紀錄。",
};

export function ModuleListPage() {
  const location = useLocation();
  const { role } = useRole();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [visibleRecords, setVisibleRecords] = useState<MockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const moduleItem = modules.find((item) => item.route === location.pathname) ?? modules[0];
  const effectiveStatusFilter = role === "viewer" ? "active" : statusFilter;
  const routeState = location.state as ListRouteState | null;

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setErrorMessage("");
    listRecords(moduleItem.key, { keyword, statusFilter: effectiveStatusFilter, role })
      .then((records) => {
        if (!active) return;
        setVisibleRecords(records);
      })
      .catch(() => {
        if (!active) return;
        setVisibleRecords([]);
        setErrorMessage(apiConnectionErrorMessage);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [effectiveStatusFilter, keyword, moduleItem.key, role]);

  return (
    <div className="page-stack">
      <section className="content-panel">
        <div className="section-heading">
          <h3>搜尋與列表</h3>
          <span>{listHints[moduleItem.key]}</span>
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
              <span>善信角色只顯示可公開瀏覽或本人相關資料。</span>
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
          {routeState?.notice ? (
            <div className="process-panel success">
              <strong>處理完成</strong>
              <span>{routeState.notice}</span>
            </div>
          ) : null}
          {errorMessage ? (
            <div className="process-panel warning">
              <strong>資料服務連線失敗</strong>
              <span>{errorMessage}</span>
            </div>
          ) : null}
          {isLoading ? (
            <div className="empty-state">
              <strong>資料載入中</strong>
              <span>請稍候。</span>
            </div>
          ) : null}
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
                {record.listFields.slice(0, 4).map((field) => (
                  <span key={field.label}>
                    <b>{field.label}</b>{field.value}
                  </span>
                ))}
              </div>
              <Link to={`${moduleItem.route}/${record.id}`} className="detail-link">
                查看詳情
              </Link>
            </article>
          ))}
          {!isLoading && !errorMessage && visibleRecords.length === 0 ? (
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
