export type ModuleKey =
  | "temple-affairs"
  | "devotees"
  | "shrines"
  | "visits"
  | "announcements"
  | "events"
  | "procurements"
  | "documents"
  | "team"
  | "ledger";

export type ModuleConfig = {
  key: ModuleKey;
  title: string;
  shortTitle: string;
  description: string;
  route: string;
  addLabel: string;
  boundary: string;
};

export const modules: ModuleConfig[] = [
  {
    key: "temple-affairs",
    title: "廟務管理",
    shortTitle: "廟務",
    description: "例行工作、祭典準備、關聯任務與內部提醒。",
    route: "/temple-affairs",
    addLabel: "新增廟務紀錄",
    boundary: "日常廟務",
  },
  {
    key: "devotees",
    title: "善信管理",
    shortTitle: "善信",
    description: "善信基本資料、授權狀態、發財金領取 / 繳回與年度服務紀錄。",
    route: "/devotees",
    addLabel: "新增善信",
    boundary: "善信與服務紀錄",
  },
  {
    key: "shrines",
    title: "友宮管理",
    shortTitle: "友宮",
    description: "友宮主檔、聯絡人、電話地址、聯繫方式與互訪紀錄摘要。",
    route: "/shrines",
    addLabel: "新增友宮",
    boundary: "友宮主檔",
  },
  {
    key: "visits",
    title: "來訪 / 請帖",
    shortTitle: "來訪",
    description: "來訪、進香、請帖、回覆與待確認事項。",
    route: "/visits",
    addLabel: "新增來訪 / 請帖",
    boundary: "互動事件",
  },
  {
    key: "announcements",
    title: "公告",
    shortTitle: "公告",
    description: "對外公告草稿、發布狀態與發布管道。",
    route: "/announcements",
    addLabel: "新增公告",
    boundary: "對外公告",
  },
  {
    key: "events",
    title: "活動",
    shortTitle: "活動",
    description: "活動日期、籌備狀態、參與對象與公告關聯。",
    route: "/events",
    addLabel: "新增活動",
    boundary: "活動資訊",
  },
  {
    key: "procurements",
    title: "採購管理",
    shortTitle: "採購",
    description: "請購、估價、驗收與帳務關聯摘要。",
    route: "/procurements",
    addLabel: "新增採購",
    boundary: "日常採購",
  },
  {
    key: "documents",
    title: "公文 / 通知",
    shortTitle: "公文",
    description: "來文、發文、行政通知與待追蹤事項。",
    route: "/documents",
    addLabel: "新增文件紀錄",
    boundary: "行政通知",
  },
  {
    key: "team",
    title: "團隊管理",
    shortTitle: "團隊",
    description: "團隊成員、宮廟職稱、任期值勤與系統權限摘要。",
    route: "/team",
    addLabel: "新增團隊成員",
    boundary: "團隊與權限基礎",
  },
  {
    key: "ledger",
    title: "帳務管理",
    shortTitle: "帳務",
    description: "流水草稿、分類、實際金額、付款狀態與關聯支出。",
    route: "/ledger",
    addLabel: "新增帳務草稿",
    boundary: "帳務紀錄",
  },
];

export function findModuleByRoute(path: string) {
  return modules.find((moduleItem) => moduleItem.route === path);
}

export function findModuleByKey(key: ModuleKey) {
  return modules.find((moduleItem) => moduleItem.key === key);
}
