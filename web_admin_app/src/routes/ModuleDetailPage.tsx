import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { modules } from "../data/modules";
import { EditField, type MockRecord } from "../data/mockRecords";
import { DetailActionMode, DetailActionPanel } from "../components/DetailActionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiConnectionErrorMessage, archiveRecord, getRecord, restoreRecord, updateRecord } from "../services/recordService";
import { fieldPolicyFor } from "../lib/domainModel";
import { formatDisplayDate, formatRocDateInputValue, rocDateInputHint } from "../lib/dateFormat";

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
  const [activeRelatedRecord, setActiveRelatedRecord] = useState<string | null>(null);
  const [relatedActionMessage, setRelatedActionMessage] = useState("");
  const moduleItem = record ? modules.find((item) => item.key === record.moduleKey) : undefined;
  const fieldPolicy = record ? fieldPolicyFor(record.moduleKey) : undefined;
  const isEditing = actionMode === "edit";
  const visibleEditFields = useMemo(() => {
    if (!record) return [];
    return record.editFields.filter((field) => role === "admin" || field.key !== "dataStatus");
  }, [record, role]);
  const relatedRecordItems = useMemo(() => {
    if (record?.relatedRecords && record.relatedRecords.length > 0) return record.relatedRecords.map((item) => item.id);
    if (record?.shrineRelatedRecords && record.shrineRelatedRecords.length > 0) return record.shrineRelatedRecords.map((item) => item.id);
    if (!record?.relation) return [];
    return record.relation.split("、").map((item) => item.trim()).filter(Boolean);
  }, [record?.relation, record?.relatedRecords, record?.shrineRelatedRecords]);
  const relatedRecordDetail = useMemo(() => {
    if (!activeRelatedRecord || !record) return null;
    const detailedRecord = record.relatedRecords?.find((item) => item.id === activeRelatedRecord);
    if (detailedRecord) {
      const financeRelated = detailedRecord.category === "財務往來";
      const materialRelated = detailedRecord.category === "物資往來";
      return {
        type: `${detailedRecord.category}｜${detailedRecord.type}`,
        date: formatDisplayDate(detailedRecord.date),
        state: detailedRecord.status,
        module: detailedRecord.relatedModule,
        action: financeRelated ? "查看帳務紀錄" : materialRelated ? "查看物資紀錄" : "查看相關紀錄",
        item: `${detailedRecord.action}｜${detailedRecord.item} ${detailedRecord.quantity}${detailedRecord.unit}`,
        amount: detailedRecord.amount ? `${detailedRecord.amount} 元` : "",
        note: detailedRecord.differenceHandling || detailedRecord.note,
      };
    }
    const shrineRecord = record.shrineRelatedRecords?.find((item) => item.id === activeRelatedRecord);
    if (shrineRecord) {
      return {
        type: `${shrineRecord.recordType}｜${shrineRecord.title}`,
        date: formatDisplayDate(shrineRecord.date),
        state: shrineRecord.status,
        module: shrineRecord.module,
        action: `查看${shrineRecord.recordType}紀錄`,
        item: `紀錄代碼：${shrineRecord.recordId}`,
        amount: "",
        note: "",
      };
    }
    const financeRelated = ["發財金", "平安龜", "香油錢", "捐款", "金牌", "帳務", "待返還", "已返還"].some((keyword) => activeRelatedRecord.includes(keyword));
    if (financeRelated) {
      return {
        type: activeRelatedRecord.replace(/：.*$/, ""),
        date: record.dateLabel,
        state: activeRelatedRecord.includes("帳務") ? "待核對" : "待確認",
        module: "帳務管理",
        action: "查看帳務紀錄",
      };
    }

    if (activeRelatedRecord.includes("活動")) {
      return { type: "活動參與", date: record.dateLabel, state: "待確認", module: "活動消息", action: "查看活動紀錄" };
    }

    if (activeRelatedRecord.includes("物資") || activeRelatedRecord.includes("供品")) {
      return { type: "物資往來", date: record.dateLabel, state: "已記錄", module: moduleItem?.title ?? "善信管理", action: "查看物資紀錄" };
    }

    if (activeRelatedRecord.includes("服務")) {
      return { type: "服務紀錄", date: record.dateLabel, state: "待確認", module: "善信管理", action: "查看服務紀錄" };
    }

    if (activeRelatedRecord.includes("採購")) {
      return { type: "採購紀錄", date: record.dateLabel, state: "待對帳", module: "採購管理", action: "查看採購紀錄" };
    }

    return { type: activeRelatedRecord.replace(/：.*$/, ""), date: record.dateLabel, state: "待確認", module: moduleItem?.title ?? "相關模組", action: "查看相關紀錄" };
  }, [activeRelatedRecord, moduleItem?.title, record]);

  const relatedButtonLabel = (item: string) => {
    const detailedRecord = record?.relatedRecords?.find((recordItem) => recordItem.id === item);
    const shrineRecord = record?.shrineRelatedRecords?.find((recordItem) => recordItem.id === item);
    if (shrineRecord) return `${shrineRecord.recordType}｜${shrineRecord.title}`;
    return detailedRecord ? `${detailedRecord.category}｜${detailedRecord.type}` : item;
  };

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
        setActiveRelatedRecord(null);
        setRelatedActionMessage("");
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
        title: "作廢 / 封存確認",
        body: "這是重要操作。若為輸錯或暫存資料，可作廢或封存後不列入日常使用。",
        tone: "warning",
      },
      riskSubmitted: {
        title: "已送出作廢 / 封存確認",
        body: "已送出作廢 / 封存確認，資料仍保留於紀錄中。",
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
                ? "資料已送出作廢 / 封存確認，列表已重新整理。"
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
      title: "確認作廢 / 封存",
      body: "作廢或封存後，資料仍會保留在紀錄中，日常列表將不再優先顯示。",
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
    const textPlaceholder = field.key === "birthMonthDay" ? "月/日" : field.label.includes("電話") ? "請輸入電話" : "請輸入內容";

    if (readonly) {
      return (
        <label key={field.key} className="edit-field readonly">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <strong>{Array.isArray(value) ? value.join("、") : value}</strong>
          <em>需管理者調整</em>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="edit-field wide">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <textarea value={String(value)} onChange={(event) => updateField(field.key, event.target.value)} />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="edit-field">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
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
          {field.help ? <small>{field.help}</small> : null}
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

  const draftEntries = record?.editFields
    .map((field) => {
      const value = editValues[field.key];
      if (!value) return null;

      return { label: field.label, value: Array.isArray(value) ? value.join("、") : formatDisplayDate(String(value)) };
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
          <h2>{record.title}</h2>
          <StatusBadge status={record.status} />
        </div>
      </section>

      <section className={`detail-layout ${role === "viewer" ? "viewer-layout" : ""}`}>
        <article className={`content-panel ${isEditing ? "editing-panel" : ""}`}>
          {role === "viewer" ? (
            <div className="permission-strip">
              <strong>本人資料確認</strong>
              <span>目前可查詢本人資料與本人相關紀錄；如需修改請洽廟方人員。</span>
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
              {visibleEditFields.map((field) => renderEditField(field))}
            </div>
          ) : (
            <div className="info-grid">
              <div><span>{fieldPolicy?.dateLabel ?? "日期"}</span><strong>{record.dateLabel}</strong></div>
              {fieldPolicy?.showAssignee ? <div><span>{fieldPolicy.ownerLabel}</span><strong>{record.owner}</strong></div> : null}
              <div><span>作業分類</span><strong>{moduleItem.boundary}</strong></div>
              {record.detailFields.map((field) => (
                <div key={`${field.label}-${field.value}`}><span>{field.label}</span><strong>{field.value}</strong></div>
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
          {!isEditing && record.moduleKey === "shrines" ? (
            <div className="note-panel">
              <strong>友宮聯絡人</strong>
              {record.shrineContacts && record.shrineContacts.length > 0 ? (
                <div className="related-record-table">
                  {record.shrineContacts.map((contact) => (
                    <article key={contact.contactId}>
                      <strong>{contact.name}｜{contact.title}{contact.isPrimary ? "｜主要聯絡人" : ""}</strong>
                      <span>{contact.contactStatus}｜{contact.isActive ? "使用中" : "已封存"}</span>
                      <span>{contact.methods.map((method) => `${method.type}${method.isPrimary ? "（主要）" : ""}：${method.value}`).join("、")}</span>
                      {contact.note ? <span>{contact.note}</span> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-inline-state">目前尚無聯絡人。</div>
              )}
            </div>
          ) : null}
          {!isEditing && record.moduleKey === "shrines" ? (
            <div className="note-panel">
              <strong>供奉神祇</strong>
              {record.shrineDeities && record.shrineDeities.length > 0 ? (
                <div className="related-record-table">
                  {record.shrineDeities.map((deity) => (
                    <article key={deity.id}>
                      <strong>{deity.name}</strong>
                      <span>{deity.role}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-inline-state">目前尚無供奉神祇紀錄。</div>
              )}
            </div>
          ) : null}
          {!isEditing && relatedRecordItems.length > 0 ? (
            <div className="note-panel">
              <strong>相關紀錄</strong>
              <div className="related-record-actions">
                {relatedRecordItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setActiveRelatedRecord(item);
                      setRelatedActionMessage("");
                    }}
                  >
                    查詢{relatedButtonLabel(item)}
                  </button>
                ))}
              </div>
              {activeRelatedRecord && relatedRecordDetail ? (
                <div className="related-result-panel">
                  <strong>{relatedRecordDetail.type}</strong>
                  <p>已開啟相關紀錄查詢，正式串接後會帶入對應模組與篩選條件。</p>
                  <dl>
                    <div><dt>日期</dt><dd>{relatedRecordDetail.date}</dd></div>
                    <div><dt>狀態</dt><dd>{relatedRecordDetail.state}</dd></div>
                    <div><dt>對應模組</dt><dd>{relatedRecordDetail.module}</dd></div>
                    {relatedRecordDetail.item ? <div><dt>品項</dt><dd>{relatedRecordDetail.item}</dd></div> : null}
                    {relatedRecordDetail.amount ? <div><dt>金額</dt><dd>{relatedRecordDetail.amount}</dd></div> : null}
                    {relatedRecordDetail.note ? <div><dt>備註</dt><dd>{relatedRecordDetail.note}</dd></div> : null}
                  </dl>
                  <button type="button" className="secondary-inline-action" onClick={() => setRelatedActionMessage(`已準備前往${relatedRecordDetail.module}查詢 ${relatedRecordDetail.type}。`)}>
                    {relatedRecordDetail.action}
                  </button>
                  {relatedActionMessage ? <span>{relatedActionMessage}</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {!isEditing && record.moduleKey === "shrines" && relatedRecordItems.length === 0 ? (
            <div className="note-panel">
              <strong>相關紀錄</strong>
              <div className="empty-inline-state">目前尚無來訪、請帖、活動或公文關聯。</div>
            </div>
          ) : null}
          {!isEditing && record.note ? (
            <div className="note-panel">
              <strong>備註</strong>
              <p>{record.note}</p>
            </div>
          ) : null}
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
