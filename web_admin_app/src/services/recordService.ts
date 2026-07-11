import { webAdminApi, type ApiRecord, type ApiRecordPayload } from "../api/webAdminApi";
import { isApiMode } from "../config/runtimeMode";
import type { EditField, MockRecord } from "../data/mockRecords";
import { recordById, recordsForModule } from "../data/mockRecords";
import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";
import { newRecordFields } from "../data/newRecordFields";
import { assigneeSemantics, categorySemantics, fieldPolicyFor, stateSemantics, tagSemantics } from "../lib/domainModel";
import { formatDisplayDate } from "../lib/dateFormat";

export type FormValues = Record<string, string | string[]>;
export type StatusFilter = "active" | "archived" | "all";

export const apiConnectionErrorMessage = "目前無法連線到測試資料服務，請稍後再試。";

type ListRecordsOptions = {
  keyword?: string;
  statusFilter?: StatusFilter;
  role?: UserRole;
};

const systemStatuses = new Set(["active", "pending", "draft", "disabled", "archived"]);

function actorForRole(role: UserRole): Pick<ApiRecordPayload, "actor_role" | "actor_name"> {
  const actorName: Record<UserRole, string> = {
    admin: "測試管理者",
    staff: "廟方人員",
    viewer: "善信",
  };

  return {
    actor_role: role,
    actor_name: actorName[role],
  };
}

function resolveSystemStatus(value: unknown) {
  const status = typeof value === "string" ? value : "";
  const displayStatusMap: Record<string, string> = {
    使用中: "active",
    待確認: "pending",
    草稿: "draft",
    已停用: "disabled",
    已封存: "archived",
    作廢: "disabled",
  };
  if (displayStatusMap[status]) return displayStatusMap[status];
  return systemStatuses.has(status) ? status : "active";
}

function normalizeStatusCategory(record: ApiRecord): MockRecord["statusCategory"] {
  if (record.is_archived || record.status === "archived") return "archived";
  if (record.status === "disabled") return "disabled";
  return "active";
}

function statusLabel(record: ApiRecord) {
  if (record.is_archived || record.status === "archived") return "已封存";
  if (record.status === "disabled") return "作廢";
  return "使用中";
}

function dateText(record: ApiRecord) {
  return formatDisplayDate(record.record_date || record.due_date || record.updated_at.slice(0, 10));
}

function stringValue(value: unknown) {
  if (Array.isArray(value)) return value.join("、");
  if (value === null || value === undefined || value === "") return "未填寫";
  return String(value);
}

const engineeringTestPattern = /A23F3|A23F5|automated|production browser|smoke test|diagnostic|test updated|自動驗證|測試資料更新/i;

function hasEngineeringTestText(value: unknown) {
  return typeof value === "string" && engineeringTestPattern.test(value);
}

function anonymousDevoteeName(id: string) {
  const names = ["張○○", "林○○", "陳○○", "王○○", "李○○"];
  const charCode = id.charCodeAt(0) || 0;
  return names[charCode % names.length];
}

function displayTitle(record: ApiRecord) {
  if (!hasEngineeringTestText(record.title)) return record.title;
  if (record.module_key === "devotees") return anonymousDevoteeName(record.id);
  return "廟務資料紀錄";
}

function displaySummary(record: ApiRecord) {
  if (record.module_key === "devotees" && record.summary === "善信資料維護確認") return "本人資料授權待確認。";
  if (!hasEngineeringTestText(record.summary)) return record.summary;
  if (record.module_key === "devotees") return "善信資料維護紀錄。";
  return "廟務資料維護紀錄。";
}

function displayOwner(value: string, record: ApiRecord) {
  if (!hasEngineeringTestText(value)) return value;
  return record.module_key === "devotees" ? "櫃檯人員 A" : "廟方人員";
}

