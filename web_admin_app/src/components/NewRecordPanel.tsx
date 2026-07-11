import { useMemo, useState } from "react";
import type { EditField } from "../data/mockRecords";
import type { ModuleConfig } from "../data/modules";
import type { UserRole } from "../data/mockUser";
import { ApiRequestError } from "../api/webAdminApi";
import { activeCustomFieldsForModule } from "../data/adminSettings";
import { adminConfirmModules, newRecordFields } from "../data/newRecordFields";
import { ConfirmDialog } from "./ConfirmDialog";
import { formatDisplayDate, formatRocDateInputValue, rocDateInputHint } from "../lib/dateFormat";
import {
  customFieldToEditField,
  devoteeRelatedRecordExamples,
  fieldOptionLabel,
  fieldOptionValue,
  shrineRelatedRecordLabel,
  shrineContactExamples,
  shrineRelatedRecordExamples,
  type DevoteeRelatedRecord,
  type ShrineContact,
  type ShrineRelatedRecord,
} from "../lib/domainModel";

type FormValues = Record<string, string | string[] | DevoteeRelatedRecord[] | ShrineContact[] | ShrineRelatedRecord[]>;
type NewRecordState = "editing" | "draft" | "submitted";
type PendingAction = "draft" | "submit" | null;

type NewRecordPanelProps = {
  moduleItem: ModuleConfig;
  role: UserRole;
  onCancel: () => void;
  onComplete: () => void;
  onSubmitRecord?: (values: FormValues) => Promise<unknown> | unknown;
};

function submitErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 422) return "資料格式未通過，請確認必填資料。";
    if (error.status >= 500) return "資料服務暫時無法處理，請稍後再試。";
    return "資料服務回應失敗，請稍後再試。";
  }

  if (error instanceof TypeError) {
    return "資料服務無法連線，或請求被瀏覽器阻擋。";
  }

  return "資料送出失敗，請稍後再試。";
}

