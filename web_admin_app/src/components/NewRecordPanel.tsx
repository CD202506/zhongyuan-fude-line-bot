import { useMemo, useState } from "react";
import type { EditField } from "../data/mockRecords";
import type { ModuleConfig } from "../data/modules";
import type { UserRole } from "../data/mockUser";
import { adminConfirmModules, newRecordFields } from "../data/newRecordFields";
import { ConfirmDialog } from "./ConfirmDialog";

type FormValues = Record<string, string | string[]>;
type NewRecordState = "editing" | "draft" | "submitted";
type PendingAction = "draft" | "submit" | null;

type NewRecordPanelProps = {
  moduleItem: ModuleConfig;
  role: UserRole;
  onCancel: () => void;
  onComplete: () => void;
  onSubmitRecord?: (values: FormValues) => Promise<unknown> | unknown;
};

export function NewRecordPanel({ moduleItem, role, onCancel, onComplete, onSubmitRecord }: NewRecordPanelProps) {
  const fields = newRecordFields[moduleItem.key];
  const initialValues = useMemo(() => {
    return fields.reduce<FormValues>((values, field) => {
      values[field.key] = field.value;
      return values;
    }, {});
  }, [fields]);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [state, setState] = useState<NewRecordState>("editing");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const needsAdminConfirm = role !== "admin" && adminConfirmModules.includes(moduleItem.key);

  const updateField = (key: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toggleTag = (field: Extract<EditField, { type: "tags" }>, option: string) => {
    const currentValue = values[field.key] ?? field.value;
    const selected = Array.isArray(currentValue) ? currentValue : [];
    const nextValue = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    updateField(field.key, nextValue);
  };

  const renderField = (field: EditField) => {
    const value = values[field.key] ?? field.value;

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          <textarea value={String(value)} onChange={(event) => updateField(field.key, event.target.value)} placeholder="請輸入備註" />
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
          placeholder={field.type === "number" ? "請輸入金額" : "請輸入名稱"}
        />
      </label>
    );
  };

  const entries = fields
    .map((field) => {
      const value = values[field.key];
      if (!value || (Array.isArray(value) && value.length === 0)) return null;

      return { label: field.label, value: Array.isArray(value) ? value.join("、") : value };
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));

  const confirmAction = async () => {
    setErrorMessage("");
    const action = pendingAction;

    if (action === "draft") {
      setState("draft");
      setPendingAction(null);
      return;
    }

    if (action === "submit") {
      setPendingAction(null);
      setIsSubmitting(true);
      try {
        await onSubmitRecord?.(values);
        setState("submitted");
        onComplete();
      } catch (error) {
        console.error("create record failed", error instanceof Error ? error.message : "unknown error");
        setErrorMessage("資料送出失敗，請稍後再試。");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const confirmContent = pendingAction === "draft"
    ? {
        title: "確認儲存草稿",
        body: "草稿會保留目前填寫內容，之後仍可再確認與送出。",
        tone: "default" as const,
      }
    : {
        title: needsAdminConfirm ? "需要管理者確認" : "確認送出",
        body: needsAdminConfirm ? "此操作送出後，需由管理者確認才會生效。" : "送出前請再次確認資料內容是否正確。",
        tone: needsAdminConfirm ? "warning" as const : "default" as const,
      };

  return (
    <section className="new-record-panel">
      <div className="section-heading">
        <div>
          <h3>{moduleItem.addLabel}</h3>
          <span>填寫基本資料後，可先儲存草稿或送出確認。</span>
        </div>
      </div>

      {state === "draft" ? (
        <div className="process-panel success">
          <strong>草稿已暫存</strong>
          <span>草稿已暫存，送出前請再次確認。</span>
        </div>
      ) : null}
      {state === "submitted" ? (
        <div className={`process-panel ${needsAdminConfirm ? "warning" : "success"}`}>
          <strong>已送出確認流程</strong>
          <span>{needsAdminConfirm ? "已送出確認流程，需管理者確認後才會生效。" : "已送出確認流程，請等待負責人確認。"}</span>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="process-panel warning">
          <strong>送出未完成</strong>
          <span>{errorMessage}</span>
        </div>
      ) : null}
      {isSubmitting ? (
        <div className="process-panel active">
          <strong>資料送出中</strong>
          <span>請稍候，完成後會返回列表。</span>
        </div>
      ) : null}

      <div className="edit-form-grid">
        {fields.map((field) => renderField(field))}
      </div>

      {entries.length > 0 ? (
        <div className="draft-summary">
          <strong>{state === "submitted" ? "本次送出內容" : "目前填寫內容"}</strong>
          <div>
            {entries.slice(0, 6).map((entry) => (
              <span key={entry.label}>
                <b>{entry.label}</b>{entry.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="form-actions">
        <button type="button" disabled={isSubmitting} onClick={() => setPendingAction("draft")}>
          儲存草稿
        </button>
        <button type="button" disabled={isSubmitting} onClick={() => setPendingAction("submit")}>
          {isSubmitting ? "送出中" : "送出確認"}
        </button>
        <button type="button" className="secondary-action" onClick={onCancel}>
          取消新增
        </button>
      </div>
      {pendingAction ? (
        <ConfirmDialog
          title={confirmContent.title}
          body={confirmContent.body}
          tone={confirmContent.tone}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          isConfirming={isSubmitting}
        />
      ) : null}
    </section>
  );
}
