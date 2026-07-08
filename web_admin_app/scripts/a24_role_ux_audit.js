/* global console */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(resolve(appRoot, relativePath), "utf-8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source, expected, message) {
  assert(source.includes(expected), message);
}

function assertNotIncludes(source, forbidden, message) {
  assert(!source.includes(forbidden), message);
}

function sliceFromTo(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `找不到片段起點：${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end > start, `找不到片段終點：${endMarker}`);
  return source.slice(start, end);
}

function auditNavigation() {
  const navigation = read("src/lib/navigation.ts");

  for (const expected of ["常用", "日常作業", "對外發布", "管理者設定", "權限設定", "團隊管理"]) {
    assertIncludes(navigation, expected, `管理者選單缺少 ${expected}`);
  }

  const staffSection = navigation.slice(navigation.indexOf("const staffNavGroups"), navigation.indexOf("const devoteeNavGroups"));
  assertIncludes(staffSection, "日常作業", "廟方人員選單缺少日常作業");
  assertIncludes(staffSection, "對外發布", "廟方人員選單缺少對外發布");
  assertNotIncludes(staffSection, "權限設定", "廟方人員不應有權限設定主入口");
  assertNotIncludes(staffSection, "管理者設定", "廟方人員不應有管理者設定主入口");

  const devoteeSection = navigation.slice(navigation.indexOf("const devoteeNavGroups"));
  for (const expected of ["對外資訊", "我的資料", 'key: "announcements"']) {
    assertIncludes(devoteeSection, expected, `善信選單缺少 ${expected}`);
  }
  for (const forbidden of ["procurements", "ledger", "team", "documents", "權限設定", "管理者設定", "我的參與紀錄", "發財金紀錄", "未來開放"]) {
    assertNotIncludes(devoteeSection, forbidden, `善信選單不應包含 ${forbidden}`);
  }
}

function auditDashboard() {
  const dashboard = read("src/routes/DashboardPage.tsx");
  assertIncludes(dashboard, 'if (role === "viewer")', "Dashboard 應有善信專屬分支");
  assertIncludes(dashboard, "可瀏覽對外公告 / 活動等公開內容，不進入內部廟務、採購、帳務或權限設定；個人紀錄功能將於後續版本整理。", "善信 Dashboard 應說明對外與本人紀錄範圍");
  assertNotIncludes(dashboard, "user-card", "Dashboard 不應重複顯示角色卡片，角色資訊由 AppShell 統一呈現");
  assertNotIncludes(dashboard, "目前角色：", "Dashboard 不應重複顯示目前角色");

  const devoteeBranch = sliceFromTo(dashboard, 'if (role === "viewer")', "  return (\n    <div className=\"page-stack\">");
  for (const forbidden of ["友宮數", "近期來訪", "待處理請帖", "採購待確認", "待整理公文", "帳務草稿", "維運提醒", "模組入口", "服務入口"]) {
    assertNotIncludes(devoteeBranch, forbidden, `善信 Dashboard 不應包含 ${forbidden}`);
  }
  for (const expected of ["最新公告", "近期活動", "我的資料", "公告 / 活動", "我的紀錄"]) {
    assertIncludes(devoteeBranch, expected, `善信 Dashboard 缺少 ${expected}`);
  }
}

function auditVisibleWording() {
  const userFacingFiles = [
    "src/components/AppShell.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/data/mockRecords.ts",
    "src/data/mockUser.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/lib/permissions.ts",
    "src/routes/DashboardPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];
  const serviceDisplayFiles = [
    "src/services/recordService.ts",
  ];
  const combined = [...userFacingFiles, ...serviceDisplayFiles].map((file) => read(file)).join("\n");
  const userFacingCombined = userFacingFiles.map((file) => read(file)).join("\n");

  for (const forbidden of ["檢視者", "模組邊界", "API 驗證", "API 伺服器", "API 回應", "未來開放", "raw status"]) {
    assertNotIncludes(combined, forbidden, `使用者可見文字或前端顯示層不應包含 ${forbidden}`);
  }

  for (const forbidden of ["module_key", "fields_json", "tags_json"]) {
    assertNotIncludes(userFacingCombined, forbidden, `畫面元件不應包含 ${forbidden}`);
  }

  assertIncludes(combined, "善信", "角色語意應包含善信");
  assertIncludes(combined, "資料狀態", "狀態欄位應以資料狀態呈現");
  assertIncludes(combined, "承辦人員", "負責 / 經手語意應統一為承辦人員");
}

function auditLayout() {
  const styles = read("src/styles.css");
  const appShell = read("src/components/AppShell.tsx");
  assertIncludes(styles, ".app-shell.sidebar-open", "CSS 應明確處理選單展開狀態");
  assertIncludes(styles, "grid-template-columns: 320px minmax(0, 1fr);", "桌機展開選單時主內容需配合 sidebar 寬度");
  assertIncludes(styles, "position: fixed;", "手機展開選單應以抽屜方式呈現");
  assertIncludes(styles, "position: sticky;", "桌機 sidebar 不應遮住主內容");
  assertIncludes(styles, "overflow-wrap: anywhere;", "標題需避免窄版直排或溢出");
  assertIncludes(appShell, "{!sidebarOpen ? (", "只有選單隱藏時才應顯示展開選單按鈕");
  assertIncludes(appShell, "navGroupsForRole(role)", "AppShell 應使用共用 navigation config");
  assertNotIncludes(appShell, "const adminNavGroups", "AppShell 不應內建另一套 navigation data");
}

function main() {
  auditNavigation();
  auditDashboard();
  auditVisibleWording();
  auditLayout();

  console.log(JSON.stringify({
    ok: true,
    audits: ["navigation", "dashboard", "visible wording", "sidebar layout"],
  }));
}

main();
