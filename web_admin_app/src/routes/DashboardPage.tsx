import { Link } from "react-router-dom";
import { modules } from "../data/modules";
import { mockUser } from "../data/mockUser";
import { mockDataStatus, mockRecords, reminders } from "../data/mockRecords";
import { ModuleCard } from "../components/ModuleCard";
import { SummaryCard } from "../components/SummaryCard";
import { StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const countByModule = (key: string) => mockRecords.filter((record) => record.moduleKey === key).length;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">中原福德宮 Web 後台</span>
          <h2>日常總覽</h2>
          <p>集中查看近期廟務、來訪請帖、公告活動、採購、公文與帳務草稿。</p>
        </div>
        <div className="user-card">
          <strong>{mockUser.name}</strong>
          <span>{mockUser.note}</span>
        </div>
      </section>

      <section className="summary-grid" aria-label="日常總覽">
        <SummaryCard label="友宮數" value={countByModule("shrines")} note="測試友宮主檔" />
        <SummaryCard label="近期來訪" value={countByModule("visits")} note="待確認互動事件" />
        <SummaryCard label="待處理請帖" value="2" note="待回覆" />
        <SummaryCard label="公告草稿" value={countByModule("announcements")} note="待發布" />
        <SummaryCard label="本月活動" value={countByModule("events")} note="籌備中活動" />
        <SummaryCard label="待確認採購" value={countByModule("procurements")} note="需驗收與對帳" />
        <SummaryCard label="待整理公文" value={countByModule("documents")} note="文件紀錄" />
        <SummaryCard label="帳務草稿" value={countByModule("ledger")} note="不含正式帳務" />
      </section>

      <section className="two-column">
        <article className="content-panel">
          <div className="section-heading">
            <h3>近期活動</h3>
            <span>列表只提供查看詳情</span>
          </div>
          <div className="record-list compact">
            {mockRecords.slice(0, 5).map((record) => (
              <Link key={record.id} to={`/${record.moduleKey}/${record.id}`} className="record-row">
                <div>
                  <strong>{record.title}</strong>
                  <span>{record.dateLabel} / {record.owner}</span>
                </div>
                <StatusBadge status={record.status} />
              </Link>
            ))}
          </div>
        </article>

        <article className="content-panel">
          <div className="section-heading">
            <h3>維運提醒</h3>
            <span>測試資料狀態</span>
          </div>
          <ul className="plain-list">
            {reminders.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="status-box">
            {mockDataStatus.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <h3>模組入口</h3>
          <span>少層級、卡片式入口</span>
        </div>
        <div className="module-grid">
          {modules.map((moduleItem) => (
            <ModuleCard key={moduleItem.key} moduleItem={moduleItem} count={countByModule(moduleItem.key)} />
          ))}
        </div>
      </section>
    </div>
  );
}
