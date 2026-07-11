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
  const templeAffairs = sectionBetween(fields, '"temple-affairs": [', "  devotees: [");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");
  const documents = sectionBetween(fields, "  documents: [", "  team: [");
  const team = sectionBetween(fields, "  team: [", "  ledger: [");
  const ledger = sectionBetween(fields, "  ledger: [", "};");
  const adminSettings = read("src/data/adminSettings.ts");

  includes(devotees, "建立日期", "善信新增需有建立日期");
  for (const expected of ["善信類型", "手機號碼", "地址", "性別", "年齡級距", "出生月 / 日", "資料維護人員"]) {
    includes(devotees, expected, `善信新增缺少 ${expected}`);
  }
  for (const forbidden of ["往來分類", "往來類型", "返還狀態", "返還提醒"]) {
    excludes(devotees, forbidden, `善信主檔新增不應直接包含 ${forbidden}`);
  }
  excludes(devotees, "預計完成日", "善信新增不應有期限或預計完成日");
  excludes(devotees, "dueDate", "善信新增不應送出 dueDate");

  for (const expected of ["廟務類別", "承辦人員", "預計完成日", "處理狀態", "stateSemantics.processStatuses"]) {
    includes(templeAffairs, expected, `廟務管理缺少 ${expected}`);
  }

  for (const expected of ["友宮分類", "地區", "供奉神祇", "主祀神祇", "聯繫狀態", "資料維護人員"]) {
    includes(shrines, expected, `友宮主檔缺少 ${expected}`);
  }
  for (const forbidden of ["contactPerson", "phone", "contactMethod", "mainWindow"]) {
    excludes(shrines, forbidden, `友宮主檔不應保留單一聯絡欄位 ${forbidden}`);
  }
  for (const expected of ["export type ShrineContact", "methods: ContactMethod[]", "shrineContactExamples"]) {
    includes(read("src/lib/domainModel.ts"), expected, `友宮聯絡人多筆模型缺少 ${expected}`);
  }
  for (const expected of ["電話", "手機", "LINE", "Email"]) {
    includes(adminSettings, expected, `聯絡方式主檔缺少 ${expected}`);
  }

  for (const expected of ["帳務日期", "採購單編號", "實際金額", "數量", "品項", "付款狀態"]) {
    includes(ledger, expected, `帳務管理缺少 ${expected}`);
  }

  includes(documents, "文件日期", "公文紀錄需有文件日期");

  for (const expected of ["主任委員", "副主任委員", "總幹事", "財務", "會計", "出納", "委員", "志工", "系統管理者", "一般工作人員", "其他"]) {
    includes(adminSettings, expected, `團隊管理職稱主檔缺少 ${expected}`);
  }
  includes(team, "masterDataCatalogs.teamRoles", "團隊管理職稱需由設定主檔提供");
}

function auditMockAndApiDisplay() {
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const domainModel = read("src/lib/domainModel.ts");

  for (const expected of ["承辦人員", "建立日期", "手機號碼", "帳務日期", "付款狀態"]) {
    includes(mockRecords, expected, `demo / 詳情資料缺少 ${expected}`);
  }
  includes(read("src/lib/domainModel.ts"), "methods: ContactMethod[]", "友宮聯絡方式需由聯絡人清單承接");

  includes(newRecordPanel, "善信相關紀錄", "新增善信頁需提供相關紀錄區塊");
  includes(domainModel, "devoteeRelatedRecordExamples", "善信往來資料需由相關紀錄模型承接");
  includes(recordService, "policy.showDueDate", "API mode 需依模組 policy 決定是否顯示預計完成日");
  includes(recordService, 'key: "dataStatus"', "API mode 編輯頁需保留資料狀態控制");
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
