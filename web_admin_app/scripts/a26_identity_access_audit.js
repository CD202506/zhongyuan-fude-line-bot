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

function auditIdentityModel() {
  const identity = read("src/lib/identity.ts");
  const requiredFields = [
    "currentUser",
    "userId",
    "displayName",
    "role",
    "staffMemberId",
    "devoteeId",
    "linkedLineUser",
    "permissionSet",
    "modulePermissions",
    "isTestMode",
    "isLineLinked",
  ];

  for (const field of requiredFields) {
    includes(identity, field, `identity config 缺少 ${field}`);
  }

  includes(identity, "linked-to-staff", "需示意 LINE 可連到團隊成員");
  includes(identity, "linked-to-devotee", "需示意 LINE 可連到善信資料");
  includes(identity, "not-linked", "需保留 LINE 尚未連結狀態");
  includes(identity, "初審", "需保留初審權限標記");
  includes(identity, "覆核", "需保留覆核權限標記");
  includes(identity, "核准", "需保留核准權限標記");
  assert(!/\bU[0-9a-f]{8,}\b/i.test(identity), "不得放入真實 LINE 識別格式");
}

function auditRoleSwitchWording() {
  const appShell = read("src/components/AppShell.tsx");
  const identity = read("src/lib/identity.ts");

  includes(appShell, "測試角色切換", "右上角色工具需明確標示為測試角色切換");
  includes(appShell, "目前測試身份", "右上需顯示目前測試身份");
  includes(appShell, "identityRuntime.formalModeNote", "AppShell 需顯示正式版身份說明");
  includes(identity, "正式版將依登入帳號與權限顯示，不能自行切換。", "需說明正式版不能自行切換");
  includes(appShell, "LINE 綁定示意", "需顯示 LINE 綁定示意");
  includes(appShell, "aria-label=\"測試角色切換\"", "角色切換輔助標籤也需是測試語意");
  excludes(appShell, "目前角色：", "右上不應再像正式角色顯示");
}

function auditAdminSettings() {
  const settings = read("src/routes/SettingsPage.tsx");
  const navigation = read("src/lib/navigation.ts");

  includes(settings, "權限會以團隊成員為先決條件", "管理者設定需說明團隊成員是權限先決條件");
  includes(settings, "登入與 LINE 綁定準備", "管理者設定需包含 LINE 綁定準備");
  includes(settings, "正式版將依登入帳號或 LINE 綁定身份判斷權限", "需說明正式權限依登入或 LINE 綁定身份");
  includes(settings, "LINE 帳號可連到團隊成員或善信資料", "需說明 LINE 可連團隊成員或善信資料");
  includes(settings, "善信不列入內部權限授予清單", "需明確排除善信內部權限授予");
  includes(settings, "初審、覆核、核准先作為紀錄與權限標記，不強制卡住作業流程。", "審核概念應只是標記，不強制卡關");

  const staffSection = navigation.slice(navigation.indexOf("const staffNavGroups"), navigation.indexOf("const devoteeNavGroups"));
  excludes(staffSection, "權限設定", "廟方人員不應看到全域權限設定入口");

  const devoteeSection = navigation.slice(navigation.indexOf("const devoteeNavGroups"));
  for (const forbidden of ["權限設定", "團隊管理", "team", "settings", "採購管理", "帳務管理", "公文 / 通知"]) {
    excludes(devoteeSection, forbidden, `善信不應看到內部管理入口：${forbidden}`);
  }
}

function auditRoleSpecificDisplay() {
  const dashboard = read("src/routes/DashboardPage.tsx");

  includes(dashboard, "目前測試身份：善信", "善信 Dashboard 需以測試身份說明本人資料範圍");
  includes(dashboard, "正式版會依登入帳號或 LINE 綁定身份顯示本人資料", "善信需看到正式版身份來源說明");
  includes(dashboard, "我的作業權限", "廟方人員需看到自己的權限狀態");
  includes(dashboard, "正式版依登入帳號與團隊授權顯示可處理作業", "廟方人員權限需綁定登入與團隊授權");
  excludes(dashboard, "全域權限設定", "廟方人員畫面不應出現全域授權操作");
}

function auditSensitiveText() {
  const files = [
    "src/components/AppShell.tsx",
    "src/data/mockUser.ts",
    "src/lib/identity.ts",
    "src/lib/permissions.ts",
    "src/routes/DashboardPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];
  const combined = files.map((file) => read(file)).join("\n");
  const forbidden = [
    ["sec", "ret"].join(""),
    ["to", "ken"].join(""),
    ["web", "hook"].join(""),
    "DATABASE_URL",
    "Google Sheet ID",
  ];

  for (const item of forbidden) {
    excludes(combined, item, `身份示意檔案不應包含敏感字樣：${item}`);
  }
}

function main() {
  auditIdentityModel();
  auditRoleSwitchWording();
  auditAdminSettings();
  auditRoleSpecificDisplay();
  auditSensitiveText();

  console.log(JSON.stringify({
    ok: true,
    audits: ["identity model", "test role switch wording", "admin settings", "role display", "sensitive text"],
  }));
}

main();