const fieldDisplayLabels: Record<string, string> = {
  name: "名稱",
  title: "標題",
  type: "類型",
  category: "類別",
  authorization: "本人資料授權",
  services: "服務紀錄",
  handler: "資料維護人員",
  contact: "聯繫方式",
  mobile: "手機號碼",
  contactPerson: "聯絡人",
  phone: "聯絡電話",
  address: "地址",
  contactMethod: "聯繫方式",
  relations: "相關紀錄",
  replyStatus: "回覆狀態",
  relatedShrine: "相關友宮",
  channels: "發布管道",
  supportItems: "支援項目",
  supplier: "供應商",
  ledgerHint: "帳務紀錄",
  documentType: "文件類型",
  relatedItem: "相關廟務或活動",
  systemRole: "系統權限",
  termStatus: "任期狀態",
  cashType: "收支類型",
  procurementNo: "採購單編號",
  paymentStatus: "付款狀態",
  approvalStage: "審核標記",
  fortuneMoneyReceived: "是否領取發財金",
  fortuneMoneyReceivedDate: "領取日期",
  fortuneMoneyReturned: "是否繳回",
  fortuneMoneyReturnedDate: "繳回日期",
  fortuneMoneyNote: "發財金備註",
  gender: "性別",
  ageRange: "年齡級距",
  birthMonthDay: "出生月 / 日",
  quantity: "數量",
  itemName: "品項",
  sourceRecord: "來源資料",
  publicSummary: "公開內容",
  internalNote: "內部備註",
  audience: "可見對象",
  publishingPlan: "發布整理",
  processStatus: "處理狀態",
  purpose: "需求用途",
  mainWindow: "主要聯絡窗口",
  lineBinding: "LINE 綁定狀態示意",
  enabled: "是否啟用",
  status: "處理狀態",
  date: "日期",
  recordDate: "發生日期",
  dueDate: "預計完成日",
  group: "承辦人員",
  note: "備註",
};

function displayFieldLabel(key: string, moduleKey?: ModuleKey) {
  if (key === "status" && (moduleKey === "announcements" || moduleKey === "events")) return "發布狀態";
  return fieldDisplayLabels[key] ?? key;
}

const hiddenDetailFieldKeys = new Set([
  "testRun",
  "automatedTest",
  "diagnostic",
  "smoke",
  "productionBrowser",
  "debug",
  "raw",
  "rawStatus",
  "fields_json",
  "tags_json",
  "module_key",
  "record_id",
  "id",
  "title",
  "name",
  "summary",
  "date",
  "recordDate",
  "publishDate",
  "dueDate",
  "handler",
  "owner",
  "responsible",
  "group",
  "category",
  "type",
  "cashType",
  "documentType",
  "dataStatus",
  "note",
]);

const emptyFieldValues = new Set(["", "未填寫", "尚未指定", "無", "null", "undefined"]);

function displayValue(value: unknown) {
  const text = hasEngineeringTestText(value) ? "第三方測試用匿名資料" : stringValue(value);
  if (emptyFieldValues.has(text.trim())) return "";
  return formatDisplayDate(text);
}

function visibleDetailField([key, value]: [string, unknown]) {
  if (hiddenDetailFieldKeys.has(key)) return false;
  return Boolean(displayValue(value));
}

