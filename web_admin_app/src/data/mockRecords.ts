import type { ModuleKey } from "./modules";

export type MockRecord = {
  id: string;
  moduleKey: ModuleKey;
  title: string;
  status: string;
  summary: string;
  owner: string;
  dateLabel: string;
  relation: string;
  note: string;
};

export const mockRecords: MockRecord[] = [
  {
    id: "affair-a",
    moduleKey: "temple-affairs",
    title: "測試廟務 A：中元普渡準備",
    status: "待確認",
    summary: "整理供品、場地、值勤與公告關聯。",
    owner: "測試經手人 A",
    dateLabel: "2026-07-01",
    relation: "關聯：測試活動 A、測試採購 A",
    note: "用來檢視廟務準備流程。",
  },
  {
    id: "devotee-a",
    moduleKey: "devotees",
    title: "測試善信 A",
    status: "啟用",
    summary: "授權狀態、年度服務紀錄與備註摘要。",
    owner: "測試櫃檯 A",
    dateLabel: "2026-06-18",
    relation: "關聯：測試帳務草稿 A",
    note: "不含真實電話、地址或 LINE user id。",
  },
  {
    id: "shrine-a",
    moduleKey: "shrines",
    title: "測試友宮 A",
    status: "常態往來",
    summary: "友宮主檔、聯絡窗口與互訪摘要。",
    owner: "測試聯絡人 A",
    dateLabel: "2026-06-20",
    relation: "關聯：測試來訪 A",
    note: "用來檢視友宮管理流程。",
  },
  {
    id: "visit-a",
    moduleKey: "visits",
    title: "測試來訪 A：進香回覆",
    status: "待回覆",
    summary: "待確認日期、人數、接待窗口與請帖狀態。",
    owner: "測試接待 A",
    dateLabel: "2026-07-08",
    relation: "關聯：測試友宮 A、測試公告 A",
    note: "列表頁只可查看詳情，回覆操作放在詳情內。",
  },
  {
    id: "announcement-a",
    moduleKey: "announcements",
    title: "測試公告 A：參拜動線提醒",
    status: "草稿",
    summary: "公告文案、發布管道與預覽狀態。",
    owner: "測試發布者 A",
    dateLabel: "2026-06-22",
    relation: "關聯：測試活動 A",
    note: "公告內容仍在草稿階段。",
  },
  {
    id: "event-a",
    moduleKey: "events",
    title: "測試活動 A：平安祈福",
    status: "籌備中",
    summary: "活動日期、負責窗口、公告草稿與準備事項。",
    owner: "測試活動窗口 A",
    dateLabel: "2026-08-15",
    relation: "關聯：測試廟務 A、測試公告 A",
    note: "用來檢視活動籌備流程。",
  },
  {
    id: "procurement-a",
    moduleKey: "procurements",
    title: "測試採購 A：供品採買",
    status: "待確認",
    summary: "請購原因、估價、驗收與帳務草稿關聯。",
    owner: "測試採購 A",
    dateLabel: "2026-06-25",
    relation: "關聯：測試廟務 A、測試帳務草稿 A",
    note: "不含真實廠商、帳戶或收據號碼。",
  },
  {
    id: "document-a",
    moduleKey: "documents",
    title: "測試公文 A：區公所通知",
    status: "待整理",
    summary: "收文日期、處理狀態、附件與追蹤提醒。",
    owner: "測試文書 A",
    dateLabel: "2026-06-21",
    relation: "關聯：測試廟務 A",
    note: "公文 / 通知是文件紀錄，不等於公告。",
  },
  {
    id: "team-a",
    moduleKey: "team",
    title: "測試團隊成員 A",
    status: "任期中",
    summary: "廟務職務、系統角色與值勤摘要。",
    owner: "測試總幹事 A",
    dateLabel: "2026-06-01",
    relation: "關聯：測試值勤 A",
    note: "廟務職務不等於系統權限。",
  },
  {
    id: "ledger-a",
    moduleKey: "ledger",
    title: "測試帳務草稿 A",
    status: "草稿",
    summary: "分類、金額摘要、經手人與月報公告草稿。",
    owner: "測試帳務 A",
    dateLabel: "2026-06-23",
    relation: "關聯：測試採購 A、測試善信 A",
    note: "不含真實銀行資料、帳戶或收據號碼。",
  },
];

export const reminders = [
  "測試提醒 A：待確認請帖回覆 2 筆。",
  "測試提醒 B：採購驗收與帳務草稿需對齊。",
  "測試提醒 C：公文 / 通知仍有待整理項目。",
];

export const mockDataStatus = [
  "待確認資料整理規則。",
  "待確認權限與審核流程。",
  "待確認後續維運窗口。",
];

export function recordsForModule(moduleKey: ModuleKey) {
  return mockRecords.filter((record) => record.moduleKey === moduleKey);
}

export function recordById(id: string) {
  return mockRecords.find((record) => record.id === id);
}
