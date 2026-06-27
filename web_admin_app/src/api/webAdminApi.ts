import { webAdminApiBaseUrl } from "../config/runtimeMode";
import type { ModuleKey } from "../data/modules";
import type { UserRole } from "../data/mockUser";

export type ApiRecord = {
  id: string;
  module_key: ModuleKey;
  title: string;
  summary: string;
  status: string;
  record_date: string | null;
  due_date: string | null;
  responsible: string;
  category: string;
  fields_json: Record<string, unknown>;
  tags_json: string[];
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export type ApiModule = {
  key: ModuleKey;
  title: string;
  description: string;
  boundary: string;
  can_create_roles: UserRole[];
  can_archive_roles: UserRole[];
};

export type ApiRecordPayload = {
  module_key?: ModuleKey;
  title?: string;
  summary?: string;
  status?: string;
  record_date?: string | null;
  due_date?: string | null;
  responsible?: string;
  category?: string;
  fields_json?: Record<string, unknown>;
  tags_json?: string[];
  actor_role?: UserRole;
  actor_name?: string;
};

export type ApiAuditEvent = {
  id: string;
  record_id: string;
  action: string;
  actor_role: UserRole;
  actor_name: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
};

type ListRecordsParams = {
  moduleKey?: ModuleKey;
  q?: string;
  status?: string;
  includeArchived?: boolean;
};

export class ApiRequestError extends Error {
  status: number;
  responseText: string;

  constructor(status: number, message: string, responseText = "") {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.responseText = responseText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${webAdminApiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new ApiRequestError(response.status, `Request failed: ${response.status}`, responseText.slice(0, 300));
  }

  return response.json() as Promise<T>;
}

export const webAdminApi = {
  getHealth() {
    return request<{ status: string; service: string; mode: string; database_status: string }>("/api/health");
  },

  getModules() {
    return request<ApiModule[]>("/api/modules");
  },

  listRecords(params: ListRecordsParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.moduleKey) searchParams.set("module_key", params.moduleKey);
    if (params.q) searchParams.set("q", params.q);
    if (params.status) searchParams.set("status", params.status);
    if (params.includeArchived) searchParams.set("include_archived", "true");
    const query = searchParams.toString();
    return request<ApiRecord[]>(`/api/records${query ? `?${query}` : ""}`);
  },

  getRecord(id: string) {
    return request<ApiRecord>(`/api/records/${id}`);
  },

  createRecord(payload: Required<Pick<ApiRecordPayload, "module_key" | "title">> & ApiRecordPayload) {
    return request<ApiRecord>("/api/records", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateRecord(id: string, payload: ApiRecordPayload) {
    return request<ApiRecord>(`/api/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  archiveRecord(id: string, actor: Pick<ApiRecordPayload, "actor_role" | "actor_name">) {
    return request<ApiRecord>(`/api/records/${id}/archive`, {
      method: "POST",
      body: JSON.stringify(actor),
    });
  },

  restoreRecord(id: string, actor: Pick<ApiRecordPayload, "actor_role" | "actor_name"> & { status?: string }) {
    return request<ApiRecord>(`/api/records/${id}/restore`, {
      method: "POST",
      body: JSON.stringify(actor),
    });
  },

  getAuditEvents(id: string) {
    return request<ApiAuditEvent[]>(`/api/records/${id}/audit-events`);
  },
};
