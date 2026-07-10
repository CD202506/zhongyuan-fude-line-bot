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

function auditSidebarToggleBehavior() {
  const appShell = read("src/components/AppShell.tsx");

  for (const expected of [
    "openGroupKeys",
    "setOpenGroupKeys",
    "activeGroupTitle",
    "navItemIsActive",
    "toggleGroup",
    "aria-expanded={isOpen}",
    "className=\"nav-group-toggle\"",
    "className=\"nav-group-items\"",
    "{isOpen ? \"▼\" : \"▶\"}",
    "location.pathname",
    "location.search",
  ]) {
    includes(appShell, expected, `sidebar section toggle 缺少 ${expected}`);
  }

  includes(appShell, "current.has(activeGroupKey) ? current : new Set(current).add(activeGroupKey)", "active item 所在分類需自動展開");
  includes(appShell, "next.delete(groupKey)", "使用者需可手動收合分類");
  includes(appShell, "item.route.startsWith(\"/settings\")", "settings 子頁權限判斷需維持");
  includes(appShell, "currentParams.get(key) !== value", "settings 子頁 active state 需精準比對 query");
  includes(appShell, "aria-current={isActive ? \"page\" : undefined}", "active item 需保留 aria-current");
  excludes(appShell, "<span>{group.title}</span>\n                {group.items.map", "分類標題不應只是靜態文字");
}

function auditNavigationSections() {
  const navigation = read("src/lib/navigation.ts");
  for (const expected of ["常用", "日常作業", "對外發布", "管理者設定", "對外資訊", "我的資料"]) {
    includes(navigation, expected, `navigation 缺少需可展開 / 收合的分類：${expected}`);
  }
}

function auditStyles() {
  const styles = read("src/styles.css");
  for (const expected of [
    ".nav-group-toggle",
    ".nav-group-toggle:hover",
    ".nav-group-toggle:focus-visible",
    ".nav-group-items",
    "grid-template-columns: repeat(2, minmax(0, 1fr));",
    "grid-template-columns: 1fr;",
  ]) {
    includes(styles, expected, `sidebar section 樣式缺少 ${expected}`);
  }

  excludes(styles, ".nav-list a.active,\n.nav-list a:hover", "active 與 hover 不應共用同一反白樣式");
}

function main() {
  auditSidebarToggleBehavior();
  auditNavigationSections();
  auditStyles();

  console.log(JSON.stringify({
    ok: true,
    audits: ["sidebar section toggle", "active group default open", "settings active state preserved", "responsive sidebar styles"],
  }));
}

main();
