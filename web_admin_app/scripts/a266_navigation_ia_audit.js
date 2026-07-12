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

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `找不到區塊起點：${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end > start, `找不到區塊終點：${endMarker}`);
  return source.slice(start, end);
}

function auditNavigation() {
  const navigation = read("src/lib/navigation.ts");
  const admin = section(navigation, "const adminNavGroups", "const staffNavGroups");
  const staff = section(navigation, "const staffNavGroups", "const devoteeNavGroups");
  const devotee = navigation.slice(navigation.indexOf("const devoteeNavGroups"));

  for (const forbidden of ["資料主檔", "權限與系統治理", "系統治理"]) {
    excludes(admin, forbidden, `管理者主選單不應使用 ${forbidden}`);
    excludes(staff, forbidden, `廟方人員主選單不應使用 ${forbidden}`);
  }

  for (const expected of ["常用", "日常作業", "對外發布", "管理者設定"]) {
    includes(admin, expected, `管理者選單缺少 ${expected}`);
  }
  for (const expected of ["常用", "日常作業", "對外發布"]) {
    includes(staff, expected, `廟方人員選單缺少 ${expected}`);
  }

  includes(admin, "基礎資料設定", "基礎資料設定需在管理者設定中");
  includes(admin, "類別 / 標籤", "類別 / 標籤需在管理者設定中");
  const publishing = section(admin, 'title: "對外發布"', 'title: "管理者設定"');
  excludes(publishing, "類別 / 標籤", "類別 / 標籤不得放在對外發布");
  excludes(publishing, "基礎資料設定", "基礎資料設定不得放在對外發布");
  excludes(publishing, "發布管道設定", "發布管道設定不得放在對外發布");

  for (const forbidden of ["權限設定", "基礎資料設定", "操作紀錄", "測試資料說明", "procurements", "ledger", "documents", "team"]) {
    excludes(devotee, forbidden, `善信不應看到 ${forbidden}`);
  }
}

function auditUserFacingWording() {
  const userFacingFiles = [
    "src/components/AppShell.tsx",
    "src/components/DetailActionPanel.tsx",
    "src/components/PermissionBadge.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/data/mockRecords.ts",
    "src/data/mockUser.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/lib/navigation.ts",
    "src/lib/permissions.ts",
    "src/routes/DashboardPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];
  const combined = userFacingFiles.map((file) => read(file)).join("\n");

  for (const forbidden of [
    "測試角色切換",
    "目前測試身份",
    "測試身份",
    "測試資料狀態",
    "系統治理",
    "LINE 綁定示意",
    "domain model",
    "API",
    "fields_json",
    "tags_json",
    "module_key",
    "raw status",
    "production browser",
    "smoke test",
    "diagnostic",
    "A23F3",
    "A23F5",
    "自動驗證",
    "資料主檔",
    "權限與系統治理",
  ]) {
    excludes(combined, forbidden, `使用者可見文字不應包含 ${forbidden}`);
  }

  includes(combined, "目前身分", "目前登入身分需使用低干擾使用者語意");
  excludes(combined, "切換不同身份，查看各角色可見畫面。", "角色切換不應顯示測試工具說明");
  excludes(combined, "測試模式", "使用者畫面不應顯示測試模式");
  excludes(combined, "模擬身份", "使用者畫面不應顯示模擬身份");
}

function auditSettings() {
  const settings = read("src/routes/SettingsPage.tsx");
  for (const expected of ["管理者設定總覽", "設定權限", "管理團隊", "管理類別 / 標籤", "設定基礎資料", "查看操作紀錄", "設定發布管道"]) {
    includes(settings, expected, `SettingsPage 缺少 ${expected}`);
  }
  excludes(settings, "<button type=\"button\">管理</button>", "設定卡片不應全部使用管理按鈕");
  excludes(settings, "測試資料說明", "測試資料說明不應作為一般設定入口");
}

function auditLayout() {
  const styles = read("src/styles.css");
  for (const expected of ["flex-wrap: wrap;", "flex: 0 1 360px;", "font-size: 0.86rem;", "max-width: 1440px;"]) {
    includes(styles, expected, `layout 缺少 ${expected}`);
  }
}

function main() {
  auditNavigation();
  auditUserFacingWording();
  auditSettings();
  auditLayout();

  console.log(JSON.stringify({
    ok: true,
    audits: ["navigation IA", "user-facing wording", "settings actions", "layout"],
  }));
}

main();