function uniqueDisplayFields(fields: Array<{ label: string; value: string }>) {
  const seen = new Set<string>();

  return fields.filter((field) => {
    const key = field.label.trim();
    if (!field.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function relatedRecordSummary(record: ApiRecord, tags: string[]) {
  const fields = record.fields_json;
  const items = new Set<string>();

  const add = (label: string, condition: unknown) => {
    if (condition && displayValue(condition)) items.add(label);
  };

  if (record.module_key === "devotees") {
    const relationText = String(fields.relations ?? "");
    add("發財金：1 筆", fields.fortuneMoneyReceived || fields.fortuneMoneyReturned || tags.includes("發財金") || relationText.includes("發財金"));
    add("還金：1 筆", relationText.includes("還金") || String(fields.fortuneMoneyNote ?? "").includes("還金"));
    add("香油錢：1 筆", relationText.includes("香油錢"));
    add("捐款：1 筆", relationText.includes("捐款"));
    add("活動參與：1 筆", String(fields.relations ?? "").includes("活動") || tags.includes("活動通知"));
    add("服務紀錄：1 筆", fields.services);
    add("帳務紀錄：1 筆", String(fields.relations ?? "").includes("帳務"));
  }

  if (record.module_key === "shrines") add("來訪 / 請帖：1 筆", fields.relations || fields.relatedShrine);
  if (record.module_key === "visits") add("友宮紀錄：1 筆", fields.relatedShrine);
  if (record.module_key === "procurements") add("帳務紀錄：1 筆", fields.ledgerHint);
  if (record.module_key === "ledger") add("採購紀錄：1 筆", fields.procurementNo || fields.relations);
  if (record.module_key === "documents") add("廟務 / 活動：1 筆", fields.relatedItem);
  if (record.module_key === "announcements" || record.module_key === "events") add("來源資料：1 筆", fields.sourceRecord);

  for (const tag of tags) {
    if (tag && !items.size && !hasEngineeringTestText(tag)) items.add(`${tag}：1 筆`);
  }

  return Array.from(items).join("、");
}

function displayNote(record: ApiRecord) {
  return displayValue(record.fields_json.note);
}

function processStatusFor(record: ApiRecord) {
  return displayValue(record.fields_json.processStatus ?? record.fields_json.status);
}

function publishingStatusFor(record: ApiRecord) {
  return displayValue(record.fields_json.status);
}

function listFieldsFor(record: ApiRecord, owner: string) {
  const policy = fieldPolicyFor(record.module_key);
  const updated = formatDisplayDate(record.updated_at.slice(0, 10));
  const add = (fields: Array<{ label: string; value: string }>, label: string, value: unknown) => {
    const text = displayValue(value);
    if (text) fields.push({ label, value: text });
  };
  const fields: Array<{ label: string; value: string }> = [];

  if (record.module_key === "devotees") {
    add(fields, "善信類型", record.category);
    add(fields, "本人資料授權", record.fields_json.authorization);
    add(fields, "最近更新", updated);
    add(fields, policy.ownerLabel, owner);
    return fields;
  }

  if (record.module_key === "announcements" || record.module_key === "events") {
    add(fields, policy.categoryLabel ?? "發布類別", record.category);
    add(fields, "發布狀態", publishingStatusFor(record));
    add(fields, "最近更新", updated);
    add(fields, policy.ownerLabel, owner);
    return fields;
  }

  if (record.module_key === "ledger") {
    add(fields, policy.categoryLabel ?? "帳務類別", record.category);
    add(fields, "付款狀態", record.fields_json.paymentStatus);
    add(fields, "最近更新", updated);
    add(fields, policy.ownerLabel, owner);
    return fields;
  }

  if (record.module_key === "team") {
    add(fields, "宮廟職稱", record.fields_json.role);
    add(fields, "任期狀態", record.fields_json.termStatus);
    add(fields, "帳號連結", record.fields_json.lineBinding);
    add(fields, "最近更新", updated);
    return fields;
  }

  add(fields, policy.categoryLabel ?? "類別", record.category);
  add(fields, record.module_key === "shrines" ? "聯繫狀態" : "處理狀態", processStatusFor(record));
  if (record.module_key === "visits") add(fields, "回覆狀態", record.fields_json.replyStatus);
  if (record.module_key === "procurements") add(fields, "帳務紀錄", record.fields_json.ledgerHint);
  add(fields, "最近更新", updated);
  if (policy.showAssignee) add(fields, policy.ownerLabel, owner);

  return fields.slice(0, 4);
}

function apiRecordToMockRecord(record: ApiRecord): MockRecord {
  const policy = fieldPolicyFor(record.module_key);
  const owner = displayOwner(record.responsible || record.updated_by || record.created_by || "廟方人員", record);
  const title = displayTitle(record);
  const summary = displaySummary(record);
  const displayFields = uniqueDisplayFields(
    Object.entries(record.fields_json)
      .filter(visibleDetailField)
      .map(([label, value]) => ({ label: displayFieldLabel(label, record.module_key), value: displayValue(value) }))
  ).slice(0, 8);
  const displayTags = record.tags_json.filter((tag) => !hasEngineeringTestText(tag));
  const detailFields = [
    ...(policy.showCategory ? [{ label: policy.categoryLabel ?? "類別", value: record.category || "未分類" }] : []),
    ...displayFields,
  ];
  const categoryOptions = categorySemantics.moduleCategories[record.module_key];
  const standardEditKeys = new Set([
    "title",
    "name",
    "summary",
    "date",
    "publishDate",
    "recordDate",
    "dueDate",
    "handler",
    "owner",
    "group",
    "responsible",
    "type",
    "category",
    "cashType",
    "documentType",
    "note",
  ]);
  const customEditFields: EditField[] = newRecordFields[record.module_key]
    .filter((field) => !standardEditKeys.has(field.key))
    .map((field) => {
      const rawValue = record.fields_json[field.key];
      const value = rawValue === undefined || rawValue === null ? field.value : rawValue;
      return {
        ...field,
        value: Array.isArray(field.value) ? (Array.isArray(value) ? value : []) : String(value),
      } as EditField;
    });
  const editFields: EditField[] = [
    { key: "title", label: "名稱", type: "text", value: record.title },
    { key: "summary", label: "摘要", type: "textarea", value: record.summary },
    { key: "dataStatus", label: "資料狀態", type: "select", value: statusLabel(record), options: stateSemantics.dataStatuses, help: "資料狀態由管理者或具封存權限的廟方人員調整。" },
    { key: "recordDate", label: policy.dateLabel, type: "date", value: record.record_date ?? "" },
    ...(policy.showDueDate ? [{ key: "dueDate", label: "預計完成日", type: "date" as const, value: record.due_date ?? "" }] : []),
    ...(policy.showAssignee ? [{ key: "responsible", label: policy.ownerLabel, type: "select" as const, value: owner, options: assigneeSemantics.eligibleMembers, help: assigneeSemantics.note }] : []),
    ...(policy.showCategory ? [{ key: "category", label: policy.categoryLabel ?? "類別", type: "select" as const, value: record.category || categoryOptions[0], options: categoryOptions, help: categorySemantics.note }] : []),
    ...(policy.showTags ? [{ key: "tags", label: "輔助標籤", type: "tags" as const, value: displayTags, options: Array.from(new Set([...displayTags, ...tagSemantics.commonTags])), help: tagSemantics.note }] : []),
    ...customEditFields,
    { key: "note", label: "備註", type: "textarea", value: hasEngineeringTestText(record.fields_json.note) || stringValue(record.fields_json.note) === "未填寫" ? "" : stringValue(record.fields_json.note) },
  ];
  const listFields = listFieldsFor(record, owner);

  return {
    id: record.id,
    moduleKey: record.module_key,
    title,
    status: statusLabel(record),
    statusCategory: normalizeStatusCategory(record),
    summary: summary || "尚未填寫摘要。",
    owner,
    dateLabel: dateText(record),
    relation: relatedRecordSummary(record, displayTags),
    note: displayNote(record),
    listFields,
    detailFields,
    editFields,
  };
}

function visibleByStatus(record: MockRecord, statusFilter: StatusFilter) {
  const activeRecord = record.statusCategory !== "archived" && record.statusCategory !== "disabled";
  const archivedRecord = record.statusCategory === "archived" || record.statusCategory === "disabled";
  return statusFilter === "all" || (statusFilter === "active" && activeRecord) || (statusFilter === "archived" && archivedRecord);
}

function matchesKeyword(record: MockRecord, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  const searchableText = [
    record.title,
    record.summary,
    record.status,
    record.owner,
    record.dateLabel,
    ...record.listFields.flatMap((field) => [field.label, field.value]),
  ].join(" ").toLowerCase();
  return searchableText.includes(normalizedKeyword);
}

export async function listRecords(moduleKey: ModuleKey, options: ListRecordsOptions = {}) {
  const effectiveStatusFilter = options.role === "viewer" ? "active" : options.statusFilter ?? "active";

  if (!isApiMode) {
    return recordsForModule(moduleKey).filter((record) => visibleByStatus(record, effectiveStatusFilter) && matchesKeyword(record, options.keyword ?? ""));
  }

  const records = await webAdminApi.listRecords({
    moduleKey,
    q: options.keyword,
    includeArchived: effectiveStatusFilter !== "active",
  });

  return records.map(apiRecordToMockRecord).filter((record) => visibleByStatus(record, effectiveStatusFilter));
}

export async function getRecord(id: string) {
  if (!isApiMode) {
    return recordById(id);
  }

  return apiRecordToMockRecord(await webAdminApi.getRecord(id));
}

function valuesToPayload(moduleKey: ModuleKey, values: FormValues, role: UserRole): Required<Pick<ApiRecordPayload, "module_key" | "title">> & ApiRecordPayload {
  const actor = actorForRole(role);
  const title = String(values.title || values.name || values.role || "未命名資料");
  const summary = String(values.summary || values.note || `${title} 待確認`);
  const tags = Object.values(values).flatMap((value) => (Array.isArray(value) ? value : []));

  return {
    module_key: moduleKey,
    title,
    summary,
    status: resolveSystemStatus(values.dataStatus),
    record_date: String(values.date || values.publishDate || values.recordDate || "") || null,
    due_date: String(values.dueDate || "") || null,
    responsible: String(values.handler || values.owner || values.group || values.responsible || ""),
    category: String(values.type || values.category || values.cashType || values.documentType || ""),
    fields_json: values,
    tags_json: tags,
    ...actor,
  };
}

export async function createRecord(moduleKey: ModuleKey, values: FormValues, role: UserRole) {
  if (!isApiMode) {
    return undefined;
  }

  return apiRecordToMockRecord(await webAdminApi.createRecord(valuesToPayload(moduleKey, values, role)));
}

export async function updateRecord(id: string, moduleKey: ModuleKey, values: FormValues, role: UserRole) {
  if (!isApiMode) {
    return undefined;
  }

  const payload = valuesToPayload(moduleKey, values, role);
  return apiRecordToMockRecord(await webAdminApi.updateRecord(id, payload));
}

export async function archiveRecord(id: string, role: UserRole) {
  if (!isApiMode) {
    return undefined;
  }

  return apiRecordToMockRecord(await webAdminApi.archiveRecord(id, actorForRole(role)));
}

export async function restoreRecord(id: string, role: UserRole) {
  if (!isApiMode) {
    return undefined;
  }

  return apiRecordToMockRecord(await webAdminApi.restoreRecord(id, { ...actorForRole(role), status: "active" }));
}

export async function getAuditEvents(id: string) {
  if (!isApiMode) {
    return [];
  }

  return webAdminApi.getAuditEvents(id);
}
