import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { modules } from "../data/modules";
import { EditField, type MockRecord } from "../data/mockRecords";
import { DetailActionMode, DetailActionPanel } from "../components/DetailActionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiConnectionErrorMessage, archiveRecord, getRecord, restoreRecord, updateRecord } from "../services/recordService";

type EditValues = Record<string, string | string[]>;
type PendingAction = "draft" | "submit" | "risk" | "restore" | "staffRisk" | null;

export function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [actionMode, setActionMode] = useState<DetailActionMode>("view");
  const [editValues, setEditValues] = useState<EditValues>({});
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [record, setRecord] = useState<MockRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const moduleItem = record ? modules.find((item) => item.key === record.moduleKey) : undefined;
  const isEditing = actionMode === "edit";

  useEffect(() => {
    let active = true;

    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadErrorMessage("");
    setActionErrorMessage("");
    getRecord(id)
      .then((nextRecord) => {
        if (!active) return;
        setRecord(nextRecord);
      })
      .catch(() => {
        if (!active) return;
        setRecord(undefined);
        setLoadErrorMessage(apiConnectionErrorMessage);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const initialEditValues = useMemo(() => {
    if (!record) return {};

    return record.editFields.reduce<EditValues>((values, field) => {
      values[field.key] = field.value;
      return values;
    }, {});
  }, [record]);
  const feedback = useMemo(() => {
    const messages: Partial<Record<DetailActionMode, { title: string; body: string; tone: string }>> = {
      edit: {
        title: "編輯中",
        body: "已進入資料編輯流程，送出前請再次確認內容。",
        tone: "active",
      },
      draft: {
        title: "草稿已暫存",
        body: "草稿已暫存於目前畫面，正式送出前請再次確認。",
        tone: "success",
      },
      submitted: {
        title: "已送出確認",
        body: "已送出確認流程，請等待管理者或負責人確認。",
        tone: "success",
      },
      riskPending: {
        title: "停用 / 封存確認",
        body: "這是重要操作，請先確認是否仍需保留紀錄。",
        tone: "warning",
      },
      riskSubmitted: {
        title: "已送出停用 / 封存確認",
        body: "已送出停用 / 封存確認，請等待管理者處理。",
        tone: "warning",
      },
      staffRisk: {
        title: "已建立管理者確認事項",
        body: "此操作需管理者確認後才會生效。",
        tone: "warning",
      },
    };

    return messages[actionMode];
  }, [actionMode]);

  const startEdit = () => {
    setEditValues(initialEditValues);
    setActionErrorMessage("");
    setActionMode("edit");
  };

  const cancelEdit = () => {
    setEditValues(initialEditValues);
    setActionMode("view");
    if (moduleItem) {
      navigate(moduleItem.route);
    }
  };

  const completeAndReturn = async (nextMode: DetailActionMode) => {
    if (!record || !moduleItem) return;

    setIsSaving(true);
    setActionErrorMessage("");

    try {
      if ((nextMode === "draft" || nextMode === "submitted") && actionMode === "edit" && pendingAction !== "restore") {
        await updateRecord(record.id, record.moduleKey, editValues, role);
      }

      if (nextMode === "riskSubmitted" && role === "admin") {
        await archiveRecord(record.id, role);
      }

      if (pendingAction === "restore" && role === "admin") {
        await restoreRecord(record.id, role);
      }

      setActionMode(nextMode);
      setPendingAction(null);
      navigate(moduleItem.route, {
        state: {
          notice:
            nextMode === "draft"
              ? "草稿已暫存，列表已重新整理。"
              : nextMode === "riskSubmitted"
                ? "資料已送出停用 / 封存確認，列表已重新整理。"
                : "資料已送出確認，列表已重新整理。",
        },
      });
    } catch {
      setActionErrorMessage("資料更新失敗，請稍後再試。");
      setPendingAction(null);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmContent = useMemo(() => {
    if (pendingAction === "draft") {
      return {
        title: "確認儲存草稿",
        body: "草稿會保留目前填寫內容，之後仍可再確認與送出。",
        tone: "default" as const,
        onConfirm: () => completeAndReturn("draft"),
      };
    }

    if (pendingAction === "submit") {
      return {
        title: "確認送出",
        body: "送出前請再次確認資料內容是否正確。",
        tone: "default" as const,
        onConfirm: () => completeAndReturn("submitted"),
      };
    }

    if (pendingAction === "staffRisk") {
      return {
        title: "需要管理者確認",
        body: "此操作送出後，需由管理者確認才會生效。",
        tone: "warning" as const,
        onConfirm: () => completeAndReturn("staffRisk"),
      };
    }

    if (pendingAction === "restore") {
      return {
        title: "確認還原資料",
        body: "還原後，資料會重新回到日常列表中。",
        tone: "default" as const,
        onConfirm: () => completeAndReturn("submitted"),
      };
    }

    return {
      title: "確認停用 / 封存",
      body: "停用或封存後，資料仍會保留在紀錄中，日常列表將不再優先顯示。",
      tone: "warning" as const,
      onConfirm: () => completeAndReturn("riskSubmitted"),
    };
  }, [pendingAction, record, moduleItem, editValues, role]);

  const updateField = (key: string, value: string | string[]) => {
    setEditValues((current) => ({ ...current, [key]: value }));
  };

  const toggleTag = (field: Extract<EditField, { type: "tags" }>, option: string) => {
    const currentValue = editValues[field.key] ?? field.value;
    const selected = Array.isArray(currentValue) ? currentValue : [];
    const nextValue = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    updateField(field.key, nextValue);
  };

  const renderEditField = (field: EditField) => {
    const value = editValues[field.key] ?? field.value;
    const readonly = field.readonly || (field.key === "systemRole" && role !== "admin");

    if (readonly) {
      return (
        <label key={field.key} className="edit-field readonly">
          <span>{field.label}</span>
          <strong>{Array.isArray(value) ? value.join("、") : value}</strong>
          <em>需管理者調整</em>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          <textarea value={String(value)} onChange={(event) => updateField(field.key, event.target.value)} />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="edit-field">
          <span>{field.label}</span>
          <select value={String(value)} onChange={(event) => updateField(field.key, event.target.value)}>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "tags") {
      const selected = Array.isArray(value) ? value : [];

      return (
        <div key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          <div className="tag-toggle-group">
            {field.options.map((option) => (
              <button key={option} type="button" className={selected.includes(option) ? "selected" : ""} onClick={() => toggleTag(field, option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <label key={field.key} className="edit-field">
        <span>{field.label}</span>
        <input
          type={field.type}
          value={String(value)}
          onChange={(event) => updateField(field.key, event.target.value)}
        />
      </label>
    );
  };

  const draftEntries = record?.editFields
    .map((field) => {
      const value = editValues[field.key];
      if (!value) return null;

      return { label: field.label, value: Array.isArray(value) ? value.join("、") : value };
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));

  if (isLoading) {
    return (
      <section className="content-panel">
        <h2>資料載入中</h2>
        <p>請稍候。</p>
      </section>
    );
  }

  if (loadErrorMessage) {
    return (
      <section className="content-panel">
        <h2>資料暫時無法顯示</h2>
        <p>{loadErrorMessage}</p>
        <Link to="/dashboard" className="detail-link">返回主控台</Link>
      </section>
    );
  }

  if (!record || !moduleItem) {
    return (
      <section className="content-panel">
        <h2>找不到資料</h2>
        <p>請返回主控台重新選擇資料。</p>
        <Link to="/dashboard" className="detail-link">返回主控台</Link>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="content-panel detail-header">
        <div>
          <Link to={moduleItem.route} className="back-link">返回列表</Link>
          <span className="eyebrow">{moduleItem.title}</span>
          <h2>{record.title}</h2>
          <StatusBadge status={record.status} />
        </div>
      </section>

      <section className={`detail-layout ${role === "viewer" ? "viewer-layout" : ""}`}>
        <article className={`content-panel ${isEditing ? "editing-panel" : ""}`}>
          {role === "viewer" ? (
            <div className="permission-strip">
              <strong>查看模式</strong>
              <span>目前可瀏覽資料內容；如需修改請洽管理者或廟方人員。</span>
            </div>
          ) : null}
          {feedback ? (
            <div className={`process-panel ${feedback.tone}`}>
              <strong>{feedback.title}</strong>
              <span>{feedback.body}</span>
            </div>
          ) : null}
          {isSaving ? (
            <div className="process-panel active">
              <strong>處理中</strong>
              <span>請稍候。</span>
            </div>
          ) : null}
          {actionErrorMessage ? (
            <div className="process-panel warning">
              <strong>送出未完成</strong>
              <span>{actionErrorMessage}</span>
            </div>
          ) : null}
          <h3>資料摘要</h3>
          {isEditing ? (
            <div className="edit-form-grid">
              {record.editFields.map((field) => renderEditField(field))}
            </div>
          ) : (
            <div className="info-grid">
              <div><span>狀態</span><strong className={actionMode === "draft" ? "inline-state" : ""}>{actionMode === "draft" ? "草稿暫存" : record.status}</strong></div>
              <div><span>日期</span><strong>{record.dateLabel}</strong></div>
              <div><span>經手 / 負責</span><strong>{record.owner}</strong></div>
              <div><span>模組邊界</span><strong>{moduleItem.boundary}</strong></div>
              {record.detailFields.map((field) => (
                <div key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>
              ))}
            </div>
          )}
          {(actionMode === "draft" || actionMode === "submitted") && draftEntries && draftEntries.length > 0 ? (
            <div className="draft-summary">
              <strong>{actionMode === "draft" ? "目前草稿內容" : "本次送出內容"}</strong>
              <div>
                {draftEntries.slice(0, 6).map((entry) => (
                  <span key={entry.label}>
                    <b>{entry.label}</b>{entry.value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="note-panel">
            <strong>關聯資訊</strong>
            <p>{record.relation}</p>
          </div>
          <div className="note-panel">
            <strong>備註</strong>
            <p>{record.note}</p>
          </div>
        </article>
        {role !== "viewer" ? (
          <DetailActionPanel
            moduleKey={record.moduleKey}
            role={role}
            mode={actionMode}
            onEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveDraft={() => setPendingAction("draft")}
            onSubmit={() => setPendingAction("submit")}
            onRequestRisk={() => setPendingAction(role === "admin" ? "risk" : "staffRisk")}
            onRestore={() => setPendingAction("restore")}
            isArchived={record.statusCategory === "archived" || record.statusCategory === "disabled"}
          />
        ) : null}
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
