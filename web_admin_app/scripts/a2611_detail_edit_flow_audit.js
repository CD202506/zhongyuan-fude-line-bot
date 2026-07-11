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

function auditDateFormatting() {
  const dateFormat = read("src/lib/dateFormat.ts");
  const recordService = read("src/services/recordService.ts");
  const newRecordPanel = read("src/components/NewRecordPanel.tsx");
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const adminSettings = read("src/data/adminSettings.ts");

  includes(dateFormat, "formatTaiwanDate", "需建立民國日期 formatter");
  includes(dateFormat, "year - 1911", "日期 formatter 需轉民國年");
  includes(dateFormat, "年 ${month} 月 ${day} 日", "日期 formatter 需輸出年月日");
  includes(recordService, "formatDisplayDate", "API / 列表 / 詳情顯示需使用民國日期 formatter");
  includes(newRecordPanel, "目前顯示：{formatDisplayDate", "新增日期輸入需顯示民國日期輔助文字");
  includes(detailPage, "目前顯示：{formatDisplayDate", "編輯日期輸入需顯示民國日期輔助文字");
  excludes(adminSettings, "2026/07/08", "操作紀錄不應顯示西元日期");
}

function auditDetailEditFlow() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const detailActionPanel = read("src/components/DetailActionPanel.tsx");
  const newRecordPage = read("src/routes/NewRecordPage.tsx");

  excludes(detailPage, "<div><span>資料狀態</span>", "詳情檢視不應在標題 badge 外重複顯示資料狀態");
  includes(detailPage, "field.key !== \"dataStatus\"", "非管理者編輯時不應顯示資料狀態欄位");
  includes(detailPage, "!isEditing && record.note", "編輯模式已有備註欄位時，不應再顯示備註區塊");
  includes(detailPage, "!isEditing && relatedRecordItems.length > 0", "相關紀錄需有內容且非編輯模式才顯示查詢區");
  includes(detailPage, "related-record-actions", "相關紀錄需是可操作查詢按鈕");
  includes(detailPage, "setActiveRelatedRecord(item)", "點擊相關紀錄需有可見狀態變化");
  includes(detailPage, "本人資料確認", "善信本人頁面需使用本人資料確認語意");
  includes(newRecordPage, "本人資料確認", "善信不能新增時需使用本人資料確認語意");
  includes(detailActionPanel, 'if (role === "viewer")', "善信本人不應顯示管理者操作卡");
  includes(detailActionPanel, "return null", "善信本人不應看到編輯或封存操作");
}

