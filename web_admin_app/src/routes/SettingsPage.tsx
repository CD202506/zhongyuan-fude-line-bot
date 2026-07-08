import { Link, useSearchParams } from "react-router-dom";
import { canUseAdminSettings } from "../lib/permissions";
import { useRole } from "../lib/roleContext";
import { categorySemantics, publishingSemantics, tagSemantics } from "../lib/domainModel";

type SettingSectionId = "overview" | "permissions" | "categories" | "basic-data" | "publishing-channels" | "audit";

type SettingSection = {
  id: SettingSectionId;
  title: string;
  body: string;
  action: string;
  route: string;
  items: string[];
};

const settingSections: SettingSection[] = [
  {
    id: "permissions",
    title: "權限設定",
    body: "權限會以團隊成員為先決條件；先選擇團隊成員，再授予不同作業的初審、覆核或核准權限標記。",
    action: "設定權限",
    route: "/settings?section=permissions",
    items: [
      "團隊成員是權限設定的先決條件。",
      "承辦人員由具備該作業權限的團隊成員中選擇。",
      "初審、覆核、核准是權限標記，不強制作業卡關。",
    ],
  },
  {
    id: "categories",
    title: "類別 / 標籤",
    body: "管理各作業會使用的類別與標籤，避免狀態、類別與標籤混用。",
    action: "管理類別 / 標籤",
    route: "/settings?section=categories",
    items: [
      categorySemantics.note,
      tagSemantics.note,
      "類別用於分類資料；標籤用於輔助整理與搜尋。",
    ],
  },
  {
    id: "basic-data",
    title: "基礎資料設定",
    body: "維護日常作業會用到的分類、狀態與常用選項。",
    action: "設定基礎資料",
    route: "/settings?section=basic-data",
    items: [
      "善信類型、友宮分類、採購類別與帳務類別可集中維護。",
      "處理狀態、資料狀態與發布狀態需分開管理。",
      "基礎資料不包含權限設定、發布紀錄或操作紀錄。",
    ],
  },
  {
    id: "publishing-channels",
    title: "發布管道設定",
    body: "管理對外發布可使用的管道與可見對象。",
    action: "設定發布管道",
    route: "/settings?section=publishing-channels",
    items: [
      `發布管道：${publishingSemantics.channels.join("、")}。`,
      `可見對象：${publishingSemantics.audiences.join("、")}。`,
      "發布前需確認公開內容、管道與可見對象是否正確。",
    ],
  },
  {
    id: "audit",
    title: "操作紀錄",
    body: "查看新增、編輯、封存、還原與權限標記調整紀錄。",
    action: "查看操作紀錄",
    route: "/settings?section=audit",
    items: [
      "重要資料異動需保留可追蹤紀錄。",
      "封存與還原仍保留資料紀錄。",
      "權限標記調整需能追溯操作來源。",
    ],
  },
];

function sectionFromParam(value: string | null): SettingSectionId {
  if (value === "permissions" || value === "categories" || value === "basic-data" || value === "publishing-channels" || value === "audit") {
    return value;
  }
  return "overview";
}

export function SettingsPage() {
  const { role } = useRole();
  const [searchParams] = useSearchParams();
  const sectionId = sectionFromParam(searchParams.get("section"));
  const canUse = canUseAdminSettings(role);
  const activeSection = settingSections.find((item) => item.id === sectionId);

  if (!canUse) {
    return (
      <div className="page-stack">
        <section className="content-panel module-header">
          <div>
            <span className="eyebrow">權限提醒</span>
            <h2>此頁面僅管理者可使用</h2>
            <p>目前可回到主控台查看日常資料。</p>
          </div>
          <Link to="/dashboard" className="primary-action">
            返回主控台
          </Link>
        </section>
      </div>
    );
  }

  if (activeSection) {
    return (
      <div className="page-stack">
        <section className="content-panel module-header">
          <div>
            <Link to="/settings" className="back-link">返回管理者設定</Link>
            <span className="eyebrow">管理者設定</span>
            <h2>{activeSection.title}</h2>
            <p>{activeSection.body}</p>
          </div>
        </section>

        <section className="content-panel">
          <div className="section-heading">
            <h3>{activeSection.title}</h3>
            <span>設定項目</span>
          </div>
          <div className="status-box">
            {activeSection.items.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="content-panel module-header">
        <div>
          <span className="eyebrow">管理者設定</span>
          <h2>管理者設定總覽</h2>
          <p>權限、類別、基礎資料、發布管道與操作紀錄集中管理。</p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="setting-card">
          <strong>團隊管理</strong>
          <p>維護團隊成員、宮廟職稱、任期與可使用的作業範圍。</p>
          <Link to="/team" className="setting-action">管理團隊</Link>
        </article>
        {settingSections.map((item) => (
          <article key={item.id} className="setting-card">
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <Link to={item.route} className="setting-action">{item.action}</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
