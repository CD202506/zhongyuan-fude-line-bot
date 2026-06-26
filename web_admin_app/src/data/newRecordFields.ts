import type { EditField } from "./mockRecords";
import type { ModuleKey } from "./modules";

export const newRecordFields: Record<ModuleKey, EditField[]> = {
  "temple-affairs": [
    { key: "name", label: "廟務名稱", type: "text", value: "" },
    { key: "type", label: "廟務類型", type: "select", value: "祭典準備", options: ["祭典準備", "日常維護", "接待支援", "行政協調"] },
    { key: "date", label: "日期", type: "date", value: "2026-07-01" },
    { key: "group", label: "負責組別", type: "select", value: "總務組", options: ["總務組", "接待組", "文書組", "帳務組"] },
    { key: "status", label: "狀態", type: "select", value: "待確認", options: ["待確認", "籌備中", "已完成", "暫緩"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  devotees: [
    { key: "name", label: "善信名稱", type: "text", value: "" },
    { key: "type", label: "善信類型", type: "select", value: "一般善信", options: ["一般善信", "長期服務", "活動聯絡", "團隊協助"] },
    { key: "authorization", label: "授權狀態", type: "select", value: "待確認", options: ["待確認", "可查詢本人相關紀錄", "未授權查詢"] },
    { key: "services", label: "服務紀錄", type: "tags", value: ["發財金"], options: ["發財金", "平安龜", "還金提醒", "活動通知"] },
    { key: "handler", label: "經手人", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  shrines: [
    { key: "name", label: "友宮名稱", type: "text", value: "" },
    { key: "area", label: "地區", type: "text", value: "" },
    { key: "status", label: "聯繫狀態", type: "select", value: "待聯繫", options: ["待聯繫", "常態往來", "近期來訪", "暫少往來"] },
    { key: "relations", label: "關聯紀錄", type: "tags", value: [], options: ["來訪", "請帖", "公告", "活動支援"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  visits: [
    { key: "name", label: "來訪或請帖名稱", type: "text", value: "" },
    { key: "type", label: "來訪類型", type: "select", value: "進香", options: ["參訪", "進香", "請帖", "祝壽", "聯誼"] },
    { key: "date", label: "日期", type: "date", value: "2026-07-08" },
    { key: "replyStatus", label: "回覆狀態", type: "select", value: "待回覆", options: ["待回覆", "已回覆", "待補資料", "已取消"] },
    { key: "relatedShrine", label: "關聯友宮", type: "select", value: "友宮範例 A", options: ["友宮範例 A", "友宮範例 B", "尚未指定"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  announcements: [
    { key: "title", label: "公告標題", type: "text", value: "" },
    { key: "channels", label: "發布管道", type: "tags", value: ["公告欄"], options: ["公告欄", "社群", "LINE 群組", "現場口頭提醒"] },
    { key: "date", label: "發布日期", type: "date", value: "2026-06-22" },
    { key: "status", label: "公告狀態", type: "select", value: "草稿", options: ["草稿", "待確認", "可發布", "已封存"] },
    { key: "summary", label: "內容摘要", type: "textarea", value: "" },
  ],
  events: [
    { key: "name", label: "活動名稱", type: "text", value: "" },
    { key: "type", label: "活動類型", type: "select", value: "祈福活動", options: ["祈福活動", "祭典活動", "志工活動", "友宮交流"] },
    { key: "date", label: "活動日期", type: "date", value: "2026-08-15" },
    { key: "supportItems", label: "支援項目", type: "tags", value: ["場地"], options: ["場地", "供品", "公告", "值勤", "接待"] },
    { key: "status", label: "狀態", type: "select", value: "籌備中", options: ["籌備中", "待確認", "已完成", "暫緩"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  procurements: [
    { key: "name", label: "採購項目", type: "text", value: "" },
    { key: "category", label: "採購類別", type: "select", value: "供品", options: ["供品", "餐點", "設備", "文具", "其他"] },
    { key: "amount", label: "金額", type: "number", value: "" },
    { key: "supplier", label: "供應商", type: "text", value: "" },
    { key: "status", label: "狀態", type: "select", value: "待確認", options: ["待確認", "估價中", "已驗收", "待對帳"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  documents: [
    { key: "title", label: "文件標題", type: "text", value: "" },
    { key: "type", label: "文件類型", type: "select", value: "來文通知", options: ["來文通知", "發文紀錄", "內部通知", "會議通知"] },
    { key: "date", label: "日期", type: "date", value: "2026-06-21" },
    { key: "status", label: "處理狀態", type: "select", value: "待整理", options: ["待整理", "處理中", "已回覆", "已歸檔"] },
    { key: "relatedItem", label: "關聯廟務或活動", type: "text", value: "" },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
  team: [
    { key: "name", label: "成員姓名", type: "text", value: "" },
    { key: "role", label: "職務", type: "select", value: "值勤志工", options: ["主任委員", "總幹事", "總務協助", "值勤志工"] },
    { key: "systemRole", label: "權限角色", type: "select", value: "查看資料", options: ["管理者", "日常作業", "查看資料"] },
    { key: "termStatus", label: "任期狀態", type: "select", value: "待確認", options: ["任期中", "待確認", "已卸任", "暫停"] },
    { key: "note", label: "聯絡備註", type: "textarea", value: "" },
  ],
  ledger: [
    { key: "name", label: "帳務名稱", type: "text", value: "" },
    { key: "cashType", label: "收支類型", type: "select", value: "支出", options: ["收入", "支出", "調整"] },
    { key: "amount", label: "金額", type: "number", value: "" },
    { key: "category", label: "類別", type: "select", value: "供品支出", options: ["香油錢", "供品支出", "活動支出", "其他"] },
    { key: "relations", label: "關聯紀錄", type: "tags", value: [], options: ["供品採買", "善信範例 A", "平安祈福活動", "中元普渡準備"] },
    { key: "note", label: "備註", type: "textarea", value: "" },
  ],
};

export const adminConfirmModules: ModuleKey[] = ["procurements", "documents", "ledger"];
