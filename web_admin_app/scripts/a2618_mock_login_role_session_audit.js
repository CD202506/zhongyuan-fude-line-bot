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

function auditMockIdentityModel() {
  const identity = read("src/lib/identity.ts");
  const roleContext = read("src/lib/roleContext.tsx");
  const mockUser = read("src/data/mockUser.ts");

  for (const expected of ["identityId", "displayName", "displayRole", "devoteeId", "teamMemberId", "linkedLineUser", "modulePermissions", "isTestMode"]) {
    includes(identity, expected, `MockIdentity 缺少 ${expected}`);
  }
  for (const expectedRole of ["王主委", "陳幹事", "林善信"]) {
    includes(identity, expectedRole, `測試登入缺少身分：${expectedRole}`);
  }
  includes(mockUser, '["admin", "staff", "viewer"]', "測試登入需保留三種角色");
  includes(roleContext, "sessionStorage.setItem(sessionKey, role)", "測試登入需使用 sessionStorage");
  includes(roleContext, "sessionStorage.removeItem(sessionKey)", "登出需清除 sessionStorage");
  includes(roleContext, "identity?.displayRole ?? \"viewer\"", "role 需由目前登入身分決定");

  for (const forbidden of ["localStorage", "document.cookie", "accessToken", "refreshToken", "idToken", "OAuth", "LIFF"]) {
    excludes(roleContext + identity, forbidden, `測試登入不得建立正式登入或 token：${forbidden}`);
  }
}

function auditLoginRouteAndTopbar() {
  const app = read("src/App.tsx");
  const testLogin = read("src/routes/TestLoginPage.tsx");
  const appShell = read("src/components/AppShell.tsx");

  includes(app, "path=\"/test-login\"", "需有 /test-login route");
  includes(app, "<RoleProvider>", "全站需使用 RoleProvider");
  includes(testLogin, "以此身分登入", "登入頁需提供明確前端登入 CTA");
  includes(testLogin, "未連接 LINE 或 Google 登入", "測試登入需明確說明不是正式登入");
  includes(testLogin, "只保留在本次瀏覽器測試", "登入頁應說明目前身分只在前端測試期間保留");
  includes(testLogin, "已建立測試資料", "登入頁不得直接顯示內部身分 ID");
  includes(testLogin, "已連結團隊成員", "登入頁需以一般文字說明團隊連結");
  excludes(testLogin, "{item.devoteeId}", "登入頁不得直接顯示善信內部 ID");
  excludes(testLogin, "item.teamMemberId ??", "登入頁不得直接顯示團隊內部 ID");
  includes(appShell, "identity.displayName", "右上角需顯示目前登入者姓名");
  includes(appShell, "permissionLabel(role)", "右上角需顯示目前身分");
  includes(appShell, "onClick={logout}", "右上角需提供登出");
  includes(appShell, "<Navigate to=\"/test-login\" replace />", "未登入應導向測試登入");

  for (const forbidden of [
    "測試角色切換",
    "切換不同身份",
    "角色切換按鈕",
    "loginAs(\"admin\")",
    "loginAs(\"staff\")",
    "loginAs(\"viewer\")",
  ]) {
    excludes(appShell, forbidden, `AppShell 不應保留直接角色切換：${forbidden}`);
  }
}

function main() {
  auditMockIdentityModel();
  auditLoginRouteAndTopbar();

  console.log(JSON.stringify({
    ok: true,
    audits: ["mock identity model", "sessionStorage login", "topbar logout only"],
  }));
}

main();
