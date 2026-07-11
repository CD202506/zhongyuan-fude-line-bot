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

function auditRawIdsHiddenFromUi() {
  const uiSources = [
    "src/components/NewRecordPanel.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/services/recordService.ts",
    "src/data/newRecordFields.ts",
  ].map((path) => `${path}\n${read(path)}`).join("\n\n");
  const modelSources = `${read("src/lib/domainModel.ts")}\n${read("src/data/mockRecords.ts")}`;
  const rawIds = ["visit-a", "visit-b", "invitation-a", "event-a", "event-b", "document-a", "document-b"];

  for (const rawId of rawIds) {
    excludes(uiSources, rawId, `一般 UI 不得直接包含 raw ID：${rawId}`);
    includes(modelSources, rawId, `raw ID 可保留於資料模型：${rawId}`);
  }

  excludes(uiSources, "紀錄代碼", "一般 UI 不得顯示紀錄代碼");
  excludes(uiSources, "record.recordId", "一般 UI 不得直接渲染 recordId");
  excludes(uiSources, "shrineRecord.recordId", "詳情頁不得顯示友宮關聯 recordId");
  excludes(uiSources, "`${item.id}｜${item.title}`", "關聯選項不得用 id 與 title 拼接");
  excludes(uiSources, "`${record.recordId}｜", "關聯 chip 不得拼接 raw ID");
}

function auditValueLabelSeparation() {
  const domainModel = read("src/lib/domainModel.ts");
  const fields = read("src/data/newRecordFields.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");

  includes(domainModel, "export type FieldOption", "欄位選項需支援 value / label 分離");
  includes(domainModel, "fieldOptionValue", "需有統一 option value 轉換");
  includes(domainModel, "fieldOptionLabel", "需有統一 option label 轉換");
  includes(domainModel, "businessRecordFieldOption", "業務關聯選項需轉為 value / label");
  includes(fields, "businessRecordFieldOption", "關聯欄位應使用 value / label option");
  includes(newRecordPanel, "fieldOptionLabel(option)", "新增頁應渲染 option label");
  includes(newRecordPanel, "fieldOptionValue(option)", "新增頁應使用 option value 作為內部值");
  includes(detailPage, "fieldOptionLabel(option)", "詳情編輯頁應渲染 option label");
  includes(detailPage, "fieldOptionValue(option)", "詳情編輯頁應使用 option value 作為內部值");
}

function auditShrineSummaryAndTextFields() {
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const shrinesNew = sectionBetween(fields, "  shrines: [", "  visits: [");
  const shrineMock = sectionBetween(mockRecords, '    moduleKey: "shrines",', '  {\n    id: "shrine-b"');

  excludes(shrinesNew, 'label: "摘要"', "友宮新增頁不應有可編輯摘要");
  excludes(shrineMock, 'label: "摘要"', "友宮詳情編輯欄位不應有可編輯摘要");
  includes(recordService, "editableSummaryField", "API mode 摘要欄位需依模組判斷");
  includes(recordService, 'record.module_key === "announcements"', "公告正式摘要可保留");
  includes(recordService, 'record.module_key === "events"', "活動正式簡介可保留");
  includes(recordService, 'record.module_key === "documents"', "文件正式摘要可保留");
  includes(recordService, "shrineSystemSummary", "友宮摘要需由系統推導");
  includes(detailPage, "system-summary-strip", "友宮系統摘要需以唯讀區塊顯示");
  includes(shrinesNew, "歷史補充說明", "友宮可保留歷史補充說明");
  includes(shrinesNew, "非日常使用", "歷史補充說明需標示非日常使用");
  includes(shrinesNew, 'label: "備註"', "友宮需保留一般備註");

  const textareaCount = (shrinesNew.match(/type: "textarea"/g) ?? []).length;
  assert(textareaCount <= 2, "友宮不應存在三個用途相近的大型 textarea");
}

function auditRelatedRecordsAreStructured() {
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const recordService = read("src/services/recordService.ts");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");

  for (const key of ["relatedVisitIds", "relatedInvitationIds", "relatedEventIds", "relatedDocumentIds"]) {
    includes(shrines, key, `友宮相關紀錄需使用結構化欄位：${key}`);
  }
  excludes(shrines, 'key: "relations"', "友宮相關紀錄不得是自由文字假關聯");
  includes(domainModel, "export type ShrineRelatedRecord", "友宮相關紀錄需有結構化模型");
  includes(domainModel, "export type DevoteeRelatedRecord", "善信相關紀錄需有結構化模型");
  includes(detailPage, "shrineRelatedRecordLabel", "詳情頁友宮關聯需使用可讀 label");
  includes(newRecordPanel, "shrineRelatedRecordLabel", "新增頁友宮關聯需使用可讀 label");
  includes(recordService, "hiddenDetailFieldKeys", "API mapping 需集中隱藏工程欄位");
  for (const hidden of ["relatedVisitIds", "relatedInvitationIds", "relatedEventIds", "relatedDocumentIds", "id", "module_key", "fields_json", "tags_json"]) {
    includes(recordService, `"${hidden}"`, `API detail 顯示需隱藏工程欄位：${hidden}`);
  }
}

function auditGlobalRelationshipLabels() {
  const fields = read("src/data/newRecordFields.ts");
  const recordService = read("src/services/recordService.ts");
  const domainModel = read("src/lib/domainModel.ts");

  for (const expected of [
    "relatedDevotee",
    "relatedTeamMember",
    "relatedLedger",
    "procurementNo",
    "sourceRecord",
    "relatedShrine",
    "linkedDevotee",
    "reviewer",
    "handler",
  ]) {
    assert(fields.includes(expected) || recordService.includes(expected) || domainModel.includes(expected), `需全域檢查關聯欄位：${expected}`);
  }

  for (const forbidden of ["fields_json", "tags_json", "module_key", "raw status", "API record key"]) {
    excludes(read("src/routes/ModuleDetailPage.tsx"), forbidden, `詳情頁不得出現工程文字：${forbidden}`);
    excludes(read("src/components/NewRecordPanel.tsx"), forbidden, `新增頁不得出現工程文字：${forbidden}`);
  }
}

function main() {
  auditRawIdsHiddenFromUi();
  auditValueLabelSeparation();
  auditShrineSummaryAndTextFields();
  auditRelatedRecordsAreStructured();
  auditGlobalRelationshipLabels();

  console.log(JSON.stringify({
    ok: true,
    audits: [
      "raw ids hidden from UI",
      "value label separation",
      "shrine summary and text fields",
      "structured related records",
      "global relationship labels",
    ],
  }));
}

main();
