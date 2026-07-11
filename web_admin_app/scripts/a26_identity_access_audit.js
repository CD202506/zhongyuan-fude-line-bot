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

  includes(appShell, "目前角色：", "右上角色工具需以低干擾目前角色呈現");
  includes(identity, "正式版將依登入帳號與權限顯示，不能自行切換。", "需說明正式版不能自行切換");
  includes(appShell, "aria-label=\"角色切換\"", "角色切換輔助標籤需是低干擾角色語意");
  excludes(appShell, "測試角色切換", "右上不應使用過度突出的測試角色切換文字");
  excludes(appShell, "目前測試身份", "右上不應使用目前測試身份文字");
  excludes(appShell, "LINE 綁定示意", "右上不應顯示 LINE 綁定示意");
  excludes(appShell, "身份檢視", "右上不應使用大面積身份檢視標題");
  excludes(appShell, "切換不同身份，查看各角色可見畫面。", "右上不應顯示測試工具說明");
}

function auditAdminSettings() {
  const settings = read("src/routes/SettingsPage.tsx");
  const navigation = read("src/lib/navigation.ts");

  includes(settings, "權限會以團隊成員為先決條件", "管理者設定需說明團隊成員是權限先決條件");
  includes(settings, "團隊成員是權限設定的先決條件。", "需說明團隊成員是權限先決條件");
  includes(settings, "初審、覆核、核准是權限標記，不強制作業卡關。", "審核概念應只是標記，不強制卡關");
  excludes(settings, "登入與帳號連結準備", "帳號連結準備不應佔用一般設定主畫面");

  const staffSection = navigation.slice(navigation.indexOf("const staffNavGroups"), navigation.indexOf("const devoteeNavGroups"));
  excludes(staffSection, "權限設定", "廟方人員不應看到全域權限設定入口");

  const devoteeSection = navigation.slice(navigation.indexOf("const devoteeNavGroups"));
  for (const forbidden of ["權限設定", "團隊管理", "team", "settings", "採購管理", "帳務管理", "公文 / 通知"]) {
    excludes(devoteeSection, forbidden, `善信不應看到內部管理入口：${forbidden}`);
  }
}

function auditRoleSpecificDisplay() {
  const dashboard = read("src/routes/DashboardPage.tsx");

  includes(dashboard, "目前檢視善信畫面", "善信 Dashboard 需以低干擾身份檢視說明本人資料範圍");
  includes(dashboard, "正式版會依登入帳號顯示本人資料", "善信需看到正式版身份來源說明");
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
