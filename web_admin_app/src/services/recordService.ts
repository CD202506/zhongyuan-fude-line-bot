import { webAdminApi, type ApiRecord, type ApiRecordPayload } from "../api/webAdminApi";
import { isApiMode } from "../config/runtimeMode";
import type { EditField, MockRecord } from "../data/mockRecords";
import { recordById, recordsForModule } from "../data/mockRecords";
import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";

export type FormValues = Record<string, string | string[]>;
export type StatusFilter = "active" | "archived" | "all";

export const apiConnectionErrorMessage = "目前無法連線到測試資料服務，請確認本機 API 是否已啟動。";

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
    viewer: "檢視者",
  };

  return {
    actor_role: role,
    actor_name: actorName[role],
  };
}

function resolveSystemStatus(value: unknown) {
  const status = typeof value === "string" ? value : "";
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

function apiRecordToMockRecord(record: ApiRecord): MockRecord {
  const owner = record.responsible || record.updated_by || record.created_by || "廟方人員";
  const detailFields = [
    { label: "類別", value: record.category || "未分類" },
    { label: "負責", value: owner },
    { label: "建立", value: record.created_at.slice(0, 10) },
    ...Object.entries(record.fields_json).slice(0, 6).map(([label, value]) => ({ label, value: stringValue(value) })),
  ];
  const editFields: EditField[] = [
    { key: "title", label: "名稱", type: "text", value: record.title },
    { key: "summary", label: "摘要", type: "textarea", value: record.summary },
    { key: "status", label: "狀態", type: "select", value: record.status, options: ["active", "pending", "draft", "disabled", "archived"] },
    { key: "recordDate", label: "日期", type: "date", value: record.record_date ?? "" },
    { key: "dueDate", label: "期限", type: "date", value: record.due_date ?? "" },
    { key: "responsible", label: "負責人", type: "text", value: owner },
    { key: "category", label: "類別", type: "text", value: record.category },
    { key: "tags", label: "關聯標籤", type: "tags", value: record.tags_json, options: Array.from(new Set([...record.tags_json, "待確認", "活動", "帳務", "文件"])) },
    { key: "note", label: "備註", type: "textarea", value: stringValue(record.fields_json.note) === "未填寫" ? "" : stringValue(record.fields_json.note) },
  ];

  return {
    id: record.id,
    moduleKey: record.module_key,
    title: record.title,
    status: statusLabel(record),
    statusCategory: normalizeStatusCategory(record),
    summary: record.summary || "尚未填寫摘要。",
    owner,
    dateLabel: dateText(record),
    relation: record.tags_json.length > 0 ? `關聯：${record.tags_json.join("、")}` : "目前尚未設定關聯資訊。",
    note: stringValue(record.fields_json.note) === "未填寫" ? "目前尚未填寫備註。" : stringValue(record.fields_json.note),
    listFields: [
      { label: "類別", value: record.category || "未分類" },
      { label: "狀態", value: statusLabel(record) },
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
