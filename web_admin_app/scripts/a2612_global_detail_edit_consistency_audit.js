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

function auditVisibleWording() {
  const visibleSources = [
    "src/components/AppShell.tsx",
    "src/components/DetailActionPanel.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/components/PermissionBadge.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
  ].map((file) => read(file)).join("\n");

  for (const forbidden of [
    "yyyy/MM/dd",
    "yyyy-mm-dd",
    "testRun",
    "automatedTest",
    "fields_json",
    "tags_json",
    "module_key",
    "raw status",
    "smoke test",
    "diagnostic",
    "目前身份",
    "身份檢視",
  ]) {
    excludes(visibleSources, forbidden, `使用者主畫面不應顯示 ${forbidden}`);
  }

  includes(visibleSources, "目前角色：", "角色工具需維持低干擾目前角色");
}

function auditDateInputs() {
  const dateFormat = read("src/lib/dateFormat.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const mockRecords = read("src/data/mockRecords.ts");

  includes(dateFormat, "rocDateInputHint", "需集中定義日期輸入提示");
  includes(dateFormat, "日期輸入：年/月/日；例：114/07/11", "日期提示需使用民國年/月/日");
  includes(newRecordPanel, "rocDateInputHint", "新增頁日期欄位需使用民國日期提示");
  includes(detailPage, "rocDateInputHint", "編輯頁日期欄位需使用民國日期提示");
  includes(newRecordPanel, "aria-label={`${field.label}，${rocDateInputHint}`}", "新增頁 date input 需有民國日期可讀標籤");
  includes(detailPage, "aria-label={`${field.label}，${rocDateInputHint}`}", "編輯頁 date input 需有民國日期可讀標籤");
  includes(mockRecords, "normalizeRecordDates", "mock 顯示日期需經民國日期 formatter");
}

function auditDevoteeFields() {
  const newRecordFields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const moduleListPage = read("src/routes/ModuleListPage.tsx");
  const devoteesStart = newRecordFields.indexOf("  devotees: [");
  const devoteesEnd = newRecordFields.indexOf("  shrines: [", devoteesStart);
  const devotees = newRecordFields.slice(devoteesStart, devoteesEnd);

  for (const expected of ["手機號碼", "地址", "性別", "年齡級距", "出生月 / 日"]) {
    includes(devotees, expected, `新增善信欄位缺少 ${expected}`);
    includes(mockRecords, expected, `善信 mock 編輯欄位缺少 ${expected}`);
    includes(recordService, expected, `API mode 顯示 / 編輯 mapping 缺少 ${expected}`);
  }

  for (const expected of ["未填寫", "14 以下", "15～24", "25～34", "35～44", "45～54", "55～64", "65 以上"]) {
    includes(devotees, expected, `年齡級距缺少 ${expected}`);
  }

  includes(devotees, 'key: "birthMonthDay"', "出生月 / 日需使用獨立欄位");
  includes(newRecordPanel, 'placeholder={field.type === "number" ? "請輸入數字" : textPlaceholder}', "文字欄位需使用一般輸入提示");
  excludes(devotees, "出生日期", "不應要求完整出生日期");
  excludes(devotees, "生日", "不應要求生日年份");
  excludes(moduleListPage, "手機號碼", "列表頁不應顯示手機號碼");
  excludes(moduleListPage, "地址", "列表頁不應顯示地址");
  excludes(moduleListPage, "出生月 / 日", "列表頁不應顯示出生月 / 日");
}

function auditEditConsistency() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const detailActionPanel = read("src/components/DetailActionPanel.tsx");
  const recordService = read("src/services/recordService.ts");

  includes(detailPage, "<StatusBadge status={record.status} />", "標題區需以 badge 顯示資料狀態");
  excludes(detailPage, "<div><span>資料狀態</span>", "詳情摘要不應重複顯示資料狀態");
  includes(detailPage, "field.key !== \"dataStatus\"", "非管理者編輯時不應顯示資料狀態欄位");
  includes(detailPage, "!isEditing && record.note", "編輯模式不應重複顯示備註面板");
  includes(detailPage, "!isEditing && relatedRecordItems.length > 0", "編輯模式不應重複顯示相關紀錄面板");
  excludes(detailActionPanel, "permissionLabel", "操作面板不應重複顯示目前角色");
  includes(recordService, "standardEditKeys", "API mode 編輯欄位需去除通用欄位重複");
  includes(recordService, "customEditFields", "API mode 需補上各模組自訂編輯欄位");
}

function auditRelatedRecords() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const recordService = read("src/services/recordService.ts");

  includes(detailPage, "related-record-actions", "相關紀錄需是可操作按鈕");
  includes(detailPage, "related-result-panel", "相關紀錄點擊後需展開查詢結果");
  includes(detailPage, "setRelatedActionMessage", "相關紀錄查詢需有可見回饋");
  includes(detailPage, "查看帳務紀錄", "金流類相關紀錄需指向帳務管理查詢");
  includes(recordService, "發財金：1 筆", "善信相關紀錄需支援發財金");
  includes(recordService, "還金：1 筆", "善信相關紀錄需支援還金");
  includes(recordService, "香油錢：1 筆", "善信相關紀錄需支援香油錢");
  includes(recordService, "捐款：1 筆", "善信相關紀錄需支援捐款");
  includes(recordService, "帳務紀錄：1 筆", "善信相關紀錄需支援帳務紀錄");
  excludes(detailPage, "關聯：", "不應顯示不清楚的關聯文字");
}

function auditRoleSemantics() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const detailActionPanel = read("src/components/DetailActionPanel.tsx");
  const newRecordPage = read("src/routes/NewRecordPage.tsx");

  includes(detailPage, 'role === "viewer"', "善信詳情頁需有角色分流");
  includes(detailPage, "本人資料確認", "善信畫面需偏本人資料確認語意");
  includes(newRecordPage, "本人資料確認", "善信不可新增時需偏本人資料確認語意");
  includes(detailActionPanel, 'if (role === "viewer")', "善信不應看到操作卡");
  includes(detailActionPanel, "return null", "善信不應看到編輯、封存或作廢 CTA");
  includes(detailActionPanel, "日常資料可處理，高風險操作需管理者確認。", "廟方人員操作提示需短且清楚");
}

function main() {
  auditVisibleWording();
  auditDateInputs();
  auditDevoteeFields();
  auditEditConsistency();
  auditRelatedRecords();
  auditRoleSemantics();

  console.log(JSON.stringify({
    ok: true,
    audits: ["visible wording", "date inputs", "devotee fields", "edit consistency", "related records", "role semantics"],
  }));
}

main();
