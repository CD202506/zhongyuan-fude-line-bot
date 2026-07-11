import type { ModuleKey } from "../data/modules";
import { assignableTeamMemberNames, masterDataCatalogs } from "../data/adminSettings";

export type ModuleDomainType = "masterData" | "internalWork" | "publishing" | "governance";

export type FieldPolicy = {
  domainType: ModuleDomainType;
  categoryLabel?: string;
  ownerLabel: string;
  dateLabel: string;
  showAssignee: boolean;
  showDueDate: boolean;
  showTags: boolean;
  showCategory: boolean;
};

export const moduleDomainTypes: Record<ModuleKey, ModuleDomainType> = {
  "temple-affairs": "internalWork",
  devotees: "masterData",
  shrines: "masterData",
  visits: "internalWork",
  announcements: "publishing",
  events: "publishing",
  procurements: "internalWork",
  documents: "internalWork",
  team: "masterData",
  ledger: "internalWork",
};

export const fieldPolicies: Record<ModuleKey, FieldPolicy> = {
  "temple-affairs": {
    domainType: "internalWork",
    categoryLabel: "廟務類別",
    ownerLabel: "承辦人員",
    dateLabel: "發生日期",
    showAssignee: true,
    showDueDate: true,
    showTags: true,
    showCategory: true,
  },
  devotees: {
    domainType: "masterData",
    categoryLabel: "善信類型",
    ownerLabel: "資料維護人員",
    dateLabel: "建立日期",
    showAssignee: true,
    showDueDate: false,
    showTags: false,
    showCategory: true,
  },
  shrines: {
    domainType: "masterData",
    categoryLabel: "友宮分類",
    ownerLabel: "主要聯絡窗口",
    dateLabel: "建立日期",
    showAssignee: false,
    showDueDate: false,
    showTags: false,
    showCategory: true,
  },
  visits: {
    domainType: "internalWork",
    categoryLabel: "來訪類型",
    ownerLabel: "承辦人員",
    dateLabel: "來訪 / 請帖日期",
    showAssignee: true,
    showDueDate: true,
    showTags: true,
    showCategory: true,
  },
  announcements: {
    domainType: "publishing",
    categoryLabel: "發布類別",
    ownerLabel: "整理人員",
    dateLabel: "預計發布日",
    showAssignee: true,
    showDueDate: false,
    showTags: true,
    showCategory: true,
  },
  events: {
    domainType: "publishing",
    categoryLabel: "發布類別",
    ownerLabel: "整理人員",
    dateLabel: "活動日期",
    showAssignee: true,
    showDueDate: false,
    showTags: true,
    showCategory: true,
  },
  procurements: {
    domainType: "internalWork",
    categoryLabel: "採購類別",
    ownerLabel: "承辦人員",
    dateLabel: "申請日期",
    showAssignee: true,
    showDueDate: true,
    showTags: true,
    showCategory: true,
  },
  documents: {
    domainType: "internalWork",
    categoryLabel: "文件類型",
    ownerLabel: "承辦人員",
    dateLabel: "公文日期",
    showAssignee: true,
    showDueDate: true,
    showTags: true,
    showCategory: true,
  },
  team: {
    domainType: "masterData",
    categoryLabel: "權限角色",
    ownerLabel: "團隊成員",
    dateLabel: "任期起日",
    showAssignee: false,
    showDueDate: false,
    showTags: false,
    showCategory: false,
  },
  ledger: {
    domainType: "internalWork",
    categoryLabel: "帳務類別",
    ownerLabel: "承辦人員",
    dateLabel: "帳務日期",
    showAssignee: true,
    showDueDate: false,
    showTags: true,
    showCategory: true,
  },
};