export function NewRecordPanel({ moduleItem, role, onCancel, onComplete, onSubmitRecord }: NewRecordPanelProps) {
  const fields = useMemo(() => {
    const configuredFields = activeCustomFieldsForModule(moduleItem.key, "create")
      .filter((field) => field.editableRoles.includes(role))
      .map(customFieldToEditField);
    return [...newRecordFields[moduleItem.key], ...configuredFields];
  }, [moduleItem.key, role]);
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
  const [devoteeRelatedRecords, setDevoteeRelatedRecords] = useState<DevoteeRelatedRecord[]>([]);
  const [shrineContacts, setShrineContacts] = useState<ShrineContact[]>([]);
  const [shrineRelatedRecords, setShrineRelatedRecords] = useState<ShrineRelatedRecord[]>([]);
  const needsAdminConfirm = role !== "admin" && adminConfirmModules.includes(moduleItem.key);

  const updateField = (key: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toggleTag = (field: Extract<EditField, { type: "tags" }>, option: string) => {
    const currentValue = values[field.key] ?? field.value;
    const selected = Array.isArray(currentValue) ? currentValue.filter((item): item is string => typeof item === "string") : [];
    const nextValue = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    updateField(field.key, nextValue);
    if (moduleItem.key === "shrines" && field.key === "deities") {
      const currentPrimary = String(values.primaryDeity ?? "");
      const nextPrimary = nextValue.includes(currentPrimary) ? currentPrimary : nextValue[0] ?? "";
      updateField("primaryDeity", nextPrimary);
    }
  };

  const displayValueForField = (field: EditField, value: string | string[]) => {
    if (field.type !== "select" && field.type !== "tags") return Array.isArray(value) ? value.join("、") : formatDisplayDate(value);
    const labels = field.options.reduce<Record<string, string>>((map, option) => {
      map[fieldOptionValue(option)] = fieldOptionLabel(option);
      return map;
    }, {});
    if (Array.isArray(value)) return value.map((item) => labels[item] ?? "未命名相關紀錄").join("、");
    return labels[value] ?? value;
  };

  const renderField = (field: EditField) => {
    const value = values[field.key] ?? field.value;
    const textPlaceholder = field.key === "birthMonthDay" ? "月/日" : field.label.includes("電話") ? "請輸入電話" : "請輸入內容";
    const effectiveOptions = moduleItem.key === "shrines" && field.key === "primaryDeity"
      ? (Array.isArray(values.deities) && values.deities.every((item) => typeof item === "string") ? values.deities : field.value ? [String(field.value)] : [])
      : field.type === "select" || field.type === "tags"
        ? field.options
        : [];

    if (field.type === "textarea") {
      const textareaPlaceholder = field.key === "internalSummary"
        ? "僅填寫舊紙本、舊系統或尚無法拆分為結構化紀錄的歷史資料"
        : field.key === "note"
          ? "填寫目前需注意的聯繫方式、稱呼或其他日常補充事項"
          : "請輸入內容";
      if (field.key === "internalSummary") {
        return (
          <details key={field.key} className="edit-field wide collapsible-field">
            <summary>{field.label}（非日常使用）</summary>
            <label>
              {field.help ? <small>{field.help}</small> : null}
              <textarea value={String(value)} onChange={(event) => updateField(field.key, event.target.value)} placeholder={textareaPlaceholder} />
            </label>
          </details>
        );
      }
      return (
        <label key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <textarea value={String(value)} onChange={(event) => updateField(field.key, event.target.value)} placeholder={textareaPlaceholder} />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="edit-field">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <select value={String(value)} onChange={(event) => updateField(field.key, event.target.value)}>
            {effectiveOptions.map((option) => (
              <option key={fieldOptionValue(option)} value={fieldOptionValue(option)}>
                {fieldOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "tags") {
      const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

      return (
        <div key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <div className="tag-toggle-group">
            {effectiveOptions.map((option) => (
              <button
                key={fieldOptionValue(option)}
                type="button"
                className={selected.includes(fieldOptionValue(option)) ? "selected" : ""}
                onClick={() => toggleTag(field, fieldOptionValue(option))}
              >
                {fieldOptionLabel(option)}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "date") {
      return (
        <label key={field.key} className="edit-field">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <input
            type="text"
            aria-label={`${field.label}，${rocDateInputHint}`}
            value={formatRocDateInputValue(String(value))}
            onChange={(event) => updateField(field.key, event.target.value)}
            placeholder="年/月/日"
          />
          <small>{rocDateInputHint}；目前顯示：{formatDisplayDate(String(value))}</small>
        </label>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="edit-field checkbox-field">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <input
            type="checkbox"
            checked={String(value) === "是"}
            onChange={(event) => updateField(field.key, event.target.checked ? "是" : "否")}
          />
        </label>
      );
    }

    return (
      <label key={field.key} className="edit-field">
        <span>{field.label}</span>
        {field.help ? <small>{field.help}</small> : null}
        <input
          type={field.type}
          value={String(value)}
          onChange={(event) => updateField(field.key, event.target.value)}
          placeholder={field.type === "number" ? "請輸入數字" : textPlaceholder}
        />
      </label>
    );
  };

  const entries = fields
    .map((field) => {
      const value = values[field.key];
      if (!value || (Array.isArray(value) && value.length === 0)) return null;
      if (Array.isArray(value) && value.some((item) => typeof item !== "string")) return null;
      const entryValue: string | string[] = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : String(value);

      return { label: field.label, value: displayValueForField(field, entryValue) };
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
        const payloadValues = moduleItem.key === "devotees"
          ? { ...values, relatedRecords: devoteeRelatedRecords }
          : moduleItem.key === "shrines"
            ? { ...values, shrineContacts, shrineRelatedRecords }
            : values;
        await onSubmitRecord?.(payloadValues);
        setState("submitted");
        onComplete();
      } catch (error) {
        console.error("create record failed", {
          name: error instanceof Error ? error.name : "unknown",
          message: error instanceof Error ? error.message : "unknown error",
          status: error instanceof ApiRequestError ? error.status : undefined,
          response: error instanceof ApiRequestError ? error.responseText : undefined,
        });
        setErrorMessage(submitErrorMessage(error));
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

      {moduleItem.key === "devotees" ? (
        <div className="related-record-editor">
          <div className="section-heading compact-heading">
            <div>
              <h4>善信相關紀錄</h4>
              <span>目前尚無相關紀錄時，可先只建立善信基本資料。</span>
            </div>
            <button
              type="button"
              className="secondary-inline-action"
              onClick={() => {
                const nextRecord = devoteeRelatedRecordExamples[devoteeRelatedRecords.length % devoteeRelatedRecordExamples.length];
                setDevoteeRelatedRecords((current) => [...current, { ...nextRecord, id: `${nextRecord.id}-${current.length + 1}` }]);
              }}
            >
              新增相關紀錄
            </button>
          </div>
          {devoteeRelatedRecords.length > 0 ? (
            <div className="related-record-table">
              {devoteeRelatedRecords.map((item) => (
                <article key={item.id}>
                  <strong>{item.category}｜{item.type}</strong>
                  <span>{formatDisplayDate(item.date)}｜{item.action}｜{item.item} {item.quantity}{item.unit}</span>
                  <span>{item.amount ? `金額 ${item.amount} 元｜` : ""}{item.status}｜對應：{item.relatedModule}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-inline-state">目前尚無相關紀錄，可先只建立善信基本資料。</div>
          )}
        </div>
      ) : null}

      {moduleItem.key === "shrines" ? (
        <div className="related-record-editor">
          <div className="section-heading compact-heading">
            <div>
              <h4>友宮聯絡人</h4>
              <span>聯絡人可新增多位；主要聯絡人由清單中指定，不另外填自由文字欄位。</span>
            </div>
            <button
              type="button"
              className="secondary-inline-action"
              onClick={() => {
                const nextContact = shrineContactExamples[shrineContacts.length % shrineContactExamples.length];
                setShrineContacts((current) => {
                  const nextId = `${nextContact.contactId}-${current.length + 1}`;
                  return [...current, { ...nextContact, contactId: nextId, isPrimary: current.length === 0 }];
                });
              }}
            >
              新增聯絡人
            </button>
          </div>
          {shrineContacts.length > 0 ? (
            <div className="related-record-table">
              {shrineContacts.map((contact) => (
                <article key={contact.contactId}>
                  <strong>{contact.name}｜{contact.title}{contact.isPrimary ? "｜主要聯絡人" : ""}</strong>
                  <span>{contact.contactStatus}｜{contact.isActive ? "使用中" : "已封存"}</span>
                  <span>{contact.methods.map((method) => `${method.type}${method.isPrimary ? "（主要）" : ""}：${method.value}`).join("、")}</span>
                  <div className="inline-action-row">
                    <button
                      type="button"
                      className="secondary-inline-action"
                      onClick={() => setShrineContacts((current) => current.map((item) => ({ ...item, isPrimary: item.contactId === contact.contactId })))}
                    >
                      設為主要聯絡人
                    </button>
                    <button
                      type="button"
                      className="secondary-inline-action"
                      onClick={() => setShrineContacts((current) => current.map((item) => item.contactId === contact.contactId ? { ...item, isActive: !item.isActive, contactStatus: item.isActive ? "已封存" : "可聯繫" } : item))}
                    >
                      {contact.isActive ? "封存聯絡人" : "還原聯絡人"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-inline-state">目前尚無聯絡人，可先只建立友宮基本資料。</div>
          )}
          <div className="section-heading compact-heading">
            <div>
              <h4>友宮相關紀錄</h4>
              <span>來訪、請帖、活動與公文需指向實際紀錄，不使用自由文字假關聯。</span>
            </div>
            <button
              type="button"
              className="secondary-inline-action"
              onClick={() => {
                const nextRecord = shrineRelatedRecordExamples[shrineRelatedRecords.length % shrineRelatedRecordExamples.length];
                setShrineRelatedRecords((current) => [...current, { ...nextRecord, id: `${nextRecord.id}-${current.length + 1}` }]);
              }}
            >
              新增相關紀錄
            </button>
          </div>
          {shrineRelatedRecords.length > 0 ? (
            <div className="related-record-table">
              {shrineRelatedRecords.map((record) => (
                <article key={record.id}>
                  <strong>{shrineRelatedRecordLabel(record)}</strong>
                  <span>{formatDisplayDate(record.date)}｜{record.status}｜對應：{record.module}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-inline-state">目前尚無來訪、請帖、活動或公文關聯。</div>
          )}
        </div>
      ) : null}

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
