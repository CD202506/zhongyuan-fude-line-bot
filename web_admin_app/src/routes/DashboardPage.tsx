import { Link } from "react-router-dom";
import { modules } from "../data/modules";
import type { ModuleKey } from "../data/modules";
import { mockDataStatus, mockRecords, reminders } from "../data/mockRecords";
import { ModuleCard } from "../components/ModuleCard";
import { SummaryCard } from "../components/SummaryCard";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import { moduleKeysForRole } from "../lib/navigation";
import { identityForRole, identityRuntime, lineBindingLabel } from "../lib/identity";

export function DashboardPage() {
  const { role } = useRole();
  const countByModule = (key: string) => mockRecords.filter((record) => record.moduleKey === key).length;
  const visibleModuleKeys = Array.from(moduleKeysForRole(role)) as ModuleKey[];
  const visibleModules = modules.filter((moduleItem) => visibleModuleKeys.includes(moduleItem.key));
  const visibleRecords = mockRecords.filter((record) => visibleModuleKeys.includes(record.moduleKey));
  const urgentRecords = visibleRecords.filter((record) => ["待確認", "待回覆", "待整理", "草稿"].includes(record.status));
  const publicRecords = mockRecords.filter((record) => ["announcements", "events"].includes(record.moduleKey));
  const identity = identityForRole(role);

  if (role === "viewer") {
    return (
      <div className="page-stack">
        <section className="hero-panel devotee-hero">
          <div>
          <span className="eyebrow">中原福德宮 Web 後台</span>
          <h2>善信服務</h2>
          <p>可瀏覽對外公告 / 活動等公開內容，不進入內部廟務、採購、帳務或權限設定；個人紀錄功能將於後續版本整理。</p>
          <p className="identity-inline-note">目前檢視善信畫面；正式版會依登入帳號顯示本人資料。</p>
        </div>
      </section>

        <section className="summary-grid devotee-summary" aria-label="善信服務">
          <SummaryCard label="最新公告" value={countByModule("announcements")} note="公開資訊" />
          <SummaryCard label="近期活動" value={countByModule("events")} note="活動資訊" />
          <SummaryCard label="我的資料" value="1" note="本人相關紀錄" />
        </section>

        <section className="content-panel">
          <div className="section-heading">
            <h3>公告 / 活動</h3>
            <span>公開資訊</span>
          </div>
          <div className="record-list compact">
            {publicRecords.slice(0, 5).map((record) => (
              <Link key={record.id} to={`/${record.moduleKey}/${record.id}`} className="record-row">
                <div>
                  <strong>{record.title}</strong>
                  <span>{record.dateLabel}</span>
                </div>
                <StatusBadge status={record.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="content-panel">
          <div className="section-heading">
            <h3>我的紀錄</h3>
            <span>低干擾預留</span>
          </div>
          <div className="status-box">
            <span>我的資料可先查看基本紀錄；參與紀錄與發財金紀錄會在後續試用前整理。</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">中原福德宮 Web 後台</span>
          <h2>{role === "admin" ? "日常總覽" : "廟方作業"}</h2>
          <p>{role === "admin" ? "今日待確認、近期來訪、發布草稿與帳務草稿集中查看。" : "來訪請帖、發布草稿與日常作業集中查看。"}</p>
        </div>
      </section>

      <section className="summary-grid" aria-label={role === "admin" ? "日常總覽" : "廟方作業"}>
        {role === "admin" ? <SummaryCard label="友宮數" value={countByModule("shrines")} note="友宮主檔" /> : null}
        <SummaryCard label="近期來訪" value={countByModule("visits")} note="待確認" />
        <SummaryCard label="待處理請帖" value="2" note="待回覆" />
        <SummaryCard label="發布草稿" value={countByModule("announcements")} note="待確認" />
        <SummaryCard label="活動消息" value={countByModule("events")} note="發布準備" />
        <SummaryCard label="採購待確認" value={countByModule("procurements")} note="需驗收與對帳" />
        {role === "admin" ? <SummaryCard label="待整理公文" value={countByModule("documents")} note="內部文件" /> : null}
        {role === "admin" ? <SummaryCard label="帳務草稿" value={countByModule("ledger")} note="內部帳務" /> : null}
      </section>

      {role === "staff" ? (
        <section className="content-panel identity-note">
          <div className="section-heading">
            <h3>我的作業權限</h3>
            <span>{identityRuntime.modeLabel}</span>
          </div>
          <div className="status-box">
            <span>目前檢視廟方人員畫面：{identity.displayName}。</span>
            <span>{lineBindingLabel(identity)}；正式版依登入帳號與團隊授權顯示可處理作業。</span>
            <span>初審、覆核、核准先作為權限標記，不強制卡住作業流程。</span>
          </div>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="section-heading">
          <h3>重要待辦</h3>
          <span>先確認，再處理</span>
        </div>
        <div className="todo-grid">
          {urgentRecords.slice(0, 4).map((record) => (
            <Link key={record.id} to={`/${record.moduleKey}/${record.id}`} className="todo-card">
              <StatusBadge status={record.status} />
              <strong>{record.title}</strong>
              <span>{record.dateLabel} / {record.owner}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="content-panel">
          <div className="section-heading">
            <h3>近期資料</h3>
            <span>內部作業與發布準備</span>
          </div>
          <div className="record-list compact">
            {visibleRecords.slice(0, 5).map((record) => (
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

        {role === "admin" ? <article className="content-panel">
          <div className="section-heading">
            <h3>維運提醒</h3>
            <span>資料提醒</span>
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
        </article> : null}
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <h3>模組入口</h3>
          <span>少層級、卡片式入口</span>
        </div>
        <div className="module-grid">
          {visibleModules.map((moduleItem) => (
            <ModuleCard key={moduleItem.key} moduleItem={moduleItem} count={countByModule(moduleItem.key)} />
          ))}
        </div>
      </section>
    </div>
  );
}
