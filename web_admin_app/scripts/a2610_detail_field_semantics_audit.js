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

function auditDetailMapper() {
  const recordService = read("src/services/recordService.ts");

  for (const expected of ["hiddenDetailFieldKeys", "uniqueDisplayFields", "visibleDetailField", "relatedRecordSummary", "displayNote", "listFieldsFor"]) {
    includes(recordService, expected, `詳情 mapper 缺少 ${expected}`);
  }

  for (const hidden of ["testRun", "automatedTest", "diagnostic", "smoke", "productionBrowser", "debug", "raw", "fields_json", "tags_json", "module_key", "record_id", "dataStatus"]) {
    includes(recordService, hidden, `詳情 mapper 未隱藏 ${hidden}`);
  }

  for (const expected of ["本人資料授權", "相關紀錄", "發財金：1 筆", "帳務紀錄：1 筆", "採購紀錄：1 筆", "來源資料：1 筆"]) {
    includes(recordService, expected, `詳情 mapper 缺少使用者語意 ${expected}`);
  }

  includes(recordService, "status: resolveSystemStatus(values.dataStatus)", "API 主狀態應只由資料狀態決定");
  excludes(recordService, "status: resolveSystemStatus(values.status)", "不可把各模組處理狀態寫入 API 主狀態");
  excludes(recordService, '{ label: "資料狀態", value: statusLabel(record) }', "列表摘要不應重複顯示資料狀態");
  includes(recordService, 'add(fields, "本人資料授權", record.fields_json.authorization)', "善信列表需顯示本人資料授權");
  includes(recordService, 'add(fields, "最近更新", updated)', "列表摘要需以最近更新取代建立日期混合欄位");
}

function auditListPage() {
  const listPage = read("src/routes/ModuleListPage.tsx");

  includes(listPage, "listHints", "列表頁需依模組提供提示文字");
  includes(listPage, "查看詳情後，可維護本人資料授權、發財金或基本資料。", "善信列表提示需符合模組語意");
  includes(listPage, "查看詳情後，可確認採購內容與帳務紀錄。", "採購列表提示需符合模組語意");
  includes(listPage, "查看詳情後，可整理發布內容、管道與可見對象。", "發布列表提示需符合模組語意");
  excludes(listPage, "先查看詳情，再處理資料", "列表頁不應使用籠統提示");
  excludes(listPage, "fieldPolicy.dateLabel", "列表頁不應額外合併建立日期或發生日期欄位");
  excludes(listPage, "fieldPolicy.ownerLabel", "列表頁不應額外合併承辦或維護人員欄位");
}

function auditDetailPage() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");

  includes(detailPage, "<StatusBadge status={record.status} />", "詳情頁標題區需顯示資料狀態 badge");
  excludes(detailPage, "<div><span>資料狀態</span>", "詳情摘要不應重複顯示資料狀態");
  includes(detailPage, "relatedRecordItems.length > 0", "相關紀錄需有內容才顯示");
  includes(detailPage, "record.note ?", "備註需有內容才顯示");
  includes(detailPage, "<strong>相關紀錄</strong>", "詳情頁關聯區塊需改名為相關紀錄");
  excludes(detailPage, "<strong>關聯資訊</strong>", "詳情頁不應再顯示關聯資訊");
  excludes(detailPage, "<span>狀態</span>", "詳情頁不應使用模糊狀態標籤");
}

function auditFormSemantics() {
  const fields = read("src/data/newRecordFields.ts");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const ledger = sectionBetween(fields, "  ledger: [", "};");

  includes(devotees, "本人資料授權", "善信表單需使用本人資料授權");
  includes(devotees, "stateSemantics.notes.authorization", "本人資料授權需有用途說明");
  includes(devotees, "可由管理者設定。", "善信類型需有簡短來源提示");
  includes(ledger, "相關紀錄", "帳務表單需使用相關紀錄");
  excludes(fields, "授權狀態", "新增表單不應再使用授權狀態");
  excludes(fields, "關聯紀錄", "新增表單不應再使用關聯紀錄");
}

function auditStateSemantics() {
  const domainModel = read("src/lib/domainModel.ts");
  const adminSettings = read("src/data/adminSettings.ts");

  for (const expected of ["dataStatuses", "processStatuses", "publishingStatuses", "authorizationStatuses", "資料狀態由管理者調整", "依作業進度調整", "依發布進度調整", "確認本人相關紀錄查詢範圍"]) {
    includes(domainModel, expected, `狀態語意缺少 ${expected}`);
  }

  for (const expected of ["本人資料授權", "已授權", "未授權", "取消授權"]) {
    includes(adminSettings, expected, `管理者基礎資料缺少 ${expected}`);
  }
}

function auditVisibleFiles() {
  const combined = [
    "src/components/AppShell.tsx",
    "src/data/mockRecords.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/lib/domainModel.ts",
    "src/routes/ModuleListPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
  ].map((file) => read(file)).join("\n");

  for (const forbidden of ["授權狀態", "關聯資訊", "關聯紀錄", "關聯：", "可查詢本人紀錄", "尚未授權", "fields_json", "tags_json", "module_key", "record_id", "raw status", "A23F3", "A23F5", "身份檢視", "切換不同身份"]) {
    excludes(combined, forbidden, `使用者可見文字不應包含 ${forbidden}`);
  }
}

function main() {
  auditDetailMapper();
  auditListPage();
  auditDetailPage();
  auditFormSemantics();
  auditStateSemantics();
  auditVisibleFiles();

  console.log(JSON.stringify({
    ok: true,
    audits: ["detail mapper", "list page", "detail page", "form semantics", "state semantics", "visible wording"],
  }));
}

main();
