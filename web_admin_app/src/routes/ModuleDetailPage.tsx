import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { modules } from "../data/modules";
import { EditField, type MockRecord } from "../data/mockRecords";
import { masterDataCatalogs } from "../data/adminSettings";
import { DetailActionMode, DetailActionPanel } from "../components/DetailActionPanel";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../lib/roleContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiConnectionErrorMessage, archiveRecord, getRecord, restoreRecord, updateRecord } from "../services/recordService";
import { fieldOptionLabel, fieldOptionValue, fieldPolicyFor, shrineRelatedRecordLabel, shrineSystemSummary, type ShrineContact } from "../lib/domainModel";
import { formatDisplayDate, formatRocDateInputValue, rocDateInputHint } from "../lib/dateFormat";

type EditValues = Record<string, string | string[] | ShrineContact[]>;
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
  const [shrineContactDrafts, setShrineContactDrafts] = useState<ShrineContact[]>([]);
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
        type: shrineRelatedRecordLabel(shrineRecord),
        date: formatDisplayDate(shrineRecord.date),
        state: shrineRecord.status,
        module: shrineRecord.module,
        action: `查看${shrineRecord.recordType}紀錄`,
        item: `${formatDisplayDate(shrineRecord.date)}｜${shrineRecord.status}`,
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
    if (shrineRecord) return shrineRelatedRecordLabel(shrineRecord);
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
    setShrineContactDrafts(record?.shrineContacts ?? []);
    setActionErrorMessage("");
    setActionMode("edit");
  };

  const cancelEdit = () => {
    setEditValues(initialEditValues);
    setShrineContactDrafts(record?.shrineContacts ?? []);
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
        await updateRecord(record.id, record.moduleKey, record.moduleKey === "shrines" ? { ...editValues, shrineContacts: shrineContactDrafts } : editValues, role);
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

  const updateShrineContact = (contactId: string, updates: Partial<ShrineContact>) => {
    setShrineContactDrafts((current) => current.map((contact) => contact.contactId === contactId ? { ...contact, ...updates } : contact));
  };

  const setPrimaryShrineContact = (contactId: string) => {
    setShrineContactDrafts((current) => current.map((contact) => ({
      ...contact,
      isPrimary: contact.contactId === contactId && contact.isActive && contact.contactStatus !== "已封存",
    })));
  };

  const toggleShrineContactArchived = (contactId: string) => {
    setShrineContactDrafts((current) => current.map((contact) => {
      if (contact.contactId !== contactId) return contact;
      const nextActive = !contact.isActive;
      return {
        ...contact,
        isActive: nextActive,
        isPrimary: nextActive ? contact.isPrimary : false,
        contactStatus: nextActive ? "可聯繫" : "已封存",
        methods: contact.methods.map((method) => nextActive ? method : { ...method, isPrimary: false, isActive: false, status: "已封存" }),
      };
    }));
  };

  const updateShrineMethod = (contactId: string, methodId: string, updates: Record<string, string | boolean>) => {
    setShrineContactDrafts((current) => current.map((contact) => contact.contactId === contactId ? {
      ...contact,
      methods: contact.methods.map((method) => method.id === methodId ? { ...method, ...updates } : method),
    } : contact));
  };

  const setPrimaryShrineMethod = (contactId: string, methodId: string) => {
    setShrineContactDrafts((current) => current.map((contact) => contact.contactId === contactId ? {
      ...contact,
      methods: contact.methods.map((method) => ({ ...method, isPrimary: method.id === methodId })),
    } : contact));
  };

  const addShrineContact = () => {
    setShrineContactDrafts((current) => [
      ...current,
      {
        contactId: `new-shrine-contact-${current.length + 1}`,
        relatedShrineId: record?.id ?? "new-shrine",
        name: "新聯絡人",
        title: masterDataCatalogs.contactRoleTypes[0],
        isPrimary: current.every((contact) => !contact.isPrimary),
        isActive: true,
        contactStatus: "可聯繫",
        note: "",
        methods: [],
      },
    ]);
  };

  const addShrineMethod = (contactId: string) => {
    setShrineContactDrafts((current) => current.map((contact) => contact.contactId === contactId ? {
      ...contact,
      methods: [
        ...contact.methods,
        {
          id: `${contact.contactId}-method-${contact.methods.length + 1}`,
          methodId: `${contact.contactId}-method-${contact.methods.length + 1}`,
          contactId,
          type: masterDataCatalogs.contactTypes[0],
          value: "",
          isPrimary: contact.methods.length === 0,
          isActive: true,
          preferredTime: "",
          availableTime: "",
          note: "",
          status: "使用中",
        },
      ],
    } : contact));
  };

  const toggleTag = (field: Extract<EditField, { type: "tags" }>, option: string) => {
    const currentValue = editValues[field.key] ?? field.value;
    const selected = Array.isArray(currentValue) && currentValue.every((item) => typeof item === "string") ? currentValue : [];
    const nextValue = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    updateField(field.key, nextValue);
    if (record?.moduleKey === "shrines" && field.key === "deities") {
      const currentPrimary = String(editValues.primaryDeity ?? "");
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

  const renderEditField = (field: EditField) => {
    const value = editValues[field.key] ?? field.value;
    const readonly = field.readonly || (field.key === "systemRole" && role !== "admin");
    const textPlaceholder = field.key === "birthMonthDay" ? "月/日" : field.label.includes("電話") ? "請輸入電話" : "請輸入內容";
    const effectiveOptions = record?.moduleKey === "shrines" && field.key === "primaryDeity"
      ? (Array.isArray(editValues.deities) && editValues.deities.every((item) => typeof item === "string") ? editValues.deities : field.value ? [String(field.value)] : [])
      : field.type === "select" || field.type === "tags"
        ? field.options
        : [];

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
      const primaryDeityDisabled = record?.moduleKey === "shrines" && field.key === "primaryDeity" && effectiveOptions.length === 0;
      return (
        <label key={field.key} className="edit-field">
          <span>{field.label}</span>
          {field.help ? <small>{field.help}</small> : null}
          <select value={primaryDeityDisabled ? "" : String(value)} disabled={primaryDeityDisabled} onChange={(event) => updateField(field.key, event.target.value)}>
            {primaryDeityDisabled ? <option value="">請先選擇供奉神祇</option> : null}
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
      const selected = Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];

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

  const draftEntries = record?.editFields
    .map((field) => {
      const value = editValues[field.key];
      if (!value) return null;
      if (Array.isArray(value) && value.some((item) => typeof item !== "string")) return null;
      const displayValue: string | string[] = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : String(value);

      return { label: field.label, value: displayValueForField(field, displayValue) };
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
          {record.moduleKey === "shrines" ? (
            <div className="system-summary-strip">
              <strong>系統摘要（系統自動產生）</strong>
              <span>
                {shrineSystemSummary({
                  title: record.title,
                  area: record.detailFields.find((field) => field.label === "地區")?.value,
                  category: record.detailFields.find((field) => field.label === "友宮分類")?.value,
                  primaryDeity: record.detailFields.find((field) => field.label === "主祀神祇")?.value,
                  contacts: record.shrineContacts,
                  relatedRecords: record.shrineRelatedRecords,
                })}
              </span>
            </div>
          ) : null}
          {isEditing ? (
            <>
              <div className="edit-form-grid">
                {visibleEditFields.map((field) => renderEditField(field))}
              </div>
              {record.moduleKey === "shrines" ? (
                <div className="related-record-editor">
                  <div className="section-heading compact-heading">
                    <div>
                      <h4>友宮聯絡人</h4>
                      <span>可新增多位聯絡人，每位聯絡人可有多種聯絡方式。</span>
                    </div>
                    <button type="button" className="secondary-inline-action" onClick={addShrineContact}>新增聯絡人</button>
                  </div>
                  {shrineContactDrafts.length > 0 ? (
                    <div className="related-record-table">
                      {shrineContactDrafts.map((contact) => (
                        <article key={contact.contactId}>
                          <div className="contact-edit-grid">
                            <label>
                              姓名 / 稱呼
                              <input value={contact.name} onChange={(event) => updateShrineContact(contact.contactId, { name: event.target.value })} />
                            </label>
                            <label>
                              職稱 / 身分
                              <select value={contact.title} onChange={(event) => updateShrineContact(contact.contactId, { title: event.target.value })}>
                                {masterDataCatalogs.contactRoleTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                              </select>
                            </label>
                            <label>
                              聯絡人狀態
                              <select value={contact.contactStatus} onChange={(event) => updateShrineContact(contact.contactId, { contactStatus: event.target.value, isActive: event.target.value !== "已封存" })}>
                                {masterDataCatalogs.contactStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                              </select>
                            </label>
                            <label className="wide">
                              備註
                              <input value={contact.note} onChange={(event) => updateShrineContact(contact.contactId, { note: event.target.value })} placeholder="聯絡補充說明" />
                            </label>
                          </div>
                          <strong>{contact.isPrimary ? "主要聯絡人" : "一般聯絡人"}｜{contact.isActive ? "使用中" : "聯絡人已封存"}</strong>
                          <div className="related-record-table nested-methods">
                            {contact.methods.map((method) => (
                              <article key={method.id}>
                                <div className="contact-edit-grid">
                                  <label>
                                    聯絡方式類型
                                    <select value={method.type} onChange={(event) => updateShrineMethod(contact.contactId, method.id, { type: event.target.value })}>
                                      {masterDataCatalogs.contactTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                  </label>
                                  <label>
                                    聯絡內容
                                    <input value={method.value} onChange={(event) => updateShrineMethod(contact.contactId, method.id, { value: event.target.value })} placeholder="請輸入聯絡內容" />
                                  </label>
                                  <label>
                                    適合聯絡時間
                                    <input value={method.availableTime ?? method.preferredTime ?? ""} onChange={(event) => updateShrineMethod(contact.contactId, method.id, { availableTime: event.target.value, preferredTime: event.target.value })} placeholder="例如白天、活動期間" />
                                  </label>
                                  <label>
                                    聯絡方式備註
                                    <input value={method.note ?? ""} onChange={(event) => updateShrineMethod(contact.contactId, method.id, { note: event.target.value })} placeholder="補充說明" />
                                  </label>
                                </div>
                                <div className="inline-action-row">
                                  <button type="button" className="secondary-inline-action" onClick={() => setPrimaryShrineMethod(contact.contactId, method.id)}>設為主要聯絡方式</button>
                                  <span>{method.isPrimary ? "主要方式" : "一般方式"}</span>
                                </div>
                              </article>
                            ))}
                          </div>
                          <div className="inline-action-row">
                            <button type="button" className="secondary-inline-action" disabled={!contact.isActive || contact.contactStatus === "已封存"} onClick={() => setPrimaryShrineContact(contact.contactId)}>
                              設為主要聯絡人
                            </button>
                            <button type="button" className="secondary-inline-action" onClick={() => addShrineMethod(contact.contactId)}>
                              新增聯絡方式
                            </button>
                            <button type="button" className="secondary-inline-action" onClick={() => toggleShrineContactArchived(contact.contactId)}>
                              {contact.isActive ? "封存聯絡人" : "還原聯絡人"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-inline-state">目前尚無聯絡人。</div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="info-grid">
              <div><span>{fieldPolicy?.dateLabel ?? "日期"}</span><strong>{record.dateLabel}</strong></div>
              {fieldPolicy?.showAssignee ? <div><span>{fieldPolicy.ownerLabel}</span><strong>{record.owner}</strong></div> : null}
              <div><span>作業分類</span><strong>{moduleItem.boundary}</strong></div>
              {record.detailFields
                .filter((field) => record.moduleKey !== "shrines" || !["主祀神祇", "供奉神祇"].includes(field.label))
                .map((field) => (
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
                <>
                  <div className="info-grid compact-info-grid">
                    <div><span>聯絡人總數</span><strong>{record.shrineContacts.length} 位</strong></div>
                    <div><span>有效聯絡人</span><strong>{record.shrineContacts.filter((contact) => contact.isActive && contact.contactStatus !== "已封存").length} 位</strong></div>
                    <div><span>主要聯絡人</span><strong>{record.shrineContacts.find((contact) => contact.isPrimary && contact.isActive)?.name ?? "目前無主要聯絡人"}</strong></div>
                  </div>
                  <div className="related-record-table">
                    {record.shrineContacts.filter((contact) => contact.isActive && contact.contactStatus !== "已封存").map((contact) => (
                      <article key={contact.contactId}>
                        <strong>{contact.name}｜{contact.title}{contact.isPrimary ? "｜主要聯絡人" : ""}</strong>
                        <span>{contact.contactStatus}｜使用中</span>
                        <span>{contact.methods.map((method) => `${method.type}${method.isPrimary ? "（主要）" : ""}：${method.value}`).join("、") || "尚無聯絡方式"}</span>
                        {contact.note ? <span>{contact.note}</span> : null}
                      </article>
                    ))}
                  </div>
                  {record.shrineContacts.some((contact) => !contact.isActive || contact.contactStatus === "已封存") ? (
                    <details className="archived-contact-panel">
                      <summary>封存聯絡人</summary>
                      <div className="related-record-table">
                        {record.shrineContacts.filter((contact) => !contact.isActive || contact.contactStatus === "已封存").map((contact) => (
                          <article key={contact.contactId}>
                            <strong>{contact.name}｜{contact.title}</strong>
                            <span>{contact.contactStatus}</span>
                            <span>{contact.methods.map((method) => `${method.type}：${method.value}`).join("、") || "尚無聯絡方式"}</span>
                          </article>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </>
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
                  {record.shrineDeities.filter((deity) => deity.role === "主祀").map((deity) => (
                    <article key={deity.id}>
                      <strong>主祀：{deity.name}</strong>
                      <span>主祀神祇須包含於供奉神祇清單。</span>
                    </article>
                  ))}
                  <article>
                    <strong>其他供奉</strong>
                    <span>{record.shrineDeities.filter((deity) => deity.role !== "主祀").map((deity) => deity.name).join("、") || "目前尚無其他供奉神祇。"}</span>
                  </article>
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
