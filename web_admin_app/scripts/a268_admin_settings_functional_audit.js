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

function auditSubpages() {
  const settings = read("src/routes/SettingsPage.tsx");
  const navigation = read("src/lib/navigation.ts");

  for (const expected of [
    '"team"',
    '"permissions"',
    '"categories-tags"',
    '"basic-data"',
    '"publish-channels"',
    '"audit-log"',
    'route: "/settings?section=team"',
    'route: "/settings?section=permissions"',
    'route: "/settings?section=categories-tags"',
    'route: "/settings?section=basic-data"',
    'route: "/settings?section=publish-channels"',
    'route: "/settings?section=audit-log"',
  ]) {
    includes(settings + navigation, expected, `管理者設定子頁缺少 ${expected}`);
  }

  for (const expected of [
    "TeamSettingsPanel",
    "PermissionsPanel",
    "CategoriesTagsPanel",
    "BasicDataPanel",
    "PublishingChannelsPanel",
    "AuditLogPanel",
  ]) {
    includes(settings, expected, `SettingsPage 缺少工作區元件 ${expected}`);
  }
}

function auditFunctionalElements() {
  const settings = read("src/routes/SettingsPage.tsx");

  for (const expected of [
    "<button",
    "<input",
    "<table",
    "type=\"checkbox\"",
    "useState",
    "onClick",
    "onChange",
    "setNotice",
    "InlineAddControl",
    "SettingItemList",
  ]) {
    includes(settings, expected, `設定頁缺少可操作元素：${expected}`);
  }

  excludes(settings, "<button type=\"button\">管理</button>", "設定頁不得使用無反應管理按鈕");
}

function auditBasicData() {
  const model = read("src/data/adminSettings.ts");
  for (const expected of ["善信類型", "友宮分類", "採購類別", "帳務類別", "資料狀態", "處理狀態", "發布狀態"]) {
    includes(model, expected, `基礎資料設定缺少 ${expected}`);
  }
}

function auditCategoriesTags() {
  const model = read("src/data/adminSettings.ts");
  const settings = read("src/routes/SettingsPage.tsx");
  for (const expected of ["類別管理", "標籤管理", "善信類別", "採購類別", "發布類別", "帳務類別", "合併標籤", "啟用 / 停用"]) {
    includes(model + settings, expected, `類別 / 標籤工作區缺少 ${expected}`);
  }
}

function auditPublishingChannels() {
  const model = read("src/data/adminSettings.ts");
  for (const expected of ["網站", "LINE 官方帳號", "LINE VOOM", "Facebook", "公告欄列印", "內部備查", "尚未串接", "草稿準備", "內部可用"]) {
    includes(model, expected, `發布管道設定缺少 ${expected}`);
  }
}

function auditPermissionsAndTeam() {
  const model = read("src/data/adminSettings.ts");
  const settings = read("src/routes/SettingsPage.tsx");
  for (const expected of ["團隊成員", "初審", "覆核", "核准", "可發布", "可封存", "可設定發布管道", "管理者", "先有團隊成員，再授予模組權限"]) {
    includes(model + settings, expected, `權限設定缺少 ${expected}`);
  }
  for (const expected of ["職稱", "任期", "可指派", "權限摘要", "帳號連結", "主任委員", "總幹事", "財務", "志工"]) {
    includes(model + settings, expected, `團隊管理缺少 ${expected}`);
  }
}

function auditLog() {
  const model = read("src/data/adminSettings.ts");
  const settings = read("src/routes/SettingsPage.tsx");
  for (const expected of ["操作時間", "操作人員", "動作", "模組", "狀態", "備註", "目前尚無操作紀錄。"]) {
    includes(model + settings, expected, `操作紀錄工作區缺少 ${expected}`);
  }
}

function auditForbiddenWording() {
  const files = [
    "src/components/AppShell.tsx",
    "src/components/DetailActionPanel.tsx",
    "src/components/PermissionBadge.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/data/adminSettings.ts",
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
  const combined = files.map((file) => read(file)).join("\n");

  for (const forbidden of [
    "發布設定說明",
    "登入與帳號連結準備",
    "測試資料說明",
    "後續規劃",
    "目前只做",
    "畫面準備",
    "不會真正發布",
    "未來會",
    "LINE 綁定示意",
    "API",
    "fields_json",
    "tags_json",
    "module_key",
    "raw status",
    "smoke test",
    "diagnostic",
    "A23F3",
    "A23F5",
    "自動驗證",
    "domain model",
    "系統治理",
  ]) {
    excludes(combined, forbidden, `使用者畫面不應包含 ${forbidden}`);
  }
}

function main() {
  auditSubpages();
  auditFunctionalElements();
  auditBasicData();
  auditCategoriesTags();
  auditPublishingChannels();
  auditPermissionsAndTeam();
  auditLog();
  auditForbiddenWording();

  console.log(JSON.stringify({
    ok: true,
    audits: ["admin settings subpages", "functional controls", "settings data", "visible wording"],
  }));
}

main();