function auditTeamAssigneeSource() {
  const adminSettings = read("src/data/adminSettings.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const newRecordFields = read("src/data/newRecordFields.ts");
  const recordService = read("src/services/recordService.ts");

  includes(adminSettings, "assignableTeamMemberNames", "團隊管理需匯出可指派成員名單");
  includes(domainModel, "eligibleMembers: assignableTeamMemberNames", "承辦 / 維護人員需來自團隊管理可指派名單");
  includes(newRecordFields, "assigneeSemantics.eligibleMembers", "新增表單承辦欄位需使用團隊可指派名單");
  includes(recordService, "assigneeSemantics.eligibleMembers", "API mode 編輯承辦欄位需保留團隊可指派名單");
  includes(recordService, "assignableTeamMemberOptions", "API mode 友宮資料維護人員需支援團隊成員 value / label 選項");
}

function auditHeaderAndRoleNoise() {
  const appShell = read("src/components/AppShell.tsx");

  excludes(appShell, "<span className=\"eyebrow\">中原福德宮 Web 後台</span>", "頁首不應每頁重複顯示系統名稱");
  excludes(appShell, "<span>{currentModule.boundary}</span>", "頁首不應突出顯示模組分類文字");
  excludes(appShell, "身份檢視", "角色工具不應顯示身份檢視大標題");
  excludes(appShell, "切換不同身份", "角色工具不應顯示測試切換說明");
  includes(appShell, "目前角色：", "角色工具需維持低干擾目前角色顯示");
}

function auditDevoteeOptionalFields() {
  const newRecordFields = read("src/data/newRecordFields.ts");
  const mockRecords = read("src/data/mockRecords.ts");
  const recordService = read("src/services/recordService.ts");
  const listPage = read("src/routes/ModuleListPage.tsx");
  const devoteesStart = newRecordFields.indexOf("  devotees: [");
  const devoteesEnd = newRecordFields.indexOf("  shrines: [", devoteesStart);
  const devotees = newRecordFields.slice(devoteesStart, devoteesEnd);

  for (const expected of ["手機號碼", "地址", "性別", "年齡級距", "出生月 / 日"]) {
    includes(devotees, expected, `善信新增表單缺少 ${expected}`);
    includes(mockRecords, expected, `善信編輯表單缺少 ${expected}`);
    includes(recordService, expected, `API 顯示 mapping 缺少 ${expected}`);
  }

  for (const expected of ["未填寫", "14 以下", "15～24", "25～34", "35～44", "45～54", "55～64", "65 以上"]) {
    includes(devotees, expected, `年齡級距缺少 ${expected}`);
  }

  includes(read("src/components/NewRecordPanel.tsx"), "目前尚無相關紀錄時，可先只建立善信基本資料。", "善信往來紀錄預設不應強迫填寫");
  excludes(listPage, "手機號碼", "列表頁不應顯示手機號碼");
  excludes(listPage, "地址", "列表頁不應顯示地址");
  excludes(listPage, "出生月 / 日", "列表頁不應顯示出生月 / 日");
}

function auditRelatedFinanceRecords() {
  const detailPage = read("src/routes/ModuleDetailPage.tsx");
  const recordService = read("src/services/recordService.ts");
  const domainModel = read("src/lib/domainModel.ts");
  const adminSettings = read("src/data/adminSettings.ts");
  const relatedModelSources = `${domainModel}\n${adminSettings}`;

  for (const expected of ["發財金", "平安龜", "待返還", "香油錢", "善信捐款", "帳務管理", "財務往來"]) {
    includes(relatedModelSources, expected, `相關紀錄模型需支援 ${expected}`);
  }
  includes(recordService, "相關紀錄：", "列表摘要需支援多筆相關紀錄");
  includes(recordService, "待結清：", "列表摘要需支援待結清相關紀錄");

  includes(detailPage, 'detailedRecord.category === "財務往來"', "金流類相關紀錄需有判斷");
  includes(detailPage, 'module: "帳務管理"', "金流類相關紀錄需指向帳務管理");
  includes(detailPage, "查看帳務紀錄", "金流類相關紀錄需有查看帳務紀錄 action");
  includes(detailPage, "<dl>", "相關紀錄查詢面板需顯示結構化欄位");
}

function auditVisibleEngineeringText() {
  const combined = [
    "src/components/AppShell.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
  ].map((file) => read(file)).join("\n");

  for (const forbidden of ["testRun", "automatedTest", "fields_json", "tags_json", "module_key", "raw status", "smoke test", "diagnostic"]) {
    if (forbidden === "testRun" || forbidden === "automatedTest" || forbidden === "fields_json" || forbidden === "tags_json" || forbidden === "module_key") {
      includes(read("src/services/recordService.ts"), "hiddenDetailFieldKeys", "工程欄位需由 mapper 隱藏");
      continue;
    }
    excludes(combined, forbidden, `使用者可見文字不應包含 ${forbidden}`);
  }
}

function main() {
  auditDateFormatting();
  auditDetailEditFlow();
  auditTeamAssigneeSource();
  auditHeaderAndRoleNoise();
  auditDevoteeOptionalFields();
  auditRelatedFinanceRecords();
  auditVisibleEngineeringText();

  console.log(JSON.stringify({
    ok: true,
    audits: ["date formatting", "detail edit flow", "team assignee source", "header noise", "devotee optional fields", "related finance records", "engineering text"],
  }));
}

main();
