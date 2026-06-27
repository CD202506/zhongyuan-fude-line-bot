/* global console, fetch, process */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiBaseUrl = "https://zhongyuan-fude-web-admin-api.onrender.com";
const frontendUrl = "https://zhongyuan-fude-web-admin-test.vercel.app";
const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const title = `A23F3 自動驗證善信資料 ${timestamp}`;
const updatedTitle = `A23F3 自動驗證善信資料更新 ${timestamp}`;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed with ${response.status}`);
  }

  return body;
}

function verifyFrontendPayloadLogic() {
  const serviceSource = readFileSync(resolve(appRoot, "src/services/recordService.ts"), "utf-8");
  const newPageSource = readFileSync(resolve(appRoot, "src/routes/NewRecordPage.tsx"), "utf-8");

  assert(serviceSource.includes('const systemStatuses = new Set(["active", "pending", "draft", "disabled", "archived"])'), "system status allow-list is missing");
  assert(serviceSource.includes('return systemStatuses.has(status) ? status : "active";'), "non-system status should fall back to active");
  assert(serviceSource.includes("status: resolveSystemStatus(values.status)"), "payload status should use resolveSystemStatus");
  assert(!serviceSource.includes("values.replyStatus || values.authorization || values.termStatus"), "payload status still mixes flow fields");
  assert(serviceSource.includes("fields_json: values"), "flow fields should remain in fields_json");
  assert(newPageSource.includes("onComplete={() => navigate(moduleItem.route)}"), "create flow should return to module route");
}

async function main() {
  verifyFrontendPayloadLogic();

  const health = await request("/api/health");
  assert(health.status === "ok", "health status should be ok");
  assert(health.mode === "postgres", "health mode should be postgres");
  assert(health.database_status === "postgres_available", "database should be postgres_available");

  const modules = await request("/api/modules");
  assert(Array.isArray(modules), "modules should be an array");
  assert(modules.length === 10, "modules should contain 10 items");

  const payload = {
    module_key: "devotees",
    title,
    summary: "A23F3 automated test",
    status: "active",
    responsible: "櫃檯人員 A",
    category: "一般善信",
    fields_json: {
      name: title,
      authorization: "待確認",
      services: ["發財金"],
      note: "A23F3 自動驗證",
    },
    tags_json: ["A23F3", "發財金"],
    actor_role: "admin",
    actor_name: "A23F3 automated test",
  };

  const created = await request("/api/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert(created.id, "created record should have id");
  assert(created.module_key === "devotees", "created module_key should be devotees");
  assert(created.status === "active", "created status should be active");
  assert(created.fields_json.authorization === "待確認", "flow status should remain in fields_json");

  const listed = await request("/api/records?module_key=devotees");
  assert(listed.some((record) => record.id === created.id && record.title === title), "created record should be visible in default devotees list");

  const detail = await request(`/api/records/${created.id}`);
  assert(detail.title === title, "detail should return created title");

  const updated = await request(`/api/records/${created.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: updatedTitle,
      summary: "A23F3 automated test updated",
      status: "active",
      fields_json: {
        ...detail.fields_json,
        name: updatedTitle,
        authorization: "已確認",
      },
      actor_role: "admin",
      actor_name: "A23F3 automated test",
    }),
  });
  assert(updated.title === updatedTitle, "updated title should be persisted");

  const updatedDetail = await request(`/api/records/${created.id}`);
  assert(updatedDetail.title === updatedTitle, "detail should return updated title");

  const archived = await request(`/api/records/${created.id}/archive`, {
    method: "POST",
    body: JSON.stringify({
      actor_role: "admin",
      actor_name: "A23F3 automated test",
    }),
  });
  assert(archived.is_archived === true, "archive should set is_archived");

  const archivedList = await request("/api/records?module_key=devotees&include_archived=true");
  assert(archivedList.some((record) => record.id === created.id && record.is_archived === true), "archived record should be visible with include_archived");

  const restored = await request(`/api/records/${created.id}/restore`, {
    method: "POST",
    body: JSON.stringify({
      status: "active",
      actor_role: "admin",
      actor_name: "A23F3 automated test",
    }),
  });
  assert(restored.is_archived === false, "restore should clear is_archived");
  assert(restored.status === "active", "restore should keep active status");

  const auditEvents = await request(`/api/records/${created.id}/audit-events`);
  const auditActions = new Set(auditEvents.map((event) => event.action));
  for (const action of ["create", "update", "archive", "restore"]) {
    assert(auditActions.has(action), `audit events should include ${action}`);
  }

  console.log(JSON.stringify({
    ok: true,
    frontendUrl,
    health: health.status,
    modules: modules.length,
    createdId: created.id,
    listed: true,
    detail: true,
    update: true,
    archive: true,
    restore: true,
    auditActions: Array.from(auditActions).sort(),
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
