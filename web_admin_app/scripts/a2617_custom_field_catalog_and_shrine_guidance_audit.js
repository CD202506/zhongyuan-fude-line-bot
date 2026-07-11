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

function sectionBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `找不到區塊起點：${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end > start, `找不到區塊終點：${endMarker}`);
  return source.slice(start, end);
}

function auditCustomFieldModelAndSettings() {
  const adminSettings = read("src/data/adminSettings.ts");
  const settingsPage = read("src/routes/SettingsPage.tsx");
  const navigation = read("src/lib/navigation.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const recordService = read("src/services/recordService.ts");

  includes(adminSettings, "export type CustomFieldDefinition", "需有 CustomFieldDefinition 模型");
  for (const expected of ["moduleKey", "fieldType", "required", "active", "archived", "sortOrder", "placeholder", "options", "editableRoles", "showInList", "showInDetail", "showInCreate", "showInEdit"]) {
    includes(adminSettings, expected, `自訂欄位模型缺少 ${expected}`);
  }
  for (const type of ["text", "textarea", "number", "date", "select", "multiSelect", "checkbox"]) {
    includes(adminSettings, `"${type}"`, `自訂欄位需支援 ${type}`);
  }
  includes(settingsPage, "CustomFieldsPanel", "管理者設定需有自訂欄位管理工作區");
  includes(settingsPage, "新增自訂欄位", "需有新增自訂欄位入口");
  includes(settingsPage, "適用模組", "自訂欄位需可選擇適用模組");
  includes(settingsPage, "封存 / 還原", "自訂欄位需支援封存 / 還原");
  includes(settingsPage, "上移", "自訂欄位需支援排序上移");
  includes(settingsPage, "下移", "自訂欄位需支援排序下移");
  includes(navigation, 'route: "/settings?section=custom-fields"', "左側管理者設定需有欄位與表單設定入口");
  excludes(settingsPage, "刪除", "本輪不得新增真正刪除");
  excludes(settingsPage, "DELETE", "本輪不得新增 DELETE");
  includes(domainModel, "customFieldToEditField", "自訂欄位需轉為可渲染表單欄位");
  includes(newRecordPanel, "activeCustomFieldsForModule(moduleItem.key, \"create\")", "新增頁需動態渲染啟用自訂欄位");
  includes(detailPage, "activeCustomFieldsForModule(record.moduleKey, \"edit\")", "編輯頁需動態渲染啟用自訂欄位");
  includes(detailPage, "detailCustomFields", "詳情頁需動態顯示自訂欄位");
  includes(recordService, "activeCustomFieldsForModule(record.module_key, \"edit\")", "API mode edit mapping 需帶入自訂欄位");
  includes(recordService, "activeCustomFieldsForModule(record.module_key, \"detail\")", "API mode detail mapping 需帶入自訂欄位");
  includes(adminSettings, "不取代聯絡人或相關紀錄", "自訂欄位不得取代核心關聯模型");
}

function auditCatalogProvenance() {
  const adminSettings = read("src/data/adminSettings.ts");
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");
  const mockShrine = sectionBetween(mockRecords, '    id: "shrine-a"', '    id: "shrine-b"');

  includes(adminSettings, "assignableTeamMemberOptions", "資料維護人員需有 team member value / label option");
  includes(shrines, "assignableTeamMemberOptions", "友宮資料維護人員需來自有效團隊成員");
  includes(shrines, "masterDataCatalogs.shrineTypes", "友宮分類需來自 shrineTypes");
  includes(shrines, "masterDataCatalogs.regionCatalog", "地區需來自 regionCatalog");
  includes(shrines, "masterDataCatalogs.deityCatalog", "供奉神祇需來自 deityCatalog");
  includes(shrines, "masterDataCatalogs.relationshipStatuses", "友宮主檔聯繫狀態需來自 relationshipStatuses");
  includes(mockShrine, "assignableTeamMemberOptions", "友宮 mock 編輯欄位需沿用有效團隊成員");
  includes(mockShrine, "masterDataCatalogs.relationshipStatuses", "友宮 mock 聯繫狀態需沿用 relationshipStatuses");
  includes(recordService, "assignableTeamMemberOptions", "API mode 資料維護人員需支援 team option label");
  includes(adminSettings, "contactStatuses", "聯絡人個別狀態需有 contactStatuses");
  includes(adminSettings, "relationshipStatuses", "友宮主檔關係狀態需有 relationshipStatuses");
  includes(shrines, "友宮主檔關係狀態；聯絡人個別狀態另用聯絡人狀態", "需說明 relationshipStatuses 與 contactStatuses 分工");
  includes(shrines, "由管理者設定的友宮分類", "需有友宮分類來源提示");
  includes(shrines, "由管理者設定的地區選項", "需有地區來源提示");
  includes(shrines, "從目前有效的團隊成員中選擇", "需有團隊成員來源提示");
}

function auditShrineDeityDependencyAndRelatedDates() {
  const fields = read("src/data/newRecordFields.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const domainModel = read("src/lib/domainModel.ts");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  includes(shrines, "主祀神祇須先包含於供奉神祇", "主祀神祇需有依存提示");
  includes(newRecordPanel, 'field.key === "deities"', "供奉神祇變更需檢查主祀神祇");
  includes(newRecordPanel, 'field.key === "primaryDeity"', "主祀神祇選項需依已選供奉神祇產生");
  includes(detailPage, 'field.key === "deities"', "詳情編輯供奉神祇變更需檢查主祀神祇");
  includes(detailPage, 'field.key === "primaryDeity"', "詳情編輯主祀神祇選項需依已選供奉神祇產生");
  includes(detailPage, "主祀：", "詳情頁需明確顯示主祀");
  includes(detailPage, "其他供奉", "詳情頁需將主祀與其他供奉分開");
  includes(domainModel, "businessRecordFieldOption", "關聯選項需由實際紀錄產生");
  includes(domainModel, "formatDisplayDate(record.date)", "關聯 chip 日期需由實際紀錄日期轉為民國日期");
  excludes(newRecordPanel, "2026-07-08", "新增頁不應直接顯示 ISO 日期");
  excludes(detailPage, "2026-07-08", "詳情頁不應直接顯示 ISO 日期");
  excludes(domainModel, "自動建立關聯", "不得以日期自動建立關聯");
}

function auditSummaryHistoryNoteGuidance() {
  const fields = read("src/data/newRecordFields.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const styles = read("src/styles.css");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  excludes(shrines, 'label: "摘要"', "友宮新增頁不得有可編輯摘要");
  includes(detailPage, "系統摘要（系統自動產生）", "系統摘要需標示自動產生");
  includes(detailPage, "system-summary-strip", "系統摘要需是唯讀顯示區");
  includes(newRecordPanel, "collapsible-field", "歷史補充說明需以收合或低層級呈現");
  includes(detailPage, "collapsible-field", "詳情編輯歷史補充說明需以收合或低層級呈現");
  includes(styles, ".collapsible-field summary", "收合欄位需有樣式");
  includes(shrines, "非日常使用", "歷史補充說明需標示非日常使用");
  includes(newRecordPanel, "僅填寫舊紙本、舊系統", "歷史補充需有明確 placeholder");
  includes(newRecordPanel, "填寫目前需注意的聯繫方式", "備註需有日常用途 placeholder");
  includes(detailPage, "填寫目前需注意的聯繫方式", "詳情編輯備註需有日常用途 placeholder");
}

function auditGlobalNoRegression() {
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const recordService = read("src/services/recordService.ts");
  const settingsPage = read("src/routes/SettingsPage.tsx");

  for (const expected of ["devoteeRelatedRecordExamples", "ShrineContact", "ShrineRelatedRecord", "businessRecordOptions"]) {
    includes(domainModel, expected, `結構化模型不可退化：${expected}`);
  }
  for (const expected of ["relatedShrine", "relatedLedger", "relatedTeamMember", "sourceRecord", "reviewer", "handler"]) {
    assert(fields.includes(expected) || recordService.includes(expected), `需保留全域關聯或承辦欄位：${expected}`);
  }
  for (const forbidden of ["聯絡人自訂文字", "活動關聯自訂文字", "帳務關聯自訂文字", "來訪關聯自訂文字", "公文關聯自訂文字"]) {
    excludes(settingsPage + fields, forbidden, `自訂欄位不得取代核心關聯：${forbidden}`);
  }
}

function main() {
  auditCustomFieldModelAndSettings();
  auditCatalogProvenance();
  auditShrineDeityDependencyAndRelatedDates();
  auditSummaryHistoryNoteGuidance();
  auditGlobalNoRegression();

  console.log(JSON.stringify({
    ok: true,
    audits: [
      "custom field model and settings",
      "catalog provenance",
      "shrine deity dependency and related dates",
      "summary history note guidance",
      "global no regression",
    ],
  }));
}

main();
