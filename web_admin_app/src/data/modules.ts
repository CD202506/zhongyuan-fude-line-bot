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
    description: "例行工作、祭典準備、承辦人員、處理狀態與預計完成日。",
    route: "/temple-affairs",
    addLabel: "新增廟務紀錄",
    boundary: "日常作業",
  },
  {
    key: "devotees",
    title: "善信管理",
    shortTitle: "善信",
    description: "維護善信基本資料、授權狀態、發財金領取 / 繳回與相關紀錄。",
    route: "/devotees",
    addLabel: "新增善信",
    boundary: "日常作業",
  },
  {
    key: "shrines",
    title: "友宮管理",
    shortTitle: "友宮",
    description: "維護友宮名稱、地區、聯絡窗口、電話地址與聯誼 / 拜訪紀錄。",
    route: "/shrines",
    addLabel: "新增友宮",
    boundary: "日常作業",
  },
  {
    key: "visits",
    title: "來訪 / 請帖",
    shortTitle: "來訪",
    description: "處理來源單位、來訪 / 請帖日期、回覆狀態、承辦人員與是否整理成發布內容。",
    route: "/visits",
    addLabel: "新增來訪 / 請帖",
    boundary: "日常作業",
  },
  {
    key: "announcements",
    title: "發布內容",
    shortTitle: "發布",
    description: "由來源資料整理發布草稿，選擇發布類別、發布管道、可見對象與公開內容範圍。",
    route: "/announcements",
    addLabel: "新增發布內容",
    boundary: "對外發布",
  },
  {
    key: "events",
    title: "活動消息",
    shortTitle: "活動",
    description: "活動消息可由廟務或友宮聯誼資料整理，決定發布管道與可見對象。",
    route: "/events",
    addLabel: "新增活動消息",
    boundary: "對外發布",
  },
  {
    key: "procurements",
    title: "採購管理",
    shortTitle: "採購",
    description: "處理需求用途、採購類別、預估金額、審核標記與是否進入帳務。",
    route: "/procurements",
    addLabel: "新增採購",
    boundary: "日常作業",
  },
  {
    key: "documents",
    title: "公文紀錄",
    shortTitle: "公文",
    description: "公文紀錄為文件留存；通知發布需由承辦人整理部分內容後進入發布內容。",
    route: "/documents",
    addLabel: "新增公文紀錄",
    boundary: "日常作業",
  },
  {
    key: "team",
    title: "團隊管理",
    shortTitle: "團隊",
    description: "管理團隊成員、宮廟職稱、任期、帳號連結狀態與系統權限摘要。",
    route: "/team",
    addLabel: "新增團隊成員",
    boundary: "管理者設定",
  },
  {
    key: "ledger",
    title: "帳務管理",
    shortTitle: "帳務",
    description: "記錄帳務日期、關聯採購、實際金額、付款狀態與內部備註。",
    route: "/ledger",
    addLabel: "新增帳務草稿",
    boundary: "日常作業",
  },
];

export function findModuleByRoute(path: string) {
  return modules.find((moduleItem) => moduleItem.route === path);
}

export function findModuleByKey(key: ModuleKey) {
  return modules.find((moduleItem) => moduleItem.key === key);
}
