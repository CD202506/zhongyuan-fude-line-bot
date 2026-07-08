import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  auditLogSettings,
  basicDataGroups,
  categorySettings,
  permissionSettings,
  publishingChannelSettings,
  tagSettings,
  teamSettings,
  type BasicDataGroup,
  type CategorySetting,
  type PermissionSetting,
  type PublishingChannelSetting,
  type SettingItemState,
  type TagSetting,
  type TeamSetting,
} from "../data/adminSettings";
import { canUseAdminSettings } from "../lib/permissions";
import { useRole } from "../lib/roleContext";

type SettingSectionId = "overview" | "team" | "permissions" | "categories-tags" | "basic-data" | "publish-channels" | "audit-log";

type SettingSection = {
  id: Exclude<SettingSectionId, "overview">;
  title: string;
  body: string;
  action: string;
  route: string;
};

const settingSections: SettingSection[] = [
  {
    id: "team",
    title: "團隊管理",
    body: "維護團隊成員、職稱、任期、承辦指派與帳號連結狀態。",
    action: "管理團隊",
    route: "/settings?section=team",
  },
  {
    id: "permissions",
    title: "權限設定",
    body: "權限會以團隊成員為先決條件；先選擇團隊成員，再授予不同作業的初審、覆核或核准權限標記。",
    action: "設定權限",
    route: "/settings?section=permissions",
  },
  {
    id: "categories-tags",
    title: "類別 / 標籤",
    body: "管理類別與標籤，避免類別、處理狀態與資料狀態混用。",
    action: "管理類別 / 標籤",
    route: "/settings?section=categories-tags",
  },
  {
    id: "basic-data",
    title: "基礎資料設定",
    body: "維護日常作業會用到的類型、分類、資料狀態與處理狀態。",
    action: "設定基礎資料",
    route: "/settings?section=basic-data",
  },
  {
    id: "publish-channels",
    title: "發布管道設定",
    body: "管理對外發布可使用的管道、核准需求與可見對象。",
    action: "設定發布管道",
    route: "/settings?section=publish-channels",
  },
  {
    id: "audit-log",
    title: "操作紀錄",
    body: "查詢新增、編輯、封存、還原與權限標記調整紀錄。",
    action: "查看操作紀錄",
    route: "/settings?section=audit-log",
  },
];

const sectionAliases: Record<string, SettingSectionId> = {
  team: "team",
  permissions: "permissions",
  categories: "categories-tags",
  "categories-tags": "categories-tags",
  "basic-data": "basic-data",
  "publishing-channels": "publish-channels",
  "publish-channels": "publish-channels",
  audit: "audit-log",
  "audit-log": "audit-log",
};

function sectionFromParam(value: string | null): SettingSectionId {
  if (!value) return "overview";
  return sectionAliases[value] ?? "overview";
}

function nextState(state: SettingItemState): SettingItemState {
  return state === "使用中" ? "停用" : "使用中";
}

function BooleanMark({ value }: { value: boolean }) {
  return <span className={value ? "setting-mark on" : "setting-mark"}>{value ? "可" : "否"}</span>;
}

