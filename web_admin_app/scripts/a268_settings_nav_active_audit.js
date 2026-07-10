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

function auditAppShellActiveState() {
  const appShell = read("src/components/AppShell.tsx");

  includes(appShell, "const routeIsActive", "AppShell 需有 routeIsActive 精準判斷");
  includes(appShell, "route.split(\"?\")", "routeIsActive 需拆分 pathname 與 query");
  includes(appShell, "new URLSearchParams(search)", "routeIsActive 需比較設定子頁 query");
  includes(appShell, "new URLSearchParams(location.search)", "routeIsActive 需讀取目前 location.search");
  includes(appShell, "currentParams.get(key) !== value", "routeIsActive 需逐一比對 section 值");
  includes(appShell, "currentParams.toString() === expectedParams.toString()", "routeIsActive 需避免 /settings 子頁全部 active");
  includes(appShell, "aria-current={isActive ? \"page\" : undefined}", "active item 需有明確 aria-current");
  includes(appShell, "className={isActive ? \"active\" : undefined}", "route item className 需使用精準 active state");
  includes(appShell, "item.route.startsWith(\"/settings\")", "settings 子頁權限判斷需涵蓋 query route");
  excludes(appShell, "<NavLink key={`${group.title}-${item.label}`} to={item.route}>{item.label}</NavLink>", "settings route 不可再使用只看 pathname 的 NavLink 預設 active");
}

function auditSettingsRoutes() {
  const navigation = read("src/lib/navigation.ts");
  for (const expected of [
    'route: "/settings?section=team"',
    'route: "/settings?section=permissions"',
    'route: "/settings?section=categories-tags"',
    'route: "/settings?section=basic-data"',
    'route: "/settings?section=publish-channels"',
    'route: "/settings?section=audit-log"',
  ]) {
    includes(navigation, expected, `管理者設定選單缺少精準子頁 route：${expected}`);
  }
}

function auditStateStyles() {
  const styles = read("src/styles.css");
  includes(styles, ".nav-list a:hover", "需定義 hover 狀態");
  includes(styles, ".nav-list a:focus-visible", "需定義鍵盤 focus 狀態");
  includes(styles, ".nav-list a.active", "需定義 active 狀態");
  excludes(styles, ".nav-list a.active,\n.nav-list a:hover", "active 與 hover 不應共用同一個反白樣式");
}

function main() {
  auditAppShellActiveState();
  auditSettingsRoutes();
  auditStateStyles();

  console.log(JSON.stringify({
    ok: true,
    audits: ["settings nav active state", "query route matching", "hover focus active styles"],
  }));
}

main();
