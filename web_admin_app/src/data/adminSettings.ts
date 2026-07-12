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
  linkedTeamMember: string;
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
  linkedDevotee: string;
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

export type CustomFieldType = "text" | "textarea" | "number" | "date" | "select" | "multiSelect" | "checkbox";

export type CustomFieldDefinition = {
  id: string;
  moduleKey: string;
  label: string;
  description: string;
  fieldType: CustomFieldType;
  required: boolean;
  active: boolean;
  archived: boolean;
  sortOrder: number;
  placeholder: string;
  options: string[];
  visibility: "內部作業" | "管理者" | "全角色";
  editableRoles: Array<"admin" | "staff" | "viewer">;
  showInList: boolean;
  showInDetail: boolean;
  showInCreate: boolean;
  showInEdit: boolean;
};

export const masterDataCatalogs = {
  devoteeTypes: ["一般善信", "委員 / 志工相關", "友宮聯絡人", "其他"],
  shrineTypes: ["友宮", "合作宮廟", "行政單位", "其他"],
  regionCatalog: ["桃園地區", "中壢地區", "平鎮地區", "新竹地區", "其他地區"],
  contactTypes: ["電話", "手機", "LINE", "Email", "地址", "其他"],
  contactStatuses: ["可聯繫", "待確認", "暫停聯繫", "已封存"],
  contactRoleTypes: ["主委", "總幹事", "窗口", "廟方人員", "志工", "其他"],
  deityCatalog: ["福德正神", "天上聖母", "玄天上帝", "關聖帝君", "保生大帝", "觀音佛祖", "其他神祇"],
  relationshipStatuses: ["常態往來", "近期來訪", "待回覆", "暫少往來", "已封存"],
  teamRoles: ["主任委員", "副主任委員", "總幹事", "財務", "會計", "出納", "委員", "志工", "系統管理者", "一般工作人員", "其他"],
  permissionTypes: ["管理者", "承辦", "覆核", "核准", "封存", "發布", "設定"],
  templeWorkCategories: ["例行廟務", "祭典準備", "場地事務", "對外聯繫", "內部提醒"],
  interactionCategories: ["財務往來", "物資往來", "公告通知", "活動參與", "服務 / 聯繫紀錄", "其他廟務關聯"],
  interactionTypes: ["發財金", "平安龜", "香油錢", "善信捐款", "金牌", "物資捐贈", "供品捐贈", "公告通知", "活動報名", "活動參與", "電話聯繫", "現場洽詢"],
  itemCatalog: ["鮮花", "金紙", "供品", "平安龜", "金牌", "白米", "香品", "其他物資"],
  unitCatalog: ["元", "個", "盆", "箱", "包", "斤", "份", "則", "件", "組"],
  accountingCategories: ["發財金借出", "發財金返還", "香油錢", "善信捐款", "金牌收入", "活動收入", "採購支出", "其他收入", "其他支出"],
  notificationTypes: ["公告通知", "活動提醒", "行政通知", "服務聯繫"],
  notificationStatuses: ["待通知", "已通知", "已回覆", "未回覆"],
  activityTypes: ["祭典活動", "志工活動", "友宮聯誼", "一般活動"],
  activityStatuses: ["待報名", "已報名", "已參與", "未出席"],
  visitTypes: ["參訪", "進香", "請帖", "祝壽", "聯誼"],
  invitationTypes: ["活動請帖", "祝壽請帖", "聯誼邀請", "其他請帖"],
  documentTypes: ["公文紀錄", "內部行政", "通知發布", "會議紀錄"],
  recordStatuses: ["使用中", "已封存", "作廢"],
};

