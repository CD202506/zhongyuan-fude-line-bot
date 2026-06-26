import { useState } from "react";
import { Link } from "react-router-dom";
import { mockDataStatus } from "../data/mockRecords";
import { canUseAdminSettings } from "../lib/permissions";
import { DetailActionMode, DetailActionPanel } from "../components/DetailActionPanel";
import { useRole } from "../lib/roleContext";
import { ConfirmDialog } from "../components/ConfirmDialog";

const settings = [
  "來訪型態設定",
  "發布管道設定",
  "帳務科目設定",
  "權限角色設定",
  "資料狀態",
  "LINE Bot 整合設定",
];

export function SettingsPage() {
  const { role } = useRole();
  const [actionMode, setActionMode] = useState<DetailActionMode>("view");
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | "risk" | "staffRisk" | null>(null);
  const canUse = canUseAdminSettings(role);
  const confirmContent = pendingAction === "draft"
    ? {
        title: "確認儲存草稿",
        body: "草稿會保留目前填寫內容，之後仍可再確認與送出。",
        tone: "default" as const,
        onConfirm: () => {
          setActionMode("draft");
          setPendingAction(null);
        },
      }
    : pendingAction === "submit"
      ? {
          title: "確認送出",
          body: "送出前請再次確認資料內容是否正確。",
          tone: "default" as const,
          onConfirm: () => {
            setActionMode("submitted");
            setPendingAction(null);
          },
        }
      : pendingAction === "staffRisk"
        ? {
            title: "需要管理者確認",
            body: "此操作送出後，需由管理者確認才會生效。",
            tone: "warning" as const,
            onConfirm: () => {
              setActionMode("staffRisk");
              setPendingAction(null);
            },
          }
        : {
            title: "確認停用 / 封存",
            body: "停用或封存後，資料仍會保留在紀錄中，日常列表將不再優先顯示。",
            tone: "warning" as const,
            onConfirm: () => {
              setActionMode("riskSubmitted");
              setPendingAction(null);
            },
          };

  if (!canUse) {
    return (
      <div className="page-stack">
        <section className="content-panel module-header">
          <div>
            <span className="eyebrow">權限提醒</span>
            <h2>此頁面僅管理者可使用</h2>
            <p>目前可回到主控台查看日常資料。</p>
          </div>
          <Link to="/dashboard" className="primary-action">
            返回主控台
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="content-panel module-header">
        <div>
          <span className="eyebrow">集中管理者設定</span>
          <h2>管理者設定</h2>
          <p>設定類、權限類、資料狀態與 LINE Bot 整合集中於此。</p>
        </div>
        <span className="admin-state">管理者可操作</span>
      </section>

      <section className="settings-grid">
        {settings.map((item) => (
          <article key={item} className="setting-card">
            <strong>{item}</strong>
            <p>可進入調整。</p>
            <button type="button">管理</button>
          </article>
        ))}
      </section>

      <section className="detail-layout">
        <article className="content-panel">
          <h3>資料狀態</h3>
          <div className="status-box">
            {mockDataStatus.map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span>重要設定需由管理者確認後處理。</span>
          </div>
        </article>
        <DetailActionPanel
          isAdminOnly
          role={role}
          mode={actionMode}
          onEdit={() => setActionMode("edit")}
          onCancelEdit={() => setActionMode("view")}
          onSaveDraft={() => setPendingAction("draft")}
          onSubmit={() => setPendingAction("submit")}
          onRequestRisk={() => setPendingAction("risk")}
        />
      </section>
      {pendingAction ? (
        <ConfirmDialog
          title={confirmContent.title}
          body={confirmContent.body}
          tone={confirmContent.tone}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmContent.onConfirm}
        />
      ) : null}
    </div>
  );
}