export const categorySemantics = {
  note: "類別可由管理者設定。",
  moduleCategories: {
    "temple-affairs": ["例行廟務", "祭典準備", "場地事務", "對外聯繫", "內部提醒"],
    devotees: ["一般善信", "委員 / 志工相關", "友宮聯絡人", "其他"],
    shrines: ["友宮", "合作宮廟", "行政單位", "其他"],
    visits: ["參訪", "進香", "請帖", "祝壽", "聯誼"],
    announcements: ["一般公告", "行政通知", "發財金提醒", "參拜資訊"],
    events: ["活動消息", "友宮聯誼", "祭典活動", "志工活動"],
    procurements: ["供品", "餐點", "設備", "文具", "活動用品", "其他"],
    documents: ["公文紀錄", "內部行政", "通知發布", "會議紀錄"],
    team: ["管理者", "廟方人員", "善信瀏覽"],
    ledger: masterDataCatalogs.accountingCategories,
  } satisfies Record<ModuleKey, string[]>,
};

export const tagSemantics = {
  note: "標籤用於輔助整理。",
  commonTags: ["待整理", "需追蹤", "可發布摘要", "帳務關聯", "內部備查"],
};

export const assigneeSemantics = {
  note: "從可指派團隊成員中選擇。",
  eligibleMembers: assignableTeamMemberNames,
};

export const publishingSemantics = {
  sourceNote: "可由來源資料整理發布內容。",
  categoryLabel: "發布類別",
  channelLabel: "發布管道",
  audienceLabel: "可見對象",
  categories: ["一般公告", "活動消息", "行政通知", "友宮聯誼", "發財金提醒", "參拜資訊"],
  channels: ["網站", "LINE 官方帳號", "LINE VOOM", "Facebook", "內部備查", "公告欄列印"],
  audiences: ["公開", "善信", "廟方人員", "管理者", "指定團隊成員", "內部備查"],
  statuses: ["草稿", "待確認", "已發布", "已封存"],
};

export const stateSemantics = {
  dataStatuses: ["使用中", "已封存", "作廢"],
  processStatuses: ["待確認", "處理中", "已完成", "暫緩"],
  publishingStatuses: ["草稿", "待確認", "已發布", "已封存"],
  notes: {
    dataStatus: "資料狀態由管理者調整。",
    processStatus: "依作業進度調整。",
    publishingStatus: "依發布進度調整。",
  },
};

export type DevoteeRelatedRecord = {
  id: string;
  date: string;
  category: "財務往來" | "物資往來" | "公告通知" | "活動參與" | "服務 / 聯繫紀錄" | "其他廟務關聯";
  type: string;
  action: string;
  item: string;
  quantity: string;
  unit: string;
  amount: string;
  status: string;
  relatedModule: string;
  accountingCategory?: string;
  accountingStatus?: string;
  linkedLedgerRecord?: string;
  originalRecord?: string;
  originalAmount?: string;
  returnedAmount?: string;
  differenceHandling?: string;
  registeredBy: string;
  reviewer?: string;
  note: string;
};

