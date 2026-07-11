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

function auditVisibleWording() {
  const files = [
    "src/components/DetailActionPanel.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/data/mockRecords.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/routes/DashboardPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];
  const combined = files.map((file) => read(file)).join("\n");

  for (const forbidden of ["模組邊界", "API 驗證", "API 伺服器", "API 回應", "fields_json", "tags_json", "module_key", "raw status", "刪除", "期限", "經手", 'label: "狀態"']) {
    excludes(combined, forbidden, `使用者可見文字不應包含 ${forbidden}`);
  }
}

function auditNewRecordFields() {
  const fields = read("src/data/newRecordFields.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const templeAffairs = sectionBetween(fields, '"temple-affairs": [', "  devotees: [");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");
  const documents = sectionBetween(fields, "  documents: [", "  team: [");
  const team = sectionBetween(fields, "  team: [", "  ledger: [");
  const ledger = sectionBetween(fields, "  ledger: [", "};");

  includes(devotees, "建立日期", "善信新增需有建立日期");
  includes(devotees, "stateSemantics.notes.authorization", "本人資料授權需引用集中用途說明");
  includes(domainModel, "用於確認是否可查詢本人相關服務紀錄。", "本人資料授權需有用途說明");
  for (const expected of ["是否領取發財金", "領取日期", "是否繳回", "繳回日期", "發財金備註", "相關紀錄"]) {
    includes(devotees, expected, `善信新增缺少 ${expected}`);
  }
  excludes(devotees, "預計完成日", "善信新增不應有期限或預計完成日");
  excludes(devotees, "dueDate", "善信新增不應送出 dueDate");

  for (const expected of ["廟務類別", "承辦人員", "預計完成日", "處理狀態", "stateSemantics.processStatuses"]) {
    includes(templeAffairs, expected, `廟務管理缺少 ${expected}`);
  }

  for (const expected of ["聯絡人", "聯絡電話", "地址", "聯繫方式", "電話", "LINE", "Email"]) {
    includes(shrines, expected, `友宮管理缺少 ${expected}`);
  }

  for (const expected of ["帳務日期", "採購單編號", "實際金額", "數量", "品項", "付款狀態"]) {
    includes(ledger, expected, `帳務管理缺少 ${expected}`);
  }

  includes(documents, "文件日期", "公文紀錄需有文件日期");

  for (const expected of ["主任委員", "副主任委員", "總幹事", "財務", "會計", "出納", "委員", "志工", "系統管理者", "一般工作人員", "其他"]) {
    includes(team, expected, `團隊管理職稱缺少 ${expected}`);
  }
}

function auditMockAndApiDisplay() {
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");

  for (const expected of ["承辦人員", "建立日期", "本人資料授權", "發財金狀態", "聯絡電話", "帳務日期", "付款狀態"]) {
    includes(mockRecords, expected, `demo / 詳情資料缺少 ${expected}`);
  }

  includes(recordService, "policy.showDueDate", "API mode 需依模組 policy 決定是否顯示預計完成日");
  includes(recordService, 'label: "資料狀態"', "API mode 列表應顯示資料狀態");
  for (const expected of ["fortuneMoneyReceived", "fortuneMoneyReturned", "contactMethod", "quantity", "itemName"]) {
    includes(recordService, expected, `API mode 欄位中文轉換缺少 ${expected}`);
  }
}

function main() {
  auditVisibleWording();
  auditNewRecordFields();
  auditMockAndApiDisplay();

  console.log(JSON.stringify({
    ok: true,
    audits: ["visible wording", "new record fields", "mock detail fields", "api display mapping"],
  }));
}

main();
