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

function auditShrineMultiContactModel() {
  const domainModel = read("src/lib/domainModel.ts");
  const adminSettings = read("src/data/adminSettings.ts");
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  includes(domainModel, "export type ShrineContact", "友宮需有多筆聯絡人模型");
  includes(domainModel, "export type ContactMethod", "每位聯絡人需支援多種聯絡方式");
  includes(domainModel, "shrineContactExamples", "需有多位友宮聯絡人範例");
  includes(domainModel, "isPrimary: boolean", "主要聯絡人需是聯絡人屬性");
  includes(domainModel, "isActive: boolean", "聯絡人需可停用 / 封存");
  includes(domainModel, "methods: ContactMethod[]", "聯絡方式需掛在聯絡人底下");
  for (const expected of ["電話", "手機", "LINE", "Email", "地址", "其他"]) {
    includes(adminSettings, expected, `聯絡方式類型主檔缺少 ${expected}`);
  }
  for (const forbidden of ["contactPerson", "phone", "contactMethod", "mainWindow"]) {
    excludes(shrines, forbidden, `友宮主檔新增不應保留單一自由欄位 ${forbidden}`);
  }
  includes(newRecordPanel, "新增聯絡人", "新增友宮頁需可加入聯絡人");
  includes(newRecordPanel, "設為主要聯絡人", "新增友宮頁需可指定主要聯絡人");
  includes(newRecordPanel, "封存聯絡人", "新增友宮頁需可封存聯絡人");
  includes(newRecordPanel, "還原聯絡人", "新增友宮頁需可還原聯絡人");
  includes(detailPage, "<strong>友宮聯絡人</strong>", "詳情頁需顯示友宮聯絡人清單");
  includes(mockRecords, "shrineContacts: shrineContactExamples", "友宮 A 需有多位聯絡人");
  includes(mockRecords, "shrineContacts: []", "友宮 B 需支援零位聯絡人");
}

function auditShrineStructuredRelationships() {
  const domainModel = read("src/lib/domainModel.ts");
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  includes(domainModel, "export type ShrineRelatedRecord", "友宮需有實際業務紀錄關聯模型");
  includes(domainModel, "businessRecordOptions", "實際業務紀錄選項需與設定主檔分離");
  includes(domainModel, "shrineRelatedRecordExamples", "友宮需有多筆關聯紀錄範例");
  for (const expected of ["relatedVisitIds", "relatedInvitationIds", "relatedEventIds", "relatedDocumentIds"]) {
    includes(shrines, expected, `友宮關聯需使用結構化欄位 ${expected}`);
  }
  for (const forbidden of ["relatedVisit\", label", "relatedEvent\", label", "relatedDocument\", label"]) {
    excludes(shrines, forbidden, `友宮關聯不應退回一般文字欄位 ${forbidden}`);
  }
  excludes(shrines, 'key: "relations"', "友宮主檔不應保留自由文字相關紀錄 textarea");
  includes(shrines, "歷史補充說明", "若需舊資料補充，需明確標為歷史補充說明");
  includes(newRecordPanelText(), "友宮相關紀錄", "新增友宮頁需使用相關紀錄用語");
  includes(mockRecords, "shrineRelatedRecords: shrineRelatedRecordExamples", "友宮 A 需有多筆來訪 / 請帖 / 活動 / 公文關聯");
  includes(mockRecords, "shrineRelatedRecords: []", "友宮 B 需支援無關聯紀錄");
  includes(recordService, "shrineRelationSummary", "列表需用友宮關聯紀錄摘要");
  includes(recordService, "shrineContacts", "API mapping 需支援友宮聯絡人");
  includes(recordService, "shrineRelatedRecords", "API mapping 需支援友宮關聯紀錄");
}

function newRecordPanelText() {
  return read("src/components/NewRecordPanel.tsx");
}

function auditShrineDeityAndMasterData() {
  const adminSettings = read("src/data/adminSettings.ts");
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  for (const expected of ["shrineTypes", "contactTypes", "contactStatuses", "contactRoleTypes", "deityCatalog", "regionCatalog", "relationshipStatuses", "visitTypes", "invitationTypes", "recordStatuses"]) {
    includes(adminSettings, expected, `masterDataCatalogs 缺少 ${expected}`);
  }
  includes(shrines, "masterDataCatalogs.deityCatalog", "供奉神祇需引用神祇主檔");
  includes(shrines, "type: \"tags\"", "供奉神祇需支援複選");
  includes(shrines, "主祀神祇", "友宮需可指定主祀神祇");
  includes(domainModel, "export type ShrineDeityRecord", "需有友宮神祇紀錄模型");
  includes(mockRecords, "shrineDeities: shrineDeityExamples", "友宮 A 需有多位供奉神祇");
}

function auditGlobalDuplicateBoundaries() {
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const recordService = read("src/services/recordService.ts");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const team = sectionBetween(fields, "  team: [", "  ledger: [");
  const procurements = sectionBetween(fields, "  procurements: [", "  documents: [");
  const ledger = sectionBetween(fields, "  ledger: [", "};");

  for (const forbidden of ["往來分類", "往來類型", "返還狀態", "返還提醒"]) {
    excludes(devotees, forbidden, `善信主檔不可退回單筆往來欄位 ${forbidden}`);
  }
  includes(domainModel, "devoteeRelatedRecordExamples", "善信相關紀錄需維持多筆模型");
  includes(team, "linkedDevotee", "團隊成員需關聯善信，避免另建人員主檔");
  includes(procurements, "relatedLedger", "採購需用關聯帳務欄位");
  includes(ledger, "relatedDevoteeRecord", "帳務需可關聯善信往來紀錄");
  includes(recordService, "contactPerson", "舊聯絡人欄位需由 mapper 隱藏或轉換");
  includes(recordService, "mainWindow", "舊主要聯絡窗口欄位需由 mapper 隱藏或轉換");
}

function auditEmptyStatesAndVisibleText() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const combined = `${detailPage}\n${newRecordPanel}`;

  for (const expected of ["目前尚無聯絡人", "目前尚無來訪、請帖、活動或公文關聯", "目前尚無供奉神祇紀錄"]) {
    includes(combined, expected, `無資料時需有簡潔 empty state：${expected}`);
  }
  for (const forbidden of ["DELETE", "刪除", "fields_json", "tags_json", "module_key", "raw status"]) {
    excludes(combined, forbidden, `使用者畫面不應出現 ${forbidden}`);
  }
}

function main() {
  auditShrineMultiContactModel();
  auditShrineStructuredRelationships();
  auditShrineDeityAndMasterData();
  auditGlobalDuplicateBoundaries();
  auditEmptyStatesAndVisibleText();

  console.log(JSON.stringify({
    ok: true,
    audits: ["shrine multi contact", "structured relationships", "deity master data", "global duplicate boundaries", "empty states"],
  }));
}

main();
