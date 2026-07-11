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

function auditPersonFirstModel() {
  const fields = read("src/data/newRecordFields.ts");
  const settings = read("src/data/adminSettings.ts");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const team = sectionBetween(fields, "  team: [", "  ledger: [");

  for (const expected of ["善信名稱", "善信類型", "手機號碼", "地址", "性別", "年齡級距", "出生月 / 日", "資料維護人員"]) {
    includes(devotees, expected, `善信主檔缺少基本欄位 ${expected}`);
  }

  for (const forbidden of ["往來分類", "往來類型", "返還狀態", "返還提醒", "金額 / 品項", "領取人 / 登錄人"]) {
    excludes(devotees, forbidden, `善信主檔不應直接放往來紀錄欄位 ${forbidden}`);
  }

  includes(team, "關聯善信", "團隊成員需先關聯善信主檔");
  includes(settings, "linkedDevotee", "管理者設定團隊成員需保留關聯善信");
  includes(settings, "linkedTeamMember", "權限設定需先選團隊成員再授權");
}

function auditRelatedRecordModel() {
  const domainModel = read("src/lib/domainModel.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");

  includes(domainModel, "export type DevoteeRelatedRecord", "需建立善信相關紀錄型別");
  includes(domainModel, "devoteeRelatedRecordExamples", "需有善信相關紀錄範例");
  for (const expected of ["財務往來", "物資往來", "公告通知", "活動參與", "服務 / 聯繫紀錄", "發財金借出", "發財金返還", "香油錢", "物資捐贈", "供品捐贈"]) {
    includes(domainModel, expected, `善信相關紀錄模型缺少 ${expected}`);
  }
  for (const expected of ["originalAmount", "returnedAmount", "differenceHandling"]) {
    includes(domainModel, expected, `發財金返還需保留 ${expected}，不可假設借出與返還金額相同`);
  }
  includes(mockRecords, "relatedRecords: devoteeRelatedRecordExamples", "善信 mock 需掛多筆相關紀錄");
  includes(recordService, "relatedRecords.length", "API mode 需支援 relatedRecords 多筆摘要");
  includes(newRecordPanel, "新增相關紀錄", "新增善信頁需可加入多筆相關紀錄");
  includes(detailPage, "relatedButtonLabel", "詳情頁相關紀錄需依類型顯示查詢動作");
}

function auditConfigurableMasterData() {
  const settings = read("src/data/adminSettings.ts");
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");

  includes(settings, "masterDataCatalogs", "管理者設定需集中定義基礎資料主檔");
  for (const expected of ["devoteeTypes", "teamRoles", "permissionTypes", "interactionCategories", "interactionTypes", "itemCatalog", "unitCatalog", "accountingCategories"]) {
    includes(settings, expected, `基礎資料主檔缺少 ${expected}`);
  }
  includes(fields, "masterDataCatalogs.devoteeTypes", "善信類型需由設定主檔提供");
  includes(fields, "masterDataCatalogs.teamRoles", "團隊職稱需由設定主檔提供");
  includes(fields, "masterDataCatalogs.accountingCategories", "帳務類別需由設定主檔提供");
  includes(domainModel, "masterDataCatalogs.accountingCategories", "domain model 帳務類別需接設定主檔");
}

function auditRelationshipBoundaries() {
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");

  for (const expected of ["relatedDevotee", "relatedTeamMember", "relatedDevoteeRecord", "relatedActivityDocument", "relatedLedger", "relatedWork", "relatedParticipants", "notificationStatus"]) {
    includes(fields, expected, `跨模組關聯欄位缺少 ${expected}`);
  }
  for (const expected of ["relationshipFieldSemantics", "關聯善信", "關聯團隊成員 / 登錄人員", "關聯善信往來紀錄", "通知狀態", "報名狀態", "參與狀態"]) {
    includes(domainModel, expected, `跨模組關聯語意缺少 ${expected}`);
  }
}

function main() {
  auditPersonFirstModel();
  auditRelatedRecordModel();
  auditConfigurableMasterData();
  auditRelationshipBoundaries();

  console.log(JSON.stringify({
    ok: true,
    audits: ["person-first model", "related record model", "configurable master data", "relationship boundaries"],
  }));
}

main();
