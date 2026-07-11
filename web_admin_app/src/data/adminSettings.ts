export type SettingItemState = "使用中" | "停用";

export type BasicDataGroup = {
  title: string;
  scope: string;
  options: Array<{ name: string; state: SettingItemState }>;
};

export type CategorySetting = {
  name: string;
  moduleScope: string;
  state: SettingItemState;
  note: string;
};

export type TagSetting = {
  name: string;
  moduleScope: string;
  state: SettingItemState;
  usage: string;
};

export type PublishingChannelSetting = {
  name: string;
  state: "內部可用" | "草稿準備" | "尚未串接";
  enabled: boolean;
  approvalRequired: boolean;
  audience: string;
  note: string;
};

export type PermissionSetting = {
  member: string;
  title: string;
  modules: string[];
  review: boolean;
  verify: boolean;
  approve: boolean;
  canCreateOrEdit: boolean;
  canArchive: boolean;
  canPublish: boolean;
  canSetChannels: boolean;
  isAdmin: boolean;
};

export type TeamSetting = {
  name: string;
  title: string;
  term: string;
  state: SettingItemState;
  assignable: boolean;
  permissionSummary: string;
  accountState: "已連結" | "待確認" | "未連結";
};

export type AuditLogSetting = {
  time: string;
  actor: string;
  action: string;
  module: string;
  state: string;
  note: string;
};

export const basicDataGroups: BasicDataGroup[] = [
  {
    title: "善信類型",
    scope: "善信管理",
    options: [
      { name: "一般善信", state: "使用中" },
      { name: "委員 / 志工相關", state: "使用中" },
      { name: "友宮聯絡人", state: "使用中" },
      { name: "其他", state: "使用中" },
    ],
  },
  {
    title: "友宮分類",
    scope: "友宮管理",
    options: [
      { name: "友宮", state: "使用中" },
      { name: "廟宇", state: "使用中" },
      { name: "協會", state: "使用中" },
      { name: "其他", state: "停用" },
    ],
  },
  {
    title: "採購類別",
    scope: "採購管理",
    options: [
      { name: "香品", state: "使用中" },
      { name: "供品", state: "使用中" },
      { name: "紙錢", state: "使用中" },
      { name: "設備", state: "使用中" },
      { name: "活動用品", state: "使用中" },
      { name: "其他", state: "使用中" },
    ],
  },
  {
    title: "帳務類別",
    scope: "帳務管理",
    options: [
      { name: "收入", state: "使用中" },
      { name: "支出", state: "使用中" },
      { name: "採購付款", state: "使用中" },
      { name: "活動支出", state: "使用中" },
      { name: "其他", state: "使用中" },
    ],
  },
  {
    title: "資料狀態",
    scope: "全模組",
    options: [
      { name: "使用中", state: "使用中" },
      { name: "已封存", state: "使用中" },
      { name: "作廢", state: "使用中" },
    ],
  },
  {
    title: "本人資料授權",
    scope: "善信管理",
    options: [
      { name: "待確認", state: "使用中" },
      { name: "已授權", state: "使用中" },
      { name: "未授權", state: "使用中" },
      { name: "取消授權", state: "使用中" },
    ],
  },
  {
    title: "處理狀態",
    scope: "日常作業",
    options: [
      { name: "待確認", state: "使用中" },
      { name: "處理中", state: "使用中" },
      { name: "已完成", state: "使用中" },
      { name: "暫緩", state: "使用中" },
    ],
  },
  {
    title: "發布狀態",
    scope: "對外發布",
    options: [
      { name: "草稿", state: "使用中" },
      { name: "待確認", state: "使用中" },
      { name: "已發布", state: "使用中" },
      { name: "已封存", state: "使用中" },
    ],
  },
];

export const categorySettings: CategorySetting[] = [
  { name: "善信類別", moduleScope: "善信管理", state: "使用中", note: "用於區分一般善信、委員與志工相關資料。" },
  { name: "採購類別", moduleScope: "採購管理", state: "使用中", note: "用於香品、供品、設備與活動用品分類。" },
  { name: "發布類別", moduleScope: "發布內容 / 活動消息", state: "使用中", note: "用於公告、活動與行政通知分類。" },
  { name: "帳務類別", moduleScope: "帳務管理", state: "使用中", note: "用於收入、支出、採購付款與活動支出。" },
];

