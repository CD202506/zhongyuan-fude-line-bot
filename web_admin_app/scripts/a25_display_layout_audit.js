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

function auditDisplayData() {
  const displayFiles = [
    "src/data/mockRecords.ts",
    "src/data/newRecordFields.ts",
    "scripts/a23_remote_api_smoke_test.js",
    "scripts/a23_production_browser_submit_test.js",
  ];
  const combined = displayFiles.map((file) => read(file)).join("\n");
  const recordService = read("src/services/recordService.ts");

  for (const forbidden of ["A23F3", "A23F5", "automated test", "production browser", "smoke test", "diagnostic", "test updated", "自動驗證", "測試資料更新"]) {
    excludes(combined, forbidden, `顯示資料或 smoke test 命名不應包含 ${forbidden}`);
  }

  for (const expected of ["張○○", "林○○", "陳○○", "第三方測試用匿名資料"]) {
    includes(combined, expected, `匿名測試資料需包含 ${expected}`);
  }

  includes(combined, "automatedTest", "自動測試可保留非顯示識別欄位");
  includes(recordService, "engineeringTestPattern", "前端需中和既有 staging 工程測試資料顯示");
  includes(recordService, "displayTitle", "前端需替既有 staging 工程測試資料轉成中性標題");
}

function auditSidebarLayout() {
  const appShell = read("src/components/AppShell.tsx");
  const navigation = read("src/lib/navigation.ts");
  const styles = read("src/styles.css");

  includes(appShell, "navGroupsForRole(role)", "sidebar / drawer 需共用 navigation config");
  excludes(appShell, "const adminNavGroups", "AppShell 不應另建一套 navigation");
  includes(navigation, "export function navGroupsForRole", "navigation config 應集中匯出");
  includes(appShell, "{!sidebarOpen ? (", "只在 sidebar 隱藏時顯示展開按鈕");

  includes(styles, "@media (min-width: 760px)", "桌機 layout 應有獨立規則");
  includes(styles, ".app-shell.sidebar-open {\n    grid-template-columns: 320px minmax(0, 1fr);", "桌機 sidebar 開啟時主內容需配合縮放");
  includes(styles, "position: sticky;", "桌機 sidebar 不應 overlay 遮住主內容");
  includes(styles, "@media (max-width: 759px)", "手機 layout 應有 drawer 規則");
  includes(styles, "position: fixed;", "手機 drawer 可 overlay");
  includes(appShell, "← 隱藏選單", "drawer 需有清楚關閉方式");
}

function main() {
  auditDisplayData();
  auditSidebarLayout();

  console.log(JSON.stringify({
    ok: true,
    audits: ["display data", "smoke test naming", "sidebar layout"],
  }));
}

main();