function SettingStatus({ children }: { children: string }) {
  const tone = children === "停用" || children === "尚未串接" ? "warning" : "";
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function SettingsNotice({ message }: { message: string }) {
  return <div className="process-panel success"><strong>{message}</strong><span>變更已暫存在目前畫面，可再檢查後套用。</span></div>;
}

export function SettingsPage() {
  const { role } = useRole();
  const [searchParams] = useSearchParams();
  const sectionId = sectionFromParam(searchParams.get("section"));
  const canUse = canUseAdminSettings(role);
  const activeSection = settingSections.find((item) => item.id === sectionId);
  const [notice, setNotice] = useState("");
  const [basicGroups, setBasicGroups] = useState(basicDataGroups);
  const [categories, setCategories] = useState(categorySettings);
  const [tags, setTags] = useState(tagSettings);
  const [channels, setChannels] = useState(publishingChannelSettings);
  const [permissions, setPermissions] = useState(permissionSettings);
  const [team, setTeam] = useState(teamSettings);

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

  function updateBasicOption(groupTitle: string, optionName: string) {
    setBasicGroups((groups) => groups.map((group) => group.title === groupTitle ? {
      ...group,
      options: group.options.map((option) => option.name === optionName ? { ...option, state: nextState(option.state) } : option),
    } : group));
    setNotice(`${groupTitle}已更新。`);
  }

  function addBasicOption(groupTitle: string, name: string) {
    const value = name.trim();
    if (!value) return;
    setBasicGroups((groups) => groups.map((group) => group.title === groupTitle ? {
      ...group,
      options: [...group.options, { name: value, state: "使用中" }],
    } : group));
    setNotice(`${groupTitle}已新增「${value}」。`);
  }

  function toggleCategory(name: string) {
    setCategories((items) => items.map((item) => item.name === name ? { ...item, state: nextState(item.state) } : item));
    setNotice("類別狀態已更新。");
  }

  function toggleTag(name: string) {
    setTags((items) => items.map((item) => item.name === name ? { ...item, state: nextState(item.state) } : item));
    setNotice("標籤狀態已更新。");
  }

  function toggleChannel(name: string, key: "enabled" | "approvalRequired") {
    setChannels((items) => items.map((item) => item.name === name ? { ...item, [key]: !item[key] } : item));
    setNotice("發布管道設定已更新。");
  }

  function togglePermission(member: string, key: keyof Pick<PermissionSetting, "review" | "verify" | "approve" | "canCreateOrEdit" | "canArchive" | "canPublish" | "canSetChannels" | "isAdmin">) {
    setPermissions((items) => items.map((item) => item.member === member ? { ...item, [key]: !item[key] } : item));
    setNotice("權限標記已更新。");
  }

  function toggleTeam(member: string, key: keyof Pick<TeamSetting, "assignable">) {
    setTeam((items) => items.map((item) => item.name === member ? { ...item, [key]: !item[key] } : item));
    setNotice("團隊成員設定已更新。");
  }

  function toggleTeamState(member: string) {
    setTeam((items) => items.map((item) => item.name === member ? { ...item, state: nextState(item.state) } : item));
    setNotice("團隊成員狀態已更新。");
  }

  function addCategory(name: string) {
    const value = name.trim();
    if (!value) return;
    setCategories((items) => [...items, { name: value, moduleScope: "全模組", state: "使用中", note: "由管理者新增的類別。" }]);
    setNotice(`已新增類別「${value}」。`);
  }

  function addTag(name: string) {
    const value = name.trim();
    if (!value) return;
    setTags((items) => [...items, { name: value, moduleScope: "全模組", state: "使用中", usage: "由管理者新增的標籤。" }]);
    setNotice(`已新增標籤「${value}」。`);
  }

  return (
    <div className="page-stack">
      <section className="content-panel module-header">
        <div>
          {activeSection ? <Link to="/settings" className="back-link">返回管理者設定</Link> : null}
          <span className="eyebrow">管理者設定</span>
          <h2>{activeSection ? activeSection.title : "管理者設定總覽"}</h2>
          <p>{activeSection ? activeSection.body : "團隊、權限、類別、基礎資料、發布管道與操作紀錄集中管理。"}</p>
        </div>
      </section>

      {notice ? <SettingsNotice message={notice} /> : null}

      {sectionId === "overview" ? <SettingsOverview /> : null}
      {sectionId === "team" ? <TeamSettingsPanel team={team} onToggleAssignable={(member) => toggleTeam(member, "assignable")} onToggleState={toggleTeamState} onNotice={setNotice} /> : null}
      {sectionId === "permissions" ? <PermissionsPanel permissions={permissions} onToggle={togglePermission} /> : null}
      {sectionId === "categories-tags" ? <CategoriesTagsPanel categories={categories} tags={tags} onAddCategory={addCategory} onAddTag={addTag} onToggleCategory={toggleCategory} onToggleTag={toggleTag} onNotice={setNotice} /> : null}
      {sectionId === "basic-data" ? <BasicDataPanel groups={basicGroups} onAddOption={addBasicOption} onToggleOption={updateBasicOption} onNotice={setNotice} /> : null}
      {sectionId === "publish-channels" ? <PublishingChannelsPanel channels={channels} onToggle={toggleChannel} onNotice={setNotice} /> : null}
      {sectionId === "audit-log" ? <AuditLogPanel /> : null}
    </div>
  );
}

function SettingsOverview() {
  return (
    <section className="settings-grid">
      {settingSections.map((item) => (
        <article key={item.id} className="setting-card">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <Link to={item.route} className="setting-action">{item.action}</Link>
        </article>
      ))}
    </section>
  );
}

function TeamSettingsPanel({ team, onToggleAssignable, onToggleState, onNotice }: { team: TeamSetting[]; onToggleAssignable: (member: string) => void; onToggleState: (member: string) => void; onNotice: (message: string) => void }) {
  return (
    <section className="content-panel">
      <div className="section-heading">
        <h3>團隊成員列表</h3>
        <button type="button" className="setting-action" onClick={() => onNotice("新增團隊成員表單已開啟，可先整理姓名、職稱與任期。")}>新增團隊成員</button>
      </div>
      <div className="settings-table-wrap">
        <table className="settings-table">
          <thead>
            <tr>
              <th>成員</th>
              <th>職稱</th>
              <th>任期</th>
              <th>狀態</th>
              <th>可指派</th>
              <th>權限摘要</th>
              <th>帳號連結</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.name}>
                <td>{member.name}</td>
                <td>{member.title}</td>
                <td>{member.term}</td>
                <td><SettingStatus>{member.state}</SettingStatus></td>
                <td><BooleanMark value={member.assignable} /></td>
                <td>{member.permissionSummary}</td>
                <td>{member.accountState}</td>
                <td>
                  <div className="settings-row-actions">
                    <button type="button" onClick={() => onToggleAssignable(member.name)}>切換指派</button>
                    <button type="button" onClick={() => onToggleState(member.name)}>啟用 / 停用</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PermissionsPanel({ permissions, onToggle }: { permissions: PermissionSetting[]; onToggle: (member: string, key: keyof Pick<PermissionSetting, "review" | "verify" | "approve" | "canCreateOrEdit" | "canArchive" | "canPublish" | "canSetChannels" | "isAdmin">) => void }) {
  const columns: Array<{ key: keyof Pick<PermissionSetting, "review" | "verify" | "approve" | "canCreateOrEdit" | "canArchive" | "canPublish" | "canSetChannels" | "isAdmin">; label: string }> = [
    { key: "review", label: "初審" },
    { key: "verify", label: "覆核" },
    { key: "approve", label: "核准" },
    { key: "canCreateOrEdit", label: "新增 / 編輯" },
    { key: "canArchive", label: "可封存" },
    { key: "canPublish", label: "可發布" },
    { key: "canSetChannels", label: "可設定發布管道" },
    { key: "isAdmin", label: "管理者" },
  ];

  return (
    <section className="content-panel">
      <div className="section-heading">
        <h3>團隊成員模組權限</h3>
        <span>先有團隊成員，再授予模組權限</span>
      </div>
      <div className="permission-strip compact">
        <strong>權限設定</strong>
        <span>團隊成員是權限設定的先決條件。初審、覆核、核准是權限標記，不強制作業卡關。</span>
      </div>
      <div className="settings-table-wrap">
        <table className="settings-table permission-table">
          <thead>
            <tr>
              <th>團隊成員</th>
              <th>職稱</th>
              <th>模組權限</th>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.member}>
                <td>{permission.member}</td>
                <td>{permission.title}</td>
                <td>{permission.modules.join("、")}</td>
                {columns.map((column) => (
                  <td key={`${permission.member}-${column.key}`}>
                    <label className="checkbox-cell">
                      <input type="checkbox" checked={permission[column.key]} onChange={() => onToggle(permission.member, column.key)} />
                      <span>{permission[column.key] ? "已授權" : "未授權"}</span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoriesTagsPanel({ categories, tags, onAddCategory, onAddTag, onToggleCategory, onToggleTag, onNotice }: { categories: CategorySetting[]; tags: TagSetting[]; onAddCategory: (name: string) => void; onAddTag: (name: string) => void; onToggleCategory: (name: string) => void; onToggleTag: (name: string) => void; onNotice: (message: string) => void }) {
  const [categoryName, setCategoryName] = useState("");
  const [tagName, setTagName] = useState("");

  return (
    <section className="two-column settings-workspace">
      <article className="content-panel">
        <div className="section-heading">
          <h3>類別管理</h3>
          <span>由管理者定義</span>
        </div>
        <InlineAddControl label="新增類別" value={categoryName} onChange={setCategoryName} onSubmit={() => { onAddCategory(categoryName); setCategoryName(""); }} />
        <SettingItemList items={categories.map((item) => ({
          title: item.name,
          meta: item.moduleScope,
          state: item.state,
          note: item.note,
          actionLabel: "啟用 / 停用",
          onAction: () => onToggleCategory(item.name),
        }))} />
      </article>

      <article className="content-panel">
        <div className="section-heading">
          <h3>標籤管理</h3>
          <button type="button" className="setting-action" onClick={() => onNotice("已建立標籤合併檢查事項。")}>合併標籤</button>
        </div>
        <InlineAddControl label="新增標籤" value={tagName} onChange={setTagName} onSubmit={() => { onAddTag(tagName); setTagName(""); }} />
        <SettingItemList items={tags.map((item) => ({
          title: item.name,
          meta: item.moduleScope,
          state: item.state,
          note: item.usage,
          actionLabel: "啟用 / 停用",
          onAction: () => onToggleTag(item.name),
        }))} />
      </article>
    </section>
  );
}

function BasicDataPanel({ groups, onAddOption, onToggleOption, onNotice }: { groups: BasicDataGroup[]; onAddOption: (groupTitle: string, name: string) => void; onToggleOption: (groupTitle: string, optionName: string) => void; onNotice: (message: string) => void }) {
  return (
    <section className="settings-grid">
      {groups.map((group) => (
        <BasicDataGroupCard key={group.title} group={group} onAddOption={onAddOption} onToggleOption={onToggleOption} onNotice={onNotice} />
      ))}
    </section>
  );
}

function BasicDataGroupCard({ group, onAddOption, onToggleOption, onNotice }: { group: BasicDataGroup; onAddOption: (groupTitle: string, name: string) => void; onToggleOption: (groupTitle: string, optionName: string) => void; onNotice: (message: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <article className="setting-card functional-card">
      <div className="section-heading">
        <div>
          <strong>{group.title}</strong>
          <p>{group.scope}</p>
        </div>
        <button type="button" onClick={() => onNotice(`${group.title}草稿已暫存。`)}>儲存草稿</button>
      </div>
      <InlineAddControl label={`新增${group.title}選項`} value={value} onChange={setValue} onSubmit={() => { onAddOption(group.title, value); setValue(""); }} />
      <div className="setting-option-list">
        {group.options.map((option) => (
          <div key={option.name} className="setting-option-row">
            <span>{option.name}</span>
            <SettingStatus>{option.state}</SettingStatus>
            <button type="button" onClick={() => onToggleOption(group.title, option.name)}>啟用 / 停用</button>
          </div>
        ))}
      </div>
    </article>
  );
}

function PublishingChannelsPanel({ channels, onToggle, onNotice }: { channels: PublishingChannelSetting[]; onToggle: (name: string, key: "enabled" | "approvalRequired") => void; onNotice: (message: string) => void }) {
  return (
    <section className="settings-grid">
      {channels.map((channel) => (
        <article key={channel.name} className="setting-card functional-card">
          <div className="section-heading">
            <div>
              <strong>{channel.name}</strong>
              <p>{channel.note}</p>
            </div>
            <SettingStatus>{channel.state}</SettingStatus>
          </div>
          <div className="info-grid">
            <div><b>啟用狀態</b><span>{channel.enabled ? "啟用" : "停用"}</span></div>
            <div><b>是否需要核准</b><span>{channel.approvalRequired ? "需要核准" : "不需核准"}</span></div>
            <div><b>預設可見對象</b><span>{channel.audience}</span></div>
          </div>
          <div className="settings-row-actions">
            <button type="button" onClick={() => onToggle(channel.name, "enabled")}>啟用 / 停用</button>
            <button type="button" onClick={() => onToggle(channel.name, "approvalRequired")}>切換核准</button>
            <button type="button" onClick={() => onNotice(`${channel.name}設定草稿已暫存。`)}>儲存草稿</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function AuditLogPanel() {
  return (
    <section className="content-panel">
      <div className="section-heading">
        <h3>操作紀錄列表</h3>
        <span>{auditLogSettings.length > 0 ? `${auditLogSettings.length} 筆` : "目前尚無操作紀錄。"}</span>
      </div>
      {auditLogSettings.length > 0 ? (
        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>操作時間</th>
                <th>操作人員</th>
                <th>動作</th>
                <th>模組</th>
                <th>狀態</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {auditLogSettings.map((item) => (
                <tr key={`${item.time}-${item.actor}-${item.action}`}>
                  <td>{item.time}</td>
                  <td>{item.actor}</td>
                  <td>{item.action}</td>
                  <td>{item.module}</td>
                  <td>{item.state}</td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">目前尚無操作紀錄。</div>
      )}
    </section>
  );
}

type SettingItem = {
  title: string;
  meta: string;
  state: SettingItemState;
  note: string;
  actionLabel: string;
  onAction: () => void;
};

function SettingItemList({ items }: { items: SettingItem[] }) {
  return (
    <div className="setting-option-list">
      {items.map((item) => (
        <div key={item.title} className="setting-option-row stacked">
          <div>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
            <p>{item.note}</p>
          </div>
          <SettingStatus>{item.state}</SettingStatus>
          <button type="button" onClick={item.onAction}>{item.actionLabel}</button>
        </div>
      ))}
    </div>
  );
}

function InlineAddControl({ label, value, onChange, onSubmit }: { label: string; value: string; onChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <div className="inline-add-control">
      <label>
        {label}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="請輸入名稱" />
      </label>
      <button type="button" onClick={onSubmit}>新增</button>
    </div>
  );
}
