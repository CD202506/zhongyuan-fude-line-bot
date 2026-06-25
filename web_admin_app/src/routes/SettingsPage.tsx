import { mockUser } from "../data/mockUser";
import { mockDataStatus } from "../data/mockRecords";
import { canUseAdminSettings } from "../lib/permissions";
import { DetailActionPanel } from "../components/DetailActionPanel";

const settings = [
  "來訪型態設定",
  "發布管道設定",
  "帳務科目設定",
  "權限角色設定",
  "測試資料狀態",
  "LINE Bot 整合設定",
];

export function SettingsPage() {
  const canUse = canUseAdminSettings(mockUser.role);

  return (
    <div className="page-stack">
      <section className="content-panel module-header">
        <div>
          <span className="eyebrow">集中管理者設定</span>
          <h2>管理者設定</h2>
          <p>設定類、權限類、LINE Bot 整合與資料狀態集中於此。非管理者功能會以灰色顯示。</p>
        </div>
        <span className={canUse ? "admin-state" : "admin-state locked"}>
          {canUse ? "管理者可操作" : "非管理者灰色不可操作"}
        </span>
      </section>

      <section className="settings-grid">
        {settings.map((item) => (
          <article key={item} className={`setting-card ${canUse ? "" : "locked"}`}>
            <strong>{item}</strong>
            <p>{canUse ? "待後續確認設定內容。" : "目前角色不可操作。"}</p>
            <button type="button" disabled={!canUse}>管理</button>
          </article>
        ))}
      </section>

      <section className="detail-layout">
        <article className="content-panel">
          <h3>測試資料狀態</h3>
          <div className="status-box">
            {mockDataStatus.map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span>重要設定需由管理者確認後處理。</span>
          </div>
        </article>
        <DetailActionPanel isAdminOnly />
      </section>
    </div>
  );
}