export const basicDataGroups: BasicDataGroup[] = [
  {
    title: "善信類型",
    scope: "善信管理",
    options: [
      ...masterDataCatalogs.devoteeTypes.map((name) => ({ name, state: "使用中" as const })),
    ],
  },
  {
    title: "友宮分類",
    scope: "友宮管理",
    options: masterDataCatalogs.shrineTypes.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "聯絡方式類型",
    scope: "友宮管理",
    options: masterDataCatalogs.contactTypes.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "聯繫狀態",
    scope: "友宮管理",
    options: masterDataCatalogs.contactStatuses.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "聯絡人身分",
    scope: "友宮管理",
    options: masterDataCatalogs.contactRoleTypes.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "神祇目錄",
    scope: "友宮管理",
    options: masterDataCatalogs.deityCatalog.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "地區分類",
    scope: "友宮管理",
    options: masterDataCatalogs.regionCatalog.map((name) => ({ name, state: "使用中" as const })),
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
    title: "往來分類",
    scope: "善信管理",
    options: masterDataCatalogs.interactionCategories.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "往來類型",
    scope: "善信管理",
    options: masterDataCatalogs.interactionTypes.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "品項主檔",
    scope: "採購 / 帳務 / 善信相關紀錄",
    options: masterDataCatalogs.itemCatalog.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "單位主檔",
    scope: "採購 / 帳務 / 善信相關紀錄",
    options: masterDataCatalogs.unitCatalog.map((name) => ({ name, state: "使用中" as const })),
  },
  {
    title: "帳務類別",
    scope: "帳務管理",
    options: masterDataCatalogs.accountingCategories.map((name) => ({ name, state: "使用中" as const })),
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
    linkedTeamMember: "主任委員 A",
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
    linkedTeamMember: "總幹事 A",
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
    linkedTeamMember: "財務 A",
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
    linkedTeamMember: "志工 A",
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
  { name: "主任委員 A", linkedDevotee: "善信範例 A", title: "主任委員", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "管理者、核准", accountState: "已連結" },
  { name: "總幹事 A", linkedDevotee: "善信範例 B", title: "總幹事", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "日常作業、覆核", accountState: "已連結" },
  { name: "財務 A", linkedDevotee: "善信範例 C", title: "財務", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "採購與帳務", accountState: "待確認" },
  { name: "志工 A", linkedDevotee: "善信範例 D", title: "志工", term: "活動期間", state: "使用中", assignable: true, permissionSummary: "活動協助", accountState: "未連結" },
  { name: "櫃檯人員 A", linkedDevotee: "善信範例 E", title: "一般工作人員", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "善信資料維護", accountState: "待確認" },
  { name: "接待人員 A", linkedDevotee: "善信範例 F", title: "志工", term: "活動期間", state: "使用中", assignable: true, permissionSummary: "來訪與請帖接待", accountState: "待確認" },
  { name: "文書人員 A", linkedDevotee: "善信範例 G", title: "一般工作人員", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "公文紀錄", accountState: "待確認" },
  { name: "採購人員 A", linkedDevotee: "善信範例 H", title: "一般工作人員", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "採購管理", accountState: "待確認" },
  { name: "帳務人員 A", linkedDevotee: "善信範例 I", title: "會計", term: "114 年度", state: "使用中", assignable: true, permissionSummary: "帳務管理", accountState: "待確認" },
];

export const assignableTeamMemberNames = teamSettings.filter((member) => member.assignable && member.state === "使用中").map((member) => member.name);

export const assignableTeamMemberOptions = teamSettings
  .filter((member) => member.assignable && member.state === "使用中")
  .map((member) => ({
    value: `team-${member.name}`,
    label: `${member.name}｜${member.title}`,
  }));

export const customFieldDefinitions: CustomFieldDefinition[] = [];

export function activeCustomFieldsForModule(moduleKey: string, location: "list" | "detail" | "create" | "edit") {
  void moduleKey;
  void location;
  return [];
}

export const auditLogSettings: AuditLogSetting[] = [
  { time: "115 年 7 月 8 日 09:20", actor: "主任委員 A", action: "調整權限標記", module: "權限設定", state: "已完成", note: "新增總幹事覆核權限。" },
  { time: "115 年 7 月 8 日 10:05", actor: "總幹事 A", action: "封存資料", module: "善信管理", state: "已完成", note: "保留紀錄並從日常列表移出。" },
  { time: "115 年 7 月 8 日 11:15", actor: "財務 A", action: "更新分類", module: "帳務管理", state: "待覆核", note: "新增採購付款分類。" },
];
