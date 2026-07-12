/* global console */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(resolve(appRoot, relativePath), "utf-8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includes(source, expected, message) {
  assert(source.includes(expected), message);
}

function excludes(source, forbidden, message) {
  assert(!source.includes(forbidden), message);
}

function auditNoFormalCustomFieldUi() {
  const src = [
    read("src/routes/SettingsPage.tsx"),
    read("src/lib/navigation.ts"),
    read("src/components/NewRecordPanel.tsx"),
    read("src/routes/ModuleDetailPage.tsx"),
    read("src/services/recordService.ts"),
    read("src/lib/domainModel.ts"),
  ].join("\n");
  const adminSettings = read("src/data/adminSettings.ts");

  includes(adminSettings, "export const customFieldDefinitions: CustomFieldDefinition[] = []", "本階段 customFieldDefinitions 應停用");
  includes(adminSettings, "activeCustomFieldsForModule", "需保留明確停用點，避免誤接動態欄位");
  includes(adminSettings, "return []", "activeCustomFieldsForModule 應固定回傳空陣列");

  for (const forbidden of [
    "欄位與表單設定",
    "自訂欄位管理",
    "新增自訂欄位",
    "CustomFieldsPanel",
    "customFieldToEditField",
    "activeCustomFieldsForModule(moduleItem.key",
    "activeCustomFieldsForModule(record.moduleKey",
    "activeCustomFieldsForModule(record.module_key",
    "/settings?section=custom-fields",
    "接待注意事項",
    "接待提醒等級",
  ]) {
    excludes(src, forbidden, `使用者畫面不得保留欄位管理或未核准欄位：${forbidden}`);
  }
}

function auditRoleBoundaries() {
  const appShell = read("src/components/AppShell.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const settingsPage = read("src/routes/SettingsPage.tsx");
  const navigation = read("src/lib/navigation.ts");

  includes(appShell, "<Navigate to=\"/test-login\" replace />", "未登入時需導向測試登入頁");
  includes(appShell, "location.pathname === \"/settings\" && !canUseAdminSettings(role)", "非管理者不可進入管理者設定頁");
  includes(appShell, "const canViewCurrentModule = !currentModule || visibleModuleKeys.has(currentModule.key)", "不可進入目前身分不可見模組");
  includes(appShell, "const newRouteBlocked = isNewRoute && !canEditDailyWork(role)", "善信不可進入新增頁");
  includes(navigation, "const adminNavGroups", "需有管理者專屬導覽群組");
  includes(navigation, "const staffNavGroups", "需有廟方人員導覽群組");
  includes(navigation, "const devoteeNavGroups", "需有善信導覽群組");
  includes(navigation, "if (role === \"admin\") return adminNavGroups", "管理者設定分類只能管理者導覽可見");
  assert(!navigation.match(/const staffNavGroups[\s\S]*title: "管理者設定"/), "廟方人員不應看到管理者設定分類");
  assert(!navigation.match(/const devoteeNavGroups[\s\S]*title: "管理者設定"/), "善信不應看到管理者設定分類");
  includes(detailPage, "role === \"admin\" || field.key !== \"dataStatus\"", "廟方人員不得編輯資料狀態等高風險欄位");
  includes(settingsPage, "const canUse = canUseAdminSettings(role)", "設定頁需保留管理者防線");
  includes(settingsPage, "if (!canUse)", "設定頁需在頁面層級擋住非管理者");
}

function auditShrineContactWorkflow() {
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const domainModel = read("src/lib/domainModel.ts");
  const recordService = read("src/services/recordService.ts");

  for (const source of [newRecordPanel, detailPage]) {
    includes(source, "addShrineMethod", "友宮聯絡人需可新增多筆聯絡方式");
    includes(source, "setPrimaryShrineContact", "友宮需可指定主要聯絡人");
    includes(source, "setPrimaryShrineMethod", "友宮需可指定主要聯絡方式");
    includes(source, "toggleShrineContactArchived", "友宮聯絡人需可封存 / 還原");
    includes(source, "聯絡人已封存", "封存狀態需清楚顯示");
    excludes(source, "刪除聯絡人", "不得提供刪除聯絡人");
    excludes(source, "DELETE", "不得新增 DELETE");
  }

  includes(domainModel, "contactStatus !== \"已封存\"", "友宮摘要需排除封存聯絡人");
  includes(recordService, "activeContactCount", "列表摘要需顯示有效聯絡人數");
  includes(recordService, "primaryMethod", "列表摘要需顯示主要聯絡方式");
}

function main() {
  auditNoFormalCustomFieldUi();
  auditRoleBoundaries();
  auditShrineContactWorkflow();

  console.log(JSON.stringify({
    ok: true,
    audits: ["no formal custom field UI", "role boundaries", "shrine contact workflow"],
  }));
}

main();
