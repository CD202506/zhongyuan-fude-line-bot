import type { ModuleKey } from "./modules";

export type EditField =
  | { key: string; label: string; type: "text" | "textarea" | "date" | "number"; value: string; readonly?: boolean }
  | { key: string; label: string; type: "select"; value: string; options: string[]; readonly?: boolean }
  | { key: string; label: string; type: "tags"; value: string[]; options: string[]; readonly?: boolean };

export type MockRecord = {
  id: string;
  moduleKey: ModuleKey;
  title: string;
  status: string;
  statusCategory: "active" | "pending" | "archived" | "disabled" | "draft";
  summary: string;
  owner: string;
  dateLabel: string;
  relation: string;
  note: string;
  listFields: Array<{ label: string; value: string }>;
  detailFields: Array<{ label: string; value: string }>;
  editFields: EditField[];
};

export const mockRecords: MockRecord[] = [
  {
    id: "affair-a",
    moduleKey: "temple-affairs",
    title: "中元普渡準備",
    status: "待確認",
    statusCategory: "pending",
    summary: "整理供品、場地、值勤與公告關聯。",
    owner: "經手人 A",
    dateLabel: "2026-07-01",
    relation: "關聯：平安祈福活動、供品採買",
    note: "場地與值勤名單確認後，再送管理者確認。",
    listFields: [
      { label: "事項", value: "普渡準備" },
      { label: "負責", value: "總務組" },
      { label: "期限", value: "7/1 前" },
    ],
    detailFields: [
      { label: "廟務類型", value: "祭典準備" },
      { label: "負責組別", value: "總務組" },
      { label: "待確認", value: "供品數量、桌椅、值勤人員" },
      { label: "關聯支出", value: "供品採買" },
    ],
    editFields: [
      { key: "title", label: "事項名稱", type: "text", value: "中元普渡準備" },
      { key: "affairType", label: "廟務類型", type: "select", value: "祭典準備", options: ["祭典準備", "日常維護", "接待支援", "行政協調"] },
      { key: "ownerGroup", label: "負責組別", type: "select", value: "總務組", options: ["總務組", "接待組", "文書組", "帳務組"] },
      { key: "date", label: "日期", type: "date", value: "2026-07-01" },
      { key: "status", label: "狀態", type: "select", value: "待確認", options: ["待確認", "籌備中", "已完成", "暫緩"] },
      { key: "supportItems", label: "支援項目", type: "tags", value: ["供品", "桌椅", "值勤"], options: ["供品", "桌椅", "值勤", "公告", "接待"] },
      { key: "note", label: "備註", type: "textarea", value: "場地與值勤名單確認後，再送管理者確認。" },
    ],
  },
  {
    id: "devotee-a",
    moduleKey: "devotees",
    title: "善信範例 A",
    status: "啟用",
    statusCategory: "active",
    summary: "授權狀態、年度服務紀錄與備註摘要。",
    owner: "櫃檯人員 A",
    dateLabel: "2026-06-18",
    relation: "關聯：發財金服務紀錄、帳務草稿",
    note: "不含真實電話、地址或 LINE user id。",
    listFields: [
      { label: "服務", value: "發財金" },
      { label: "授權", value: "已同意查詢本人紀錄" },
      { label: "最近", value: "6/18 櫃檯登記" },
    ],
    detailFields: [
      { label: "善信類型", value: "一般善信" },
      { label: "服務紀錄", value: "發財金、還金提醒" },
      { label: "授權狀態", value: "可查詢本人相關紀錄" },
      { label: "經手人", value: "櫃檯人員 A" },
    ],
    editFields: [
      { key: "name", label: "善信名稱", type: "text", value: "善信範例 A" },
      { key: "devoteeType", label: "善信類型", type: "select", value: "一般善信", options: ["一般善信", "長期服務", "活動聯絡", "團隊協助"] },
      { key: "services", label: "服務紀錄", type: "tags", value: ["發財金", "還金提醒"], options: ["發財金", "平安龜", "還金提醒", "活動通知"] },
      { key: "authorization", label: "授權狀態", type: "select", value: "可查詢本人相關紀錄", options: ["可查詢本人相關紀錄", "未授權查詢", "待確認"] },
      { key: "handler", label: "經手人", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"] },
      { key: "note", label: "備註", type: "textarea", value: "不含真實電話、地址或 LINE user id。" },
    ],
  },
  {
    id: "shrine-a",
    moduleKey: "shrines",
    title: "友宮範例 A",
    status: "常態往來",
    statusCategory: "active",
    summary: "友宮主檔、聯絡窗口與互訪摘要。",
    owner: "聯絡窗口 A",
    dateLabel: "2026-06-20",
    relation: "關聯：進香回覆",
    note: "用來檢視友宮管理流程。",
    listFields: [
      { label: "關係", value: "常態往來" },
      { label: "窗口", value: "聯絡窗口 A" },
      { label: "最近互動", value: "6/20 來訪確認" },
    ],
    detailFields: [
      { label: "宮廟類型", value: "友宮" },
      { label: "主要窗口", value: "聯絡窗口 A" },
      { label: "最近來訪", value: "進香回覆" },
      { label: "下一步", value: "確認回覆內容與接待安排" },
    ],
    editFields: [
      { key: "name", label: "友宮名稱", type: "text", value: "友宮範例 A" },
      { key: "area", label: "地區", type: "text", value: "桃園地區" },
      { key: "relationStatus", label: "互動狀態", type: "select", value: "常態往來", options: ["常態往來", "近期來訪", "待回覆", "暫少往來"] },
      { key: "contact", label: "聯絡方式", type: "text", value: "聯絡窗口 A" },
      { key: "relations", label: "關聯紀錄", type: "tags", value: ["進香回覆"], options: ["進香回覆", "請帖", "公告", "活動支援"] },
      { key: "nextStep", label: "下一步", type: "textarea", value: "確認回覆內容與接待安排" },
    ],
  },
  {
    id: "visit-a",
    moduleKey: "visits",
    title: "進香回覆",
    status: "待回覆",
    statusCategory: "pending",
    summary: "待確認日期、人數、接待窗口與請帖狀態。",
    owner: "接待人員 A",
    dateLabel: "2026-07-08",
    relation: "關聯：友宮範例 A、參拜動線提醒",
    note: "列表頁只可查看詳情，回覆操作放在詳情內。",
    listFields: [
      { label: "型態", value: "進香" },
      { label: "人數", value: "約 30 人" },
      { label: "請帖", value: "待回覆" },
    ],
    detailFields: [
      { label: "來訪型態", value: "進香" },
      { label: "預計人數", value: "約 30 人" },
      { label: "接待窗口", value: "接待人員 A" },
      { label: "待辦", value: "確認日期、回覆請帖、安排接待" },
    ],
    editFields: [
      { key: "visitType", label: "來訪類型", type: "select", value: "進香", options: ["參訪", "進香", "請帖", "祝壽", "聯誼"] },
      { key: "replyStatus", label: "回覆狀態", type: "select", value: "待回覆", options: ["待回覆", "已回覆", "待補資料", "已取消"] },
      { key: "date", label: "來訪日期", type: "date", value: "2026-07-08" },
      { key: "relatedShrine", label: "關聯友宮", type: "select", value: "友宮範例 A", options: ["友宮範例 A", "友宮範例 B", "尚未指定"] },
      { key: "people", label: "預計人數", type: "number", value: "30" },
      { key: "note", label: "備註", type: "textarea", value: "確認日期、回覆請帖、安排接待" },
    ],
  },
  {
    id: "announcement-a",
    moduleKey: "announcements",
    title: "參拜動線提醒",
    status: "草稿",
    statusCategory: "draft",
    summary: "公告文案、發布管道與預覽狀態。",
    owner: "發布人員 A",
    dateLabel: "2026-06-22",
    relation: "關聯：平安祈福活動",
    note: "公告內容仍在草稿階段。",
    listFields: [
      { label: "對象", value: "一般信眾" },
      { label: "管道", value: "公告欄、社群" },
      { label: "狀態", value: "草稿" },
    ],
    detailFields: [
      { label: "公告對象", value: "一般信眾" },
      { label: "發布管道", value: "公告欄、社群" },
      { label: "文案狀態", value: "待確認" },
      { label: "關聯活動", value: "平安祈福活動" },
    ],
    editFields: [
      { key: "title", label: "公告標題", type: "text", value: "參拜動線提醒" },
      { key: "channels", label: "發布管道", type: "tags", value: ["公告欄", "社群"], options: ["公告欄", "社群", "LINE 群組", "現場口頭提醒"] },
      { key: "status", label: "公告狀態", type: "select", value: "草稿", options: ["草稿", "待確認", "可發布", "已封存"] },
      { key: "publishDate", label: "發布日期", type: "date", value: "2026-06-22" },
      { key: "summary", label: "內容摘要", type: "textarea", value: "公告文案、發布管道與預覽狀態。" },
    ],
  },
  {
    id: "event-a",
    moduleKey: "events",
    title: "平安祈福活動",
    status: "籌備中",
    statusCategory: "active",
    summary: "活動日期、負責窗口、公告草稿與準備事項。",
    owner: "活動窗口 A",
    dateLabel: "2026-08-15",
    relation: "關聯：中元普渡準備、參拜動線提醒",
    note: "用來檢視活動籌備流程。",
    listFields: [
      { label: "日期", value: "8/15" },
      { label: "窗口", value: "活動窗口 A" },
      { label: "公告", value: "草稿中" },
    ],
    detailFields: [
      { label: "活動日期", value: "2026-08-15" },
      { label: "負責窗口", value: "活動窗口 A" },
      { label: "準備事項", value: "場地、供品、公告文案" },
      { label: "關聯公告", value: "參拜動線提醒" },
    ],
    editFields: [
      { key: "eventType", label: "活動類型", type: "select", value: "祈福活動", options: ["祈福活動", "祭典活動", "志工活動", "友宮交流"] },
      { key: "date", label: "活動日期", type: "date", value: "2026-08-15" },
      { key: "supportItems", label: "支援項目", type: "tags", value: ["場地", "供品", "公告"], options: ["場地", "供品", "公告", "值勤", "接待"] },
      { key: "status", label: "狀態", type: "select", value: "籌備中", options: ["籌備中", "待確認", "已完成", "暫緩"] },
      { key: "owner", label: "負責窗口", type: "text", value: "活動窗口 A" },
    ],
  },
  {
    id: "procurement-a",
    moduleKey: "procurements",
    title: "供品採買",
    status: "待確認",
    statusCategory: "pending",
    summary: "請購原因、估價、驗收與帳務草稿關聯。",
    owner: "採購人員 A",
    dateLabel: "2026-06-25",
    relation: "關聯：中元普渡準備、支出草稿",
    note: "不含真實廠商、帳戶或收據號碼。",
    listFields: [
      { label: "用途", value: "普渡供品" },
      { label: "驗收", value: "待確認" },
      { label: "帳務", value: "待對齊" },
    ],
    detailFields: [
      { label: "採購用途", value: "普渡供品" },
      { label: "請購原因", value: "中元普渡準備" },
      { label: "驗收狀態", value: "待確認數量與品項" },
      { label: "帳務關聯", value: "支出草稿" },
    ],
    editFields: [
      { key: "category", label: "採購類別", type: "select", value: "供品", options: ["供品", "餐點", "設備", "文具", "其他"] },
      { key: "amount", label: "金額", type: "number", value: "3600" },
      { key: "status", label: "狀態", type: "select", value: "待確認", options: ["待確認", "估價中", "已驗收", "待對帳"] },
      { key: "supplier", label: "供應商", type: "text", value: "供應商範例 A" },
      { key: "note", label: "備註", type: "textarea", value: "不含真實廠商、帳戶或收據號碼。" },
    ],
  },
  {
    id: "document-a",
    moduleKey: "documents",
    title: "區公所通知",
    status: "待整理",
    statusCategory: "pending",
    summary: "收文日期、處理狀態、附件與追蹤提醒。",
    owner: "文書人員 A",
    dateLabel: "2026-06-21",
    relation: "關聯：中元普渡準備",
    note: "公文 / 通知是文件紀錄，不等於公告。",
    listFields: [
      { label: "類型", value: "來文" },
      { label: "來源", value: "行政單位" },
      { label: "處理", value: "待整理" },
    ],
    detailFields: [
      { label: "文件類型", value: "來文通知" },
      { label: "來源單位", value: "行政單位" },
      { label: "處理狀態", value: "待整理附件與回覆期限" },
      { label: "關聯廟務", value: "中元普渡準備" },
    ],
    editFields: [
      { key: "documentType", label: "文件類型", type: "select", value: "來文通知", options: ["來文通知", "發文紀錄", "內部通知", "會議通知"] },
      { key: "date", label: "公文日期", type: "date", value: "2026-06-21" },
      { key: "status", label: "處理狀態", type: "select", value: "待整理", options: ["待整理", "處理中", "已回覆", "已歸檔"] },
      { key: "relatedItem", label: "關聯活動或廟務", type: "text", value: "中元普渡準備" },
      { key: "note", label: "備註", type: "textarea", value: "待整理附件與回覆期限" },
    ],
  },
  {
    id: "team-a",
    moduleKey: "team",
    title: "團隊成員範例 A",
    status: "任期中",
    statusCategory: "active",
    summary: "廟務職務、系統角色與值勤摘要。",
    owner: "總幹事 A",
    dateLabel: "2026-06-01",
    relation: "關聯：值勤安排",
    note: "廟務職務不等於系統權限。",
    listFields: [
      { label: "職務", value: "總務協助" },
      { label: "值勤", value: "週末上午" },
      { label: "權限", value: "日常作業" },
    ],
    detailFields: [
      { label: "廟務職務", value: "總務協助" },
      { label: "值勤安排", value: "週末上午" },
      { label: "系統角色", value: "日常作業" },
      { label: "任期狀態", value: "任期中" },
    ],
    editFields: [
      { key: "role", label: "職務", type: "select", value: "總務協助", options: ["主任委員", "總幹事", "總務協助", "值勤志工"] },
      { key: "systemRole", label: "權限角色", type: "select", value: "日常作業", options: ["管理者", "日常作業", "查看資料"] },
      { key: "termStatus", label: "任期狀態", type: "select", value: "任期中", options: ["任期中", "待確認", "已卸任", "暫停"] },
      { key: "duty", label: "值勤安排", type: "tags", value: ["週末上午"], options: ["週末上午", "週末下午", "平日晚間", "活動支援"] },
      { key: "note", label: "聯絡備註", type: "textarea", value: "廟務職務不等於系統權限。" },
    ],
  },
  {
    id: "ledger-a",
    moduleKey: "ledger",
    title: "供品支出草稿",
    status: "草稿",
    statusCategory: "draft",
    summary: "分類、金額摘要、經手人與月報公告草稿。",
    owner: "帳務人員 A",
    dateLabel: "2026-06-23",
    relation: "關聯：供品採買、善信範例 A",
    note: "不含真實銀行資料、帳戶或收據號碼。",
    listFields: [
      { label: "科目", value: "供品支出" },
      { label: "經手", value: "帳務人員 A" },
      { label: "月報", value: "待整理" },
    ],
    detailFields: [
      { label: "帳務科目", value: "供品支出" },
      { label: "經手人", value: "帳務人員 A" },
      { label: "關聯來源", value: "供品採買" },
      { label: "月報狀態", value: "待整理公告草稿" },
    ],
    editFields: [
      { key: "cashType", label: "收支類型", type: "select", value: "支出", options: ["收入", "支出", "調整"] },
      { key: "amount", label: "金額", type: "number", value: "3600" },
      { key: "category", label: "類別", type: "select", value: "供品支出", options: ["香油錢", "供品支出", "活動支出", "其他"] },
      { key: "relations", label: "關聯紀錄", type: "tags", value: ["供品採買", "善信範例 A"], options: ["供品採買", "善信範例 A", "平安祈福活動", "中元普渡準備"] },
      { key: "note", label: "備註", type: "textarea", value: "不含真實銀行資料、帳戶或收據號碼。" },
    ],
  },
  {
    id: "devotee-archived",
    moduleKey: "devotees",
    title: "善信封存紀錄",
    status: "已封存",
    statusCategory: "archived",
    summary: "舊年度服務紀錄已封存，仍保留於紀錄中。",
    owner: "櫃檯人員 A",
    dateLabel: "2025-12-20",
    relation: "關聯：舊年度服務紀錄",
    note: "封存後不在日常列表優先顯示。",
    listFields: [
      { label: "服務", value: "舊年度紀錄" },
      { label: "授權", value: "已封存" },
      { label: "最近", value: "2025 年度整理" },
    ],
    detailFields: [
      { label: "善信類型", value: "一般善信" },
      { label: "服務紀錄", value: "舊年度服務" },
      { label: "授權狀態", value: "已封存" },
      { label: "經手人", value: "櫃檯人員 A" },
    ],
    editFields: [
      { key: "name", label: "善信名稱", type: "text", value: "善信封存紀錄" },
      { key: "devoteeType", label: "善信類型", type: "select", value: "一般善信", options: ["一般善信", "長期服務", "活動聯絡", "團隊協助"] },
      { key: "services", label: "服務紀錄", type: "tags", value: ["舊年度服務"], options: ["發財金", "平安龜", "還金提醒", "活動通知", "舊年度服務"] },
      { key: "authorization", label: "授權狀態", type: "select", value: "已封存", options: ["可查詢本人相關紀錄", "未授權查詢", "待確認", "已封存"] },
      { key: "handler", label: "經手人", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"] },
      { key: "note", label: "備註", type: "textarea", value: "封存後不在日常列表優先顯示。" },
    ],
  },
];

export const reminders = [
  "待回覆請帖 2 筆，請確認接待窗口。",
  "採購驗收與帳務草稿需對齊。",
  "公文 / 通知仍有待整理項目。",
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
