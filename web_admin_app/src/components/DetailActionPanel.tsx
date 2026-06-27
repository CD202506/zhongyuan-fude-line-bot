import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";
import { canEditDailyWork, canUseRiskAction, permissionLabel } from "../lib/permissions";

export type DetailActionMode = "view" | "edit" | "draft" | "submitted" | "riskPending" | "riskSubmitted" | "staffRisk";

type DetailActionPanelProps = {
  isAdminOnly?: boolean;
  moduleKey?: ModuleKey;
  role: UserRole;
  mode: DetailActionMode;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onRequestRisk: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
};

function primaryActionLabel(moduleKey?: ModuleKey) {
  const labels: Partial<Record<ModuleKey, string>> = {
    announcements: "送出發布確認",
    events: "確認活動安排",
    procurements: "確認採購",
    documents: "標記已整理",
    ledger: "送出帳務確認",
    visits: "確認回覆請帖",
  };

  return moduleKey ? labels[moduleKey] ?? "送出確認" : "送出確認";
}

export function DetailActionPanel({
  isAdminOnly = false,
  moduleKey,
  role,
  mode,
  onEdit,
  onCancelEdit,
  onSaveDraft,
  onSubmit,
  onRequestRisk,
  onRestore,
  isArchived = false,
}: DetailActionPanelProps) {
  const canEdit = isAdminOnly ? canUseRiskAction(role) : canEditDailyWork(role);
  const canRisk = canUseRiskAction(role);

  if (role === "viewer") {
    return null;
  }

  return (
    <aside className="detail-actions">
      <div>
        <h3>操作確認</h3>
        <p>目前角色：{permissionLabel(role)}</p>
      </div>

      {mode === "edit" ? (
        <>
          <button type="button" onClick={onSaveDraft}>
            儲存草稿
          </button>
          <button type="button" onClick={onSubmit}>
            {primaryActionLabel(moduleKey)}
          </button>
          <button type="button" className="secondary-action" onClick={onCancelEdit}>
            取消編輯
          </button>
        </>
      ) : (
        <>
          <button type="button" disabled={!canEdit} onClick={onEdit}>
            編輯資料
          </button>
          <button type="button" disabled={!canEdit} onClick={onSaveDraft}>
            儲存草稿
          </button>
          <button type="button" disabled={!canEdit} onClick={onSubmit}>
            {primaryActionLabel(moduleKey)}
          </button>
        </>
      )}

      {isArchived && canRisk ? (
        <button type="button" className="secondary-action" onClick={onRestore}>
          還原資料
        </button>
      ) : canRisk ? (
        <button type="button" className="danger" onClick={onRequestRisk}>
          停用 / 封存
        </button>
      ) : (
        <button type="button" className="secondary-action" onClick={onRequestRisk}>
          停用 / 封存需管理者確認
        </button>
      )}

      <div className="confirm-note">
        {canRisk ? "送出前請先確認資料是否正確。停用或封存後，資料仍保留於紀錄中。" : "可查看，部分操作需管理者確認。"}
      </div>
    </aside>
  );
}
