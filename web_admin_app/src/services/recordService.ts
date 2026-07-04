import { webAdminApi, type ApiRecord, type ApiRecordPayload } from "../api/webAdminApi";
import { isApiMode } from "../config/runtimeMode";
import type { EditField, MockRecord } from "../data/mockRecords";
import { recordById, recordsForModule } from "../data/mockRecords";
import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";

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
  };
  if (displayStatusMap[status]) return displayStatusMap[status];
  return systemStatuses.has(status) ? status : "active";
}

function normalizeStatusCategory(record: ApiRecord): MockRecord["statusCategory"] {
  if (record.is_archived || record.status === "archived") return "archived";
  if (record.status === "disabled") return "disabled";
  if (record.status === "draft") return "draft";
  if (record.status === "pending") return "pending";
  return "active";
}

function statusLabel(record: ApiRecord) {
  if (record.is_archived || record.status === "archived") return "已封存";

  const labels: Record<string, string> = {
    active: "使用中",
    pending: "待確認",
    draft: "草稿",
    disabled: "已停用",
  };

  return labels[record.status] ?? record.status;
}

function dateText(record: ApiRecord) {
  return record.record_date || record.due_date || record.updated_at.slice(0, 10);
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
  authorization: "授權狀態",
  services: "服務紀錄",
  handler: "承辦人員",
  contact: "聯繫方式",
  contactPerson: "聯絡人",
  phone: "聯絡電話",
  address: "地址",
  contactMethod: "聯繫方式",
  relations: "關聯紀錄",
  replyStatus: "回覆狀態",
  relatedShrine: "關聯友宮",
  channels: "發布管道",
  supportItems: "支援項目",
  supplier: "供應商",
  ledgerHint: "帳務關聯",
  documentType: "文件類型",
  relatedItem: "關聯廟務或活動",
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
  quantity: "數量",
  itemName: "品項",
  date: "日期",
  recordDate: "發生日期",
  dueDate: "預計完成日",
  group: "承辦人員",
  note: "備註",
};

function displayFieldLabel(key: string) {
  return fieldDisplayLabels[key] ?? key;
}

function apiRecordToMockRecord(record: ApiRecord): MockRecord {
  const owner = displayOwner(record.responsible || record.updated_by || record.created_by || "廟方人員", record);
  const title = displayTitle(record);
  const summary = displaySummary(record);
  const displayFields = Object.entries(record.fields_json)
    .filter(([label]) => label !== "automatedTest")
    .slice(0, 6)
    .map(([label, value]) => ({ label: displayFieldLabel(label), value: hasEngineeringTestText(value) ? "第三方測試用匿名資料" : stringValue(value) }));
  const displayTags = record.tags_json.filter((tag) => !hasEngineeringTestText(tag));
  const detailFields = [
    { label: "類別", value: record.category || "未分類" },
    { label: "承辦人員", value: owner },
    { label: "建立日期", value: record.created_at.slice(0, 10) },
    ...displayFields,
  ];
  const recordDateLabel = record.module_key === "devotees" ? "建立日期" : record.module_key === "ledger" ? "帳務日期" : record.module_key === "documents" ? "文件日期" : "發生日期";
  const editFields: EditField[] = [
    { key: "title", label: "名稱", type: "text", value: record.title },
    { key: "summary", label: "摘要", type: "textarea", value: record.summary },
    { key: "status", label: "資料狀態", type: "select", value: statusLabel(record), options: ["使用中", "待確認", "草稿", "已停用", "已封存"] },
    { key: "recordDate", label: recordDateLabel, type: "date", value: record.record_date ?? "" },
    ...(record.module_key === "devotees" ? [] : [{ key: "dueDate", label: "預計完成日", type: "date" as const, value: record.due_date ?? "" }]),
    { key: "responsible", label: "承辦人員", type: "text", value: owner },
    { key: "category", label: "類別", type: "text", value: record.category },
    { key: "tags", label: "關聯標籤", type: "tags", value: displayTags, options: Array.from(new Set([...displayTags, "待確認", "活動", "帳務", "文件"])) },
    { key: "note", label: "備註", type: "textarea", value: hasEngineeringTestText(record.fields_json.note) || stringValue(record.fields_json.note) === "未填寫" ? "" : stringValue(record.fields_json.note) },
  ];

  return {
    id: record.id,
    moduleKey: record.module_key,
    title,
    status: statusLabel(record),
    statusCategory: normalizeStatusCategory(record),
    summary: summary || "尚未填寫摘要。",
    owner,
    dateLabel: dateText(record),
    relation: displayTags.length > 0 ? `關聯：${displayTags.join("、")}` : "目前尚未設定關聯資訊。",
    note: hasEngineeringTestText(record.fields_json.note) || stringValue(record.fields_json.note) === "未填寫" ? "目前尚未填寫備註。" : stringValue(record.fields_json.note),
    listFields: [
      { label: "類別", value: record.category || "未分類" },
      { label: "資料狀態", value: statusLabel(record) },
      { label: "更新", value: record.updated_at.slice(0, 10) },
    ],
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
    status: resolveSystemStatus(values.status),
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
