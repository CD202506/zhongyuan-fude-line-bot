import { useState } from "react";
import { Link } from "react-router-dom";
import { mockDataStatus } from "../data/mockRecords";
import { canUseAdminSettings } from "../lib/permissions";
import { DetailActionMode, DetailActionPanel } from "../components/DetailActionPanel";
import { useRole } from "../lib/roleContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { assigneeSemantics, categorySemantics, publishingSemantics, tagSemantics } from "../lib/domainModel";

const settings = [
  {
    title: "團隊管理",
    body: "維護團隊成員、宮廟職稱、任期與可使用的作業範圍。",
    action: "管理團隊",
  },
  {
    title: "權限設定",
    body: "先選擇團隊成員，再授予不同模組的初審、覆核或核准權限標記。",
    action: "設定權限",
  },
  {
    title: "類別管理",
    body: categorySemantics.note,
    action: "管理類別",
  },
  {
    title: "標籤管理",
    body: tagSemantics.note,
    action: "管理標籤",
  },
  {
    title: "承辦與權限",
    body: assigneeSemantics.note,
    action: "設定承辦",
  },
  {
    title: "發布管道管理",
    body: "網站、LINE 官方帳號、LINE VOOM、Facebook、公告欄列印與內部備查先作為選項，不真正發布。",
    action: "設定發布管道",
  },
  {
    title: "可見權限",
    body: "發布內容可標示公開、善信、廟方人員、管理者、指定團隊成員或內部備查。",
    action: "設定可見對象",
  },
  {
    title: "基礎資料設定",
    body: "維護日常作業會用到的分類、狀態與常用選項，不混入權限或發布紀錄。",
    action: "設定基礎資料",
  },
  {
    title: "操作紀錄",
    body: "記錄新增、編輯、封存、還原與審核標記，供後續治理使用。",
    action: "查看操作紀錄",
  },
  {
    title: "測試資料說明",
    body: "說明目前測試站資料用途與注意事項，避免誤認為正式資料。",
    action: "查看說明",
  },
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
          <h2>管理者設定總覽</h2>
          <p>權限會以團隊成員為先決條件，正式版再依登入帳號或 LINE 綁定身份顯示可用功能。</p>
        </div>
        <span className="admin-state">管理者可操作</span>
      </section>

      <section className="settings-grid">
        {settings.map((item) => (
          <article key={item.title} className="setting-card">
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <button type="button">{item.action}</button>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <h3>發布設定說明</h3>
          <span>發布前確認</span>
        </div>
        <div className="status-box">
          <span>{publishingSemantics.sourceNote}</span>
          <span>發布類別：{publishingSemantics.categories.join("、")}。</span>
          <span>發布管道：{publishingSemantics.channels.join("、")}。</span>
          <span>可見對象：{publishingSemantics.audiences.join("、")}。</span>
          <span>目前只做發布資料整理，不會真正發布到 LINE、VOOM、網站或 Facebook。</span>
        </div>
      </section>

      <section className="content-panel identity-note">
        <div className="section-heading">
          <h3>登入與帳號連結準備</h3>
          <span>後續規劃</span>
        </div>
        <div className="status-box">
          <span>正式版將依登入帳號或 LINE 綁定身份判斷權限，使用者不能自行切換。</span>
          <span>LINE 帳號未來可連到團隊成員或善信資料；目前只做畫面準備。</span>
          <span>善信不列入內部權限授予清單，只保留對外資訊與本人資料查詢。</span>
        </div>
      </section>

      <section className="detail-layout">
        <article className="content-panel">
          <h3>測試資料說明</h3>
          <div className="status-box">
            {mockDataStatus.map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span>初審、覆核、核准先作為紀錄與權限標記，不強制卡住作業流程。</span>
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
