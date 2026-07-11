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

function auditDatePlaceholder() {
  const dateFormat = read("src/lib/dateFormat.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const visibleSources = [dateFormat, newRecordPanel, detailPage].join("\n");

  includes(dateFormat, "formatRocDateInputValue", "日期輸入需用民國格式顯示");
  includes(dateFormat, "toIsoDateValue", "送 API 前需轉回 ISO date");
  includes(visibleSources, "年/月/日", "日期 placeholder 或提示需包含 年/月/日");
  includes(visibleSources, "例：114/07/11", "日期提示需包含民國日期範例");
  includes(newRecordPanel, 'type="text"', "新增頁 date 欄位不應使用瀏覽器原生 date placeholder");
  includes(detailPage, 'type="text"', "編輯頁 date 欄位不應使用瀏覽器原生 date placeholder");

  for (const forbidden of ["yyyy/月/dd", "yyyy/MM/dd", "yyyy-mm-dd"]) {
    excludes(visibleSources, forbidden, `日期提示不應顯示 ${forbidden}`);
  }
}

function auditNoDevoteeAuthorization() {
  const visibleSources = [
    "src/data/adminSettings.ts",
    "src/data/mockRecords.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/lib/domainModel.ts",
    "src/routes/ModuleListPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/services/recordService.ts",
  ].map((file) => read(file)).join("\n");

  excludes(visibleSources, "本人資料授權", "善信使用者畫面不應再顯示本人資料授權");
  excludes(visibleSources, "授權狀態", "善信使用者畫面不應再顯示授權狀態");
  excludes(visibleSources, "authorizationStatuses", "domain model 不應再提供善信授權狀態");
  excludes(visibleSources, "stateSemantics.notes.authorization", "表單不應再引用善信授權說明");
}

function auditDevoteeBaseFields() {
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const listPage = read("src/routes/ModuleListPage.tsx");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");

  for (const expected of ["手機號碼", "地址", "性別", "年齡級距", "出生月 / 日"]) {
    includes(devotees, expected, `善信基本資料欄位缺少 ${expected}`);
    includes(mockRecords, expected, `善信 mock 編輯欄位缺少 ${expected}`);
    includes(recordService, expected, `善信 API 顯示 mapping 缺少 ${expected}`);
  }

  for (const expected of ["未填寫", "14 以下", "15～24", "25～34", "35～44", "45～54", "55～64", "65 以上"]) {
    includes(devotees, expected, `年齡級距缺少 ${expected}`);
  }

  includes(devotees, 'key: "birthMonthDay"', "出生月 / 日需使用獨立欄位");
  excludes(devotees, "出生日期", "不應要求出生年份或完整日期");
  excludes(devotees, "生日", "不應要求生日年份");
  excludes(listPage, "手機號碼", "列表頁不應顯示手機號碼");
  excludes(listPage, "地址", "列表頁不應顯示地址");
  excludes(listPage, "出生月 / 日", "列表頁不應顯示出生月 / 日");
}

function auditDevoteeInteractionModel() {
  const fields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");

  for (const expected of ["往來分類", "往來類型", "有返還需求的財務往來", "不需返還的財務紀錄", "非財務物資往來"]) {
    includes(devotees, expected, `善信往來紀錄缺少分類語意 ${expected}`);
  }

  for (const expected of ["發財金", "平安龜", "返還狀態", "返還提醒", "待返還", "已返還", "逾期提醒"]) {
    includes(devotees, expected, `有返還需求財務往來缺少 ${expected}`);
  }

  for (const expected of ["善信捐款", "香油錢", "金牌"]) {
    includes(devotees, expected, `不需返還財務紀錄缺少 ${expected}`);
  }

  for (const expected of ["物資捐贈", "供品捐贈"]) {
    includes(devotees, expected, `非財務物資往來缺少 ${expected}`);
  }

  excludes(devotees, "發財金與服務紀錄", "善信往來紀錄不應再稱為發財金與服務紀錄");
  excludes(devotees, "還金提醒", "還金提醒不應作為往來類型");
  excludes(devotees, "活動通知", "活動通知不應作為往來類型");
  includes(devotees, "沒有往來紀錄", "無往來紀錄需可選且不強迫填寫");
  includes(mockRecords, "沒有往來紀錄", "mock 需支援無往來紀錄");
  includes(recordService, "fields.interactionCategory !== \"沒有往來紀錄\"", "無往來紀錄時不應產生空相關紀錄");
  includes(recordService, "平安龜：1 筆", "相關紀錄需支援平安龜");
  includes(recordService, "待返還：1 筆", "相關紀錄需支援待返還摘要");
  includes(recordService, "物資捐贈：1 筆", "相關紀錄需支援物資捐贈");
  includes(detailPage, "查看帳務紀錄", "金流類相關紀錄需可查詢帳務管理");
  includes(detailPage, "查看物資紀錄", "物資類相關紀錄需可查詢");
}

function main() {
  auditDatePlaceholder();
  auditNoDevoteeAuthorization();
  auditDevoteeBaseFields();
  auditDevoteeInteractionModel();

  console.log(JSON.stringify({
    ok: true,
    audits: ["date placeholder", "no devotee authorization", "devotee base fields", "devotee interaction model"],
  }));
}

main();
