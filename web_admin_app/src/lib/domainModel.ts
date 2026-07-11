import type { ModuleKey } from "../data/modules";
import { assignableTeamMemberNames } from "../data/adminSettings";

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
    ledger: ["香油錢", "供品支出", "活動支出", "採購付款", "其他"],
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