export const tagSettings: TagSetting[] = [
  { name: "發財金", moduleScope: "善信管理 / 帳務管理", state: "使用中", usage: "輔助查詢發財金領取與繳回紀錄。" },
  { name: "普渡", moduleScope: "活動消息 / 採購管理", state: "使用中", usage: "標記中元普渡相關活動與採購。" },
  { name: "需追蹤", moduleScope: "全模組", state: "使用中", usage: "標記需要後續確認的資料。" },
  { name: "待合併", moduleScope: "標籤治理", state: "停用", usage: "保留合併前的舊標籤名稱。" },
];

export const publishingChannelSettings: PublishingChannelSetting[] = [
  { name: "網站", state: "內部可用", enabled: true, approvalRequired: true, audience: "所有善信", note: "發布前需覆核內容與日期。" },
  { name: "LINE 官方帳號", state: "尚未串接", enabled: false, approvalRequired: true, audience: "已追蹤善信", note: "先保留發布管道設定。" },
  { name: "LINE VOOM", state: "草稿準備", enabled: false, approvalRequired: true, audience: "公開", note: "適合活動照片與提醒。" },
  { name: "Facebook", state: "草稿準備", enabled: false, approvalRequired: true, audience: "公開", note: "適合活動宣傳與回顧。" },
  { name: "公告欄列印", state: "內部可用", enabled: true, approvalRequired: false, audience: "到廟善信", note: "可供現場張貼備查。" },
  { name: "內部備查", state: "內部可用", enabled: true, approvalRequired: false, audience: "廟方人員", note: "只作為內部留存紀錄。" },
];

export const permissionSettings: PermissionSetting[] = [
  {
    member: "主任委員 A",
    title: "主任委員",
    modules: ["全部模組"],
    review: true,
    verify: true,
    approve: true,
    canCreateOrEdit: true,
    canArchive: true,
    canPublish: true,
    canSetChannels: true,
    isAdmin: true,
  },
  {
    member: "總幹事 A",
    title: "總幹事",
    modules: ["善信管理", "友宮管理", "來訪 / 請帖", "公文紀錄"],
    review: true,
    verify: true,
    approve: false,
    canCreateOrEdit: true,
    canArchive: false,
    canPublish: false,
    canSetChannels: false,
    isAdmin: false,
  },
  {
    member: "財務 A",
    title: "財務",
    modules: ["採購管理", "帳務管理"],
    review: true,
    verify: true,
    approve: false,
    canCreateOrEdit: true,
    canArchive: false,
    canPublish: false,
    canSetChannels: false,
    isAdmin: false,
  },
  {
    member: "志工 A",
    title: "志工",
    modules: ["善信管理", "活動消息"],
    review: true,
    verify: false,
    approve: false,
    canCreateOrEdit: true,
    canArchive: false,
    canPublish: false,
    canSetChannels: false,
    isAdmin: false,
  },
];

export const teamSettings: TeamSetting[] = [
  { name: "主任委員 A", title: "主任委員", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "管理者、核准", accountState: "已連結" },
  { name: "總幹事 A", title: "總幹事", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "日常作業、覆核", accountState: "已連結" },
  { name: "財務 A", title: "財務", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "採購與帳務", accountState: "待確認" },
  { name: "志工 A", title: "志工", term: "活動期間", state: "使用中", assignable: true, permissionSummary: "活動協助", accountState: "未連結" },
];

export const auditLogSettings: AuditLogSetting[] = [
  { time: "2026/07/08 09:20", actor: "主任委員 A", action: "調整權限標記", module: "權限設定", state: "已完成", note: "新增總幹事覆核權限。" },
  { time: "2026/07/08 10:05", actor: "總幹事 A", action: "封存資料", module: "善信管理", state: "已完成", note: "保留紀錄並從日常列表移出。" },
  { time: "2026/07/08 11:15", actor: "財務 A", action: "更新分類", module: "帳務管理", state: "待覆核", note: "新增採購付款分類。" },
];