export const devoteeRelatedRecordExamples: DevoteeRelatedRecord[] = [
  {
    id: "devotee-related-fortune-loan",
    date: "2026-07-11",
    category: "財務往來",
    type: "發財金",
    action: "借出 / 領取",
    item: "發財金",
    quantity: "1",
    unit: "份",
    amount: "600",
    status: "待返還",
    relatedModule: "帳務管理",
    accountingCategory: "發財金借出",
    accountingStatus: "待結清",
    linkedLedgerRecord: "帳務草稿 A",
    registeredBy: "櫃檯人員 A",
    reviewer: "財務 A",
    note: "今年領取，後續可提醒返還。",
  },
  {
    id: "devotee-related-fortune-return",
    date: "2026-07-11",
    category: "財務往來",
    type: "發財金",
    action: "返還 / 還金",
    item: "發財金",
    quantity: "1",
    unit: "份",
    amount: "1200",
    status: "已結清",
    relatedModule: "帳務管理",
    accountingCategory: "發財金返還",
    accountingStatus: "待覆核",
    linkedLedgerRecord: "帳務草稿 B",
    originalRecord: "114 年發財金借出紀錄",
    originalAmount: "600",
    returnedAmount: "1200",
    differenceHandling: "差額 600 添香油",
    registeredBy: "櫃檯人員 A",
    reviewer: "財務 A",
    note: "返還金額可高於原借出金額，不視為錯誤。",
  },
  {
    id: "devotee-related-incense",
    date: "2026-07-11",
    category: "財務往來",
    type: "香油錢",
    action: "收入登錄",
    item: "香油錢",
    quantity: "1",
    unit: "元",
    amount: "500",
    status: "已記錄",
    relatedModule: "帳務管理",
    accountingCategory: "香油錢",
    accountingStatus: "待覆核",
    linkedLedgerRecord: "帳務草稿 C",
    registeredBy: "帳務人員 A",
    note: "單向收入，不需返還。",
  },
  {
    id: "devotee-related-flowers",
    date: "2026-07-11",
    category: "物資往來",
    type: "物資捐贈",
    action: "物資接收",
    item: "鮮花",
    quantity: "2",
    unit: "盆",
    amount: "",
    status: "已記錄",
    relatedModule: "善信管理",
    registeredBy: "櫃檯人員 A",
    note: "供奉用鮮花。",
  },
  {
    id: "devotee-related-joss-paper",
    date: "2026-07-11",
    category: "物資往來",
    type: "供品捐贈",
    action: "物資接收",
    item: "金紙",
    quantity: "3",
    unit: "箱",
    amount: "",
    status: "已記錄",
    relatedModule: "善信管理",
    registeredBy: "櫃檯人員 A",
    note: "供廟務活動使用。",
  },
  {
    id: "devotee-related-event",
    date: "2026-07-11",
    category: "活動參與",
    type: "活動報名",
    action: "報名",
    item: "平安祈福活動",
    quantity: "1",
    unit: "件",
    amount: "",
    status: "已報名",
    relatedModule: "活動消息",
    registeredBy: "活動窗口 A",
    note: "活動參與紀錄，可與活動模組關聯。",
  },
  {
    id: "devotee-related-notice",
    date: "2026-07-11",
    category: "公告通知",
    type: "公告通知",
    action: "通知",
    item: "參拜動線提醒",
    quantity: "1",
    unit: "則",
    amount: "",
    status: "已通知",
    relatedModule: "發布內容",
    registeredBy: "發布人員 A",
    note: "通知管道與回覆狀態可由發布模組延伸。",
  },
];

export const relationshipFieldSemantics = {
  devotees: ["善信相關紀錄", "財務往來", "物資往來", "公告通知", "活動參與", "服務 / 聯繫紀錄"],
  team: ["關聯善信", "職稱", "任期", "權限摘要", "可指派狀態"],
  procurements: ["關聯承辦人員", "關聯帳務", "關聯品項", "關聯活動 / 公文 / 廟務事項", "數量", "單位", "金額", "狀態"],
  ledger: ["關聯善信", "關聯團隊成員 / 登錄人員", "關聯採購", "關聯善信往來紀錄", "關聯活動 / 公文", "金額", "品項", "數量", "單位", "覆核 / 核准人員"],
  announcements: ["關聯承辦人員", "關聯通知對象 / 善信", "關聯發布管道", "通知狀態", "回覆狀態"],
  events: ["關聯承辦人員", "關聯活動參與紀錄", "報名狀態", "參與狀態", "服務 / 志工紀錄"],
  documents: ["關聯承辦人員", "關聯善信 / 友宮 / 活動 / 採購 / 帳務", "文件類型", "狀態"],
  shrines: ["關聯來訪 / 請帖", "關聯活動", "關聯公文", "關聯承辦人員"],
  visits: ["關聯友宮", "關聯活動", "關聯公文", "關聯承辦人員"],
};

export function fieldPolicyFor(moduleKey: ModuleKey) {
  return fieldPolicies[moduleKey];
}

export function moduleDomainLabel(moduleKey: ModuleKey) {
  const labels: Record<ModuleDomainType, string> = {
    masterData: "資料主檔",
    internalWork: "內部作業",
    publishing: "內容發布",
    governance: "權限治理",
  };

  return labels[moduleDomainTypes[moduleKey]];
}
