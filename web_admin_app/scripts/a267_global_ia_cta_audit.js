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

  for (const expected of ["常用", "日常作業", "對外發布", "管理者設定"]) {
    includes(admin, expected, `管理者選單缺少 ${expected}`);
  }
  for (const expected of ["常用", "日常作業", "對外發布"]) {
    includes(staff, expected, `廟方人員選單缺少 ${expected}`);
  }
  for (const expected of ["對外資訊", "我的資料"]) {
    includes(devotee, expected, `善信選單缺少 ${expected}`);
  }

  const adminDaily = section(admin, 'title: "日常作業"', 'title: "對外發布"');
  for (const expected of ["devotees", "shrines", "visits", "procurements", "ledger", "documents"]) {
    includes(adminDaily, `key: "${expected}"`, `管理者日常作業缺少 ${expected}`);
  }

  const staffDaily = section(staff, 'title: "日常作業"', 'title: "對外發布"');
  for (const expected of ["devotees", "shrines", "visits", "procurements", "ledger", "documents"]) {
    includes(staffDaily, `key: "${expected}"`, `廟方人員日常作業缺少 ${expected}`);
  }

  const adminPublishing = section(admin, 'title: "對外發布"', 'title: "管理者設定"');
  includes(adminPublishing, 'label: "發布內容"', "對外發布缺少發布內容");
  includes(adminPublishing, 'label: "活動消息"', "對外發布缺少活動消息");
  for (const forbidden of ["權限設定", "團隊管理", "基礎資料設定", "發布管道設定", "操作紀錄"]) {
    excludes(adminPublishing, forbidden, `對外發布不得包含 ${forbidden}`);
  }

  const adminSettings = admin.slice(admin.indexOf('title: "管理者設定"'));
  for (const expected of ["team", "權限設定", "類別 / 標籤", "基礎資料設定", "發布管道設定", "操作紀錄"]) {
    includes(adminSettings, expected, `管理者設定缺少 ${expected}`);
  }

  for (const forbidden of ["權限設定", "團隊管理", "基礎資料設定", "發布管道設定", "操作紀錄", "procurements", "ledger", "documents", "shrines", "visits"]) {
    excludes(devotee, forbidden, `善信選單不應包含 ${forbidden}`);
  }
}

function auditSettingsRoutes() {
  const settings = read("src/routes/SettingsPage.tsx");
  for (const expected of [
    'route: "/settings?section=permissions"',
    'route: "/settings?section=categories"',
    'route: "/settings?section=basic-data"',
    'route: "/settings?section=publishing-channels"',
    'route: "/settings?section=audit"',
    "<Link to={item.route}",
    'className="setting-action"',
  ]) {
    includes(settings, expected, `管理者設定缺少可進入的子頁設定：${expected}`);
  }

  excludes(settings, "<button type=\"button\">管理</button>", "管理者設定不得使用無反應管理按鈕");
  excludes(settings, "發布設定說明", "發布設定說明不應佔用一般設定頁");
  excludes(settings, "登入與帳號連結準備", "登入與帳號連結準備不應佔用一般設定頁");
  excludes(settings, "測試資料說明", "測試資料說明不應佔用一般設定頁");
  excludes(settings, "後續規劃", "後續規劃不應佔用一般設定頁");
  excludes(settings, "不會真正發布", "設定頁不應顯示過渡說明");
}

function auditVisibleWording() {
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
    "測試工具",
    "模擬身份",
    "測試模式",
    "測試資料說明",
    "發布設定說明",
    "登入與帳號連結準備",
    "後續規劃",
    "目前只做",
    "畫面準備",
    "不會真正發布",
    "LINE 綁定示意",
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
    "domain model",
    "系統治理",
  ]) {
    excludes(combined, forbidden, `使用者畫面不應包含 ${forbidden}`);
  }

  includes(combined, "身份檢視", "角色切換需降為低干擾身份檢視");
}

function auditCtas() {
  const files = [
    "src/components/AppShell.tsx",
    "src/components/ConfirmDialog.tsx",
    "src/components/DetailActionPanel.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];

  for (const file of files) {
    const source = read(file);
    const buttonTags = source.match(/<button[\s\S]*?>/g) ?? [];
    for (const tag of buttonTags) {
      assert(
        tag.includes("onClick=") || tag.includes("type=\"submit\""),
        `${file} 有按鈕缺少 onClick 或 submit 行為：${tag.replace(/\s+/g, " ")}`,
      );
    }

    const linkTags = source.match(/<Link[\s\S]*?>/g) ?? [];
    for (const tag of linkTags) {
      assert(tag.includes("to="), `${file} 有 Link 缺少 to：${tag.replace(/\s+/g, " ")}`);
    }
  }
}

function main() {
  auditNavigation();
  auditSettingsRoutes();
  auditVisibleWording();
  auditCtas();

  console.log(JSON.stringify({
    ok: true,
    audits: ["global navigation IA", "settings subpages", "visible wording", "CTA handlers"],
  }));
}

main();
