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
    description: "管事：例行工作、祭典準備、關聯任務與內部提醒。",
    route: "/temple-affairs",
    addLabel: "新增廟務紀錄",
    boundary: "廟務管理 = 管事",
  },
  {
    key: "devotees",
    title: "善信管理",
    shortTitle: "善信",
    description: "管人：善信基本資料、授權狀態與年度服務紀錄。",
    route: "/devotees",
    addLabel: "新增善信",
    boundary: "善信管理 = 管人",
  },
  {
    key: "shrines",
    title: "友宮管理",
    shortTitle: "友宮",
    description: "友宮主檔、聯絡窗口、關係狀態與互訪紀錄摘要。",
    route: "/shrines",
    addLabel: "新增友宮",
    boundary: "友宮是宮廟主檔，不混入來訪主題",
  },
  {
    key: "visits",
    title: "來訪 / 請帖",
    shortTitle: "來訪",
    description: "互動事件：來訪、進香、請帖、回覆與待確認事項。",
    route: "/visits",
    addLabel: "新增來訪 / 請帖",
    boundary: "來訪 / 請帖 = 互動事件",
  },
  {
    key: "announcements",
    title: "公告",
    shortTitle: "公告",
    description: "發布內容：公告草稿、發布狀態與發布管道。",
    route: "/announcements",
    addLabel: "新增公告",
    boundary: "公告 = 發布內容",
  },
  {
    key: "events",
    title: "活動",
    shortTitle: "活動",
    description: "活動資料：活動日期、籌備狀態、參與對象與公告關聯。",
    route: "/events",
    addLabel: "新增活動",
    boundary: "活動 = 活動資料",
  },
  {
    key: "procurements",
    title: "採購管理",
    shortTitle: "採購",
    description: "廟務重要子功能：請購、估價、驗收與帳務關聯摘要。",
    route: "/procurements",
    addLabel: "新增採購",
    boundary: "採購管理 = 廟務管理的重要子功能",
  },
  {
    key: "documents",
    title: "公文 / 通知",
    shortTitle: "公文",
    description: "文件紀錄：來文、發文、內部通知與待追蹤事項。",
    route: "/documents",
    addLabel: "新增文件紀錄",
    boundary: "公文 / 通知 = 文件紀錄，不等於公告 / 活動",
  },
  {
    key: "team",
    title: "團隊管理",
    shortTitle: "團隊",
    description: "團隊成員、職務任期、值勤安排與系統角色摘要。",
    route: "/team",
    addLabel: "新增團隊成員",
    boundary: "廟務職務與系統權限分開",
  },
  {
    key: "ledger",
    title: "帳務管理",
    shortTitle: "帳務",
    description: "管錢：流水草稿、分類、月報公告草稿與關聯支出。",
    route: "/ledger",
    addLabel: "新增帳務草稿",
    boundary: "帳務管理 = 管錢",
  },
];

export function findModuleByRoute(path: string) {
  return modules.find((moduleItem) => moduleItem.route === path);
}

export function findModuleByKey(key: ModuleKey) {
  return modules.find((moduleItem) => moduleItem.key === key);
}
