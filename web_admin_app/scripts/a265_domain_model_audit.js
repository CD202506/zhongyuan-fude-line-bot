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

function auditDomainModel() {
  const domainModel = read("src/lib/domainModel.ts");
  for (const expected of ["masterData", "internalWork", "publishing", "governance"]) {
    includes(domainModel, expected, `跨模組模型缺少 ${expected}`);
  }
  for (const expected of ["類別可由管理者設定", "標籤用於輔助整理", "從可指派團隊成員中選擇"]) {
    includes(domainModel, expected, `domain model 缺少語意：${expected}`);
  }
  for (const expected of ["發布類別", "發布管道", "可見對象", "可由來源資料整理發布內容"]) {
    includes(domainModel, expected, `發布模型缺少語意：${expected}`);
  }
  for (const expected of ["使用中", "已封存", "作廢", "待確認", "處理中", "已完成", "暫緩", "草稿", "已發布", "已授權", "未授權", "取消授權"]) {
    includes(domainModel, expected, `狀態語意缺少 ${expected}`);
  }
}

function auditFieldBoundaries() {
  const fields = read("src/data/newRecordFields.ts");
  const team = sectionBetween(fields, "  team: [", "  ledger: [");
  const devotees = sectionBetween(fields, "  devotees: [", "  shrines: [");
  const shrines = sectionBetween(fields, "  shrines: [", "  visits: [");
  const publishing = sectionBetween(fields, "  announcements: [", "  procurements: [");

  for (const forbidden of ["承辦人員", "關聯標籤", "預計完成日", "採購類別", "帳務類別"]) {
    excludes(team, forbidden, `團隊管理不應出現 ${forbidden}`);
  }
  for (const expected of ["LINE 綁定狀態示意", "任期 / 備註", "是否啟用", "系統權限"]) {
    includes(team, expected, `團隊管理缺少 ${expected}`);
  }

  for (const forbidden of ["預計完成日", "關聯標籤", "工程式 tag"]) {
    excludes(devotees, forbidden, `善信管理不應出現 ${forbidden}`);
  }
  for (const expected of ["善信類型", "本人資料授權", "發財金與服務紀錄", "資料維護人員", "相關紀錄"]) {
    includes(devotees, expected, `善信管理缺少 ${expected}`);
  }

  for (const forbidden of ["預計完成日", "關聯標籤"]) {
    excludes(shrines, forbidden, `友宮管理不應出現 ${forbidden}`);
  }
  for (const expected of ["聯絡人", "聯絡電話", "地址", "主要聯絡窗口", "相關紀錄"]) {
    includes(shrines, expected, `友宮管理缺少 ${expected}`);
  }

  for (const expected of ["來源資料", "發布類別", "發布管道", "可見對象", "公開內容", "內部備註", "發布狀態"]) {
    includes(publishing, expected, `內容發布欄位缺少 ${expected}`);
  }
  includes(publishing, "publishingSemantics.sourceNote", "內容發布欄位需引用來源資料不會自動公開的說明");
}

function auditNavigationAndSettings() {
  const navigation = read("src/lib/navigation.ts");
  const settings = read("src/routes/SettingsPage.tsx");
  const modules = read("src/data/modules.ts");

  for (const expected of ["日常作業", "對外發布", "管理者設定"]) {
    includes(navigation, expected, `左側選單缺少 ${expected}`);
  }
  for (const expected of ["發布內容", "活動消息"]) {
    includes(navigation, expected, `對外發布選單缺少 ${expected}`);
  }
  const adminSection = navigation.slice(navigation.indexOf("const adminNavGroups"), navigation.indexOf("const staffNavGroups"));
  const publishingSection = sectionBetween(adminSection, 'title: "對外發布"', 'title: "管理者設定"');
  const settingsSection = adminSection.slice(adminSection.indexOf('title: "管理者設定"'));
  excludes(publishingSection, "發布管道設定", "發布管道設定應歸管理者設定");
  includes(settingsSection, "發布管道設定", "管理者設定需包含發布管道設定");
  includes(modules, "公文紀錄為文件留存；通知發布需由承辦人整理部分內容後進入發布內容。", "公文 / 通知需區分內部留存與通知發布");
  includes(modules, "由來源資料整理發布草稿", "公告 route 需收斂成發布語意");

  for (const expected of ["類別 / 標籤", "基礎資料設定", "發布管道設定", "操作紀錄", "settingSections"]) {
    includes(settings, expected, `管理者設定缺少 ${expected}`);
  }
  excludes(settings, "不會真正發布", "設定頁不應顯示過渡說明");
}

function auditVisibleWording() {
  const userFacingFiles = [
    "src/components/AppShell.tsx",
    "src/components/NewRecordPanel.tsx",
    "src/data/mockRecords.ts",
    "src/data/modules.ts",
    "src/data/newRecordFields.ts",
    "src/lib/domainModel.ts",
    "src/routes/DashboardPage.tsx",
    "src/routes/ModuleDetailPage.tsx",
    "src/routes/ModuleListPage.tsx",
    "src/routes/NewRecordPage.tsx",
    "src/routes/SettingsPage.tsx",
  ];
  const combined = userFacingFiles.map((file) => read(file)).join("\n");

  for (const forbidden of ["API", "fields_json", "tags_json", "module_key", "raw status", "自動驗證", "production browser", "smoke test", "diagnostic", "A23F3", "A23F5"]) {
    excludes(combined, forbidden, `使用者可見文字不應包含 ${forbidden}`);
  }
  excludes(combined, "公文 / 通知", "不應再把公文 / 通知當成未解釋的同級模組語意");
}

function auditLayout() {
  const styles = read("src/styles.css");
  for (const expected of ["max-width: 1440px;", "flex-wrap: wrap;", "minmax(300px, 360px)", "grid-template-columns: 320px minmax(0, 1fr);", "@media (max-width: 759px)"]) {
    includes(styles, expected, `layout 缺少 ${expected}`);
  }
}

function main() {
  auditDomainModel();
  auditFieldBoundaries();
  auditNavigationAndSettings();
  auditVisibleWording();
  auditLayout();

  console.log(JSON.stringify({
    ok: true,
    audits: ["domain model", "field boundaries", "navigation and settings", "visible wording", "layout"],
  }));
}

main();
