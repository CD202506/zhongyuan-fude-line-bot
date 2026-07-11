import type { ModuleKey } from "./modules";
import { formatDisplayDate } from "../lib/dateFormat";

export type EditField =
  | { key: string; label: string; type: "text" | "textarea" | "date" | "number"; value: string; readonly?: boolean; help?: string }
  | { key: string; label: string; type: "select"; value: string; options: string[]; readonly?: boolean; help?: string }
  | { key: string; label: string; type: "tags"; value: string[]; options: string[]; readonly?: boolean; help?: string };

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
    owner: "總幹事 A",
    dateLabel: "2026-07-01",
    relation: "平安祈福活動、供品採買",
    note: "場地與值勤名單確認後，再送管理者確認。",
    listFields: [
      { label: "事項", value: "普渡準備" },
      { label: "承辦", value: "總務組" },
      { label: "預計完成", value: "7/1 前" },
    ],
    detailFields: [
      { label: "廟務類型", value: "祭典準備" },
      { label: "負責組別", value: "總務組" },
      { label: "待確認", value: "供品數量、桌椅、值勤人員" },
      { label: "關聯支出", value: "供品採買" },
    ],
    editFields: [
      { key: "title", label: "事項名稱", type: "text", value: "中元普渡準備" },
      { key: "affairType", label: "廟務類別", type: "select", value: "祭典活動", options: ["一般廟務", "祭典活動", "場地事務", "對外聯繫", "其他"] },
      { key: "ownerGroup", label: "承辦人員", type: "select", value: "總務組", options: ["主任委員 A", "總幹事 A", "總務組", "接待組", "文書組", "帳務組"] },
      { key: "date", label: "發生日期", type: "date", value: "2026-07-01" },
      { key: "dueDate", label: "預計完成日", type: "date", value: "2026-07-01" },
      { key: "status", label: "處理狀態", type: "select", value: "待處理", options: ["待處理", "處理中", "已完成", "暫緩"] },
      { key: "approvalStage", label: "審核標記", type: "select", value: "初審", options: ["初審", "覆核", "核准", "暫不審核"] },
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
    summary: "善信基本資料與往來紀錄摘要。",
    owner: "櫃檯人員 A",
    dateLabel: "2026-06-18",
    relation: "發財金領取 / 繳回紀錄、帳務草稿",
    note: "不含真實電話、地址或 LINE 識別資料。",
    listFields: [
      { label: "服務", value: "發財金領取 / 繳回" },
      { label: "往來紀錄", value: "待返還：1 筆" },
      { label: "最近", value: "6/18 櫃檯登記" },
    ],
    detailFields: [
      { label: "善信類型", value: "一般善信" },
      { label: "建立日期", value: "2026-06-18" },
      { label: "往來分類", value: "有返還需求的財務往來" },
      { label: "往來類型", value: "發財金" },
      { label: "返還狀態", value: "待返還" },
      { label: "資料維護人員", value: "櫃檯人員 A" },
    ],
    editFields: [
      { key: "name", label: "善信姓名 / 代稱", type: "text", value: "善信範例 A" },
      { key: "date", label: "建立日期", type: "date", value: "2026-06-18" },
      { key: "devoteeType", label: "善信類型", type: "select", value: "一般善信", options: ["一般善信", "委員 / 志工相關", "友宮聯絡人", "其他"] },
      { key: "mobile", label: "手機號碼", type: "text", value: "" },
      { key: "address", label: "地址", type: "text", value: "" },
      { key: "gender", label: "性別", type: "select", value: "未填寫", options: ["未填寫", "男", "女", "其他 / 不便透露"] },
      { key: "ageRange", label: "年齡級距", type: "select", value: "未填寫", options: ["未填寫", "14 以下", "15～24", "25～34", "35～44", "45～54", "55～64", "65 以上"], help: "只記錄級距，不填實際年齡。" },
      { key: "birthMonthDay", label: "出生月 / 日", type: "text", value: "", help: "非必填，只填月 / 日；農曆或國曆可另於備註說明。" },
      { key: "interactionCategory", label: "往來分類", type: "select", value: "有返還需求的財務往來", options: ["沒有往來紀錄", "有返還需求的財務往來", "不需返還的財務紀錄", "非財務物資往來"] },
      { key: "interactionType", label: "往來類型", type: "select", value: "發財金", options: ["未填寫", "發財金", "平安龜", "善信捐款", "香油錢", "金牌", "物資捐贈", "供品捐贈", "其他"] },
      { key: "interactionDate", label: "往來日期", type: "date", value: "2026-06-18" },
      { key: "returnStatus", label: "返還狀態", type: "select", value: "待返還", options: ["不需返還", "待返還", "已返還", "逾期提醒"] },
      { key: "returnDate", label: "返還日期", type: "date", value: "2026-06-18" },
      { key: "returnReminder", label: "返還提醒", type: "select", value: "需要提醒", options: ["不提醒", "需要提醒", "已提醒"] },
      { key: "amountOrItem", label: "金額 / 品項", type: "text", value: "發財金" },
      { key: "quantityNote", label: "數量 / 備註", type: "text", value: "待返還確認" },
      { key: "receiver", label: "登錄 / 接收人員", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"] },
      { key: "handler", label: "資料維護人員", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"], help: "從可指派團隊成員中選擇。" },
      { key: "relations", label: "相關紀錄", type: "textarea", value: "發財金、待返還" },
      { key: "note", label: "備註", type: "textarea", value: "不含真實電話、地址或 LINE 識別資料。" },
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
    relation: "進香回覆",
    note: "用來檢視友宮管理流程。",
    listFields: [
      { label: "關係", value: "常態往來" },
      { label: "窗口", value: "聯絡窗口 A" },
      { label: "最近互動", value: "6/20 來訪確認" },
    ],
    detailFields: [
      { label: "宮廟類型", value: "友宮" },
      { label: "聯絡人", value: "聯絡窗口 A" },
      { label: "聯絡電話", value: "未填寫" },
      { label: "地址", value: "未填寫" },
      { label: "聯繫方式", value: "電話" },
      { label: "最近來訪", value: "進香回覆" },
      { label: "聯誼 / 拜訪紀錄", value: "進香回覆" },
    ],
    editFields: [
      { key: "name", label: "友宮名稱", type: "text", value: "友宮範例 A" },
      { key: "area", label: "地區", type: "text", value: "桃園地區" },
      { key: "relationStatus", label: "互動狀態", type: "select", value: "常態往來", options: ["常態往來", "近期來訪", "待回覆", "暫少往來"] },
      { key: "contactPerson", label: "聯絡人", type: "text", value: "聯絡窗口 A" },
      { key: "phone", label: "聯絡電話", type: "text", value: "" },
      { key: "address", label: "地址", type: "text", value: "" },
      { key: "contactMethod", label: "聯繫方式", type: "select", value: "電話", options: ["電話", "LINE", "Email", "其他"] },
      { key: "mainWindow", label: "主要聯絡窗口", type: "text", value: "聯絡窗口 A" },
      { key: "relations", label: "聯誼 / 拜訪紀錄", type: "textarea", value: "進香回覆" },
      { key: "note", label: "備註", type: "textarea", value: "確認回覆內容與接待安排" },
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
    relation: "友宮範例 A、參拜動線提醒",
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
      { key: "handler", label: "承辦人員", type: "select", value: "接待人員 A", options: ["主任委員 A", "總幹事 A", "櫃檯人員 A", "接待人員 A", "文書人員 A"] },
      { key: "processStatus", label: "處理狀態", type: "select", value: "待確認", options: ["待確認", "處理中", "已完成", "暫緩"] },
      { key: "publishingPlan", label: "是否產生發布內容", type: "select", value: "整理部分內容發布", options: ["暫不發布", "整理部分內容發布", "整理完整活動消息"] },
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
    relation: "平安祈福活動",
    note: "公告內容仍在草稿階段。",
    listFields: [
      { label: "可見對象", value: "公開" },
      { label: "管道", value: "公告欄、社群" },
      { label: "發布狀態", value: "草稿" },
    ],
    detailFields: [
      { label: "發布類別", value: "參拜資訊" },
      { label: "可見對象", value: "公開" },
      { label: "發布管道", value: "公告欄、社群" },
      { label: "發布狀態", value: "待確認" },
      { label: "來源資料", value: "平安祈福活動" },
      { label: "關聯活動", value: "平安祈福活動" },
    ],
    editFields: [
      { key: "title", label: "發布標題", type: "text", value: "參拜動線提醒" },
      { key: "sourceRecord", label: "來源資料", type: "text", value: "平安祈福活動", help: "來源資料可抽取部分或全部內容建立發布草稿，不代表來源資料會自動公開。" },
      { key: "category", label: "發布類別", type: "select", value: "參拜資訊", options: ["一般公告", "活動消息", "行政通知", "友宮聯誼", "發財金提醒", "參拜資訊"] },
      { key: "channels", label: "發布管道", type: "tags", value: ["公告欄列印"], options: ["網站", "LINE 官方帳號", "LINE VOOM", "Facebook", "內部備查", "公告欄列印"] },
      { key: "audience", label: "可見對象", type: "select", value: "公開", options: ["公開", "善信", "廟方人員", "管理者", "指定團隊成員", "內部備查"] },
      { key: "status", label: "發布狀態", type: "select", value: "草稿", options: ["草稿", "待確認", "已發布", "已封存"] },
      { key: "publishDate", label: "預計發布日", type: "date", value: "2026-06-22" },
      { key: "publicSummary", label: "公開內容", type: "textarea", value: "公告文案、發布管道與預覽狀態。" },
      { key: "internalNote", label: "內部備註", type: "textarea", value: "由活動資料整理部分內容。" },
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
    relation: "中元普渡準備、參拜動線提醒",
    note: "用來檢視活動籌備流程。",
    listFields: [
      { label: "日期", value: "8/15" },
      { label: "窗口", value: "活動窗口 A" },
      { label: "發布", value: "草稿中" },
    ],
    detailFields: [
      { label: "活動日期", value: "2026-08-15" },
      { label: "負責窗口", value: "活動窗口 A" },
      { label: "準備事項", value: "場地、供品、公告文案" },
      { label: "發布草稿", value: "參拜動線提醒" },
    ],
    editFields: [
      { key: "sourceRecord", label: "來源資料", type: "text", value: "中元普渡準備", help: "來源資料可抽取部分或全部內容建立發布草稿，不代表來源資料會自動公開。" },
      { key: "eventType", label: "發布類別", type: "select", value: "活動消息", options: ["一般公告", "活動消息", "行政通知", "友宮聯誼", "發財金提醒", "參拜資訊"] },
      { key: "date", label: "活動日期", type: "date", value: "2026-08-15" },
      { key: "channels", label: "發布管道", type: "tags", value: ["網站"], options: ["網站", "LINE 官方帳號", "LINE VOOM", "Facebook", "內部備查", "公告欄列印"] },
      { key: "audience", label: "可見對象", type: "select", value: "公開", options: ["公開", "善信", "廟方人員", "管理者", "指定團隊成員", "內部備查"] },
      { key: "status", label: "發布狀態", type: "select", value: "草稿", options: ["草稿", "待確認", "已發布", "已封存"] },
      { key: "publicSummary", label: "公開內容", type: "textarea", value: "活動日期與參拜提醒。" },
      { key: "internalNote", label: "內部備註", type: "textarea", value: "場地、供品、值勤細節僅內部備查。" },
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
    relation: "中元普渡準備、支出草稿",
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
      { key: "purpose", label: "需求用途", type: "text", value: "普渡供品" },
      { key: "category", label: "採購類別", type: "select", value: "供品", options: ["供品", "餐點", "設備", "文具", "活動用品", "其他"] },
      { key: "amount", label: "預估金額", type: "number", value: "3600" },
      { key: "quantity", label: "數量", type: "number", value: "1" },
      { key: "handler", label: "申請人 / 承辦人員", type: "select", value: "採購人員 A", options: ["主任委員 A", "總幹事 A", "採購人員 A", "帳務人員 A"] },
      { key: "status", label: "採購狀態", type: "select", value: "待確認", options: ["待確認", "估價中", "已驗收", "待對帳"] },
      { key: "ledgerHint", label: "是否進入帳務", type: "select", value: "是，待建立帳務", options: ["待確認", "是，待建立帳務", "否，僅留採購紀錄"] },
      { key: "approvalStage", label: "審核標記", type: "select", value: "初審", options: ["初審", "覆核", "核准", "暫不審核"] },
      { key: "supplier", label: "供應商", type: "text", value: "供應商範例 A" },
      { key: "note", label: "內部備註", type: "textarea", value: "不含真實廠商、帳戶或收據號碼。" },
    ],
  },
  {
    id: "document-a",
    moduleKey: "documents",
    title: "區公所通知",
    status: "待整理",
    statusCategory: "pending",
    summary: "公文紀錄為內部文件留存；通知發布需另整理部分內容。",
    owner: "文書人員 A",
    dateLabel: "2026-06-21",
    relation: "中元普渡準備",
    note: "公文紀錄是內部文件留存，不等於發布內容。",
    listFields: [
      { label: "類型", value: "來文" },
      { label: "來源", value: "行政單位" },
      { label: "處理", value: "待整理" },
    ],
    detailFields: [
      { label: "文件類型", value: "來文通知" },
      { label: "來源單位", value: "行政單位" },
      { label: "處理狀態", value: "待整理附件與回覆安排" },
      { label: "關聯廟務", value: "中元普渡準備" },
      { label: "通知發布", value: "可由承辦人整理部分內容後發布" },
    ],
    editFields: [
      { key: "documentType", label: "文件類型", type: "select", value: "公文紀錄", options: ["公文紀錄", "內部行政", "通知發布", "會議紀錄"] },
      { key: "date", label: "公文日期", type: "date", value: "2026-06-21" },
      { key: "handler", label: "承辦人員", type: "select", value: "文書人員 A", options: ["主任委員 A", "總幹事 A", "文書人員 A"] },
      { key: "status", label: "處理狀態", type: "select", value: "待確認", options: ["待確認", "處理中", "已完成", "暫緩"] },
      { key: "relatedItem", label: "關聯活動或廟務", type: "text", value: "中元普渡準備" },
      { key: "publishingPlan", label: "通知發布整理", type: "select", value: "僅內部留存", options: ["僅內部留存", "整理部分內容發布", "整理行政通知草稿"] },
      { key: "note", label: "內部備註", type: "textarea", value: "待整理附件與回覆安排" },
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
    relation: "值勤安排",
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
      { key: "role", label: "宮廟職稱", type: "select", value: "總幹事", options: ["主任委員", "副主任委員", "總幹事", "財務", "會計", "出納", "委員", "志工", "系統管理者", "一般工作人員", "其他"] },
      { key: "systemRole", label: "系統權限", type: "select", value: "廟方人員", options: ["管理者", "廟方人員", "善信瀏覽"] },
      { key: "lineBinding", label: "LINE 綁定狀態示意", type: "select", value: "已連到團隊成員", options: ["尚未連到 LINE 帳號", "已連到團隊成員", "已連到善信資料"] },
      { key: "termStatus", label: "任期狀態", type: "select", value: "任期中", options: ["任期中", "待確認", "已卸任", "暫停"] },
      { key: "enabled", label: "是否啟用", type: "select", value: "啟用", options: ["啟用", "停用"] },
      { key: "note", label: "任期 / 備註", type: "textarea", value: "廟務職務不等於系統權限。" },
    ],
  },
  {
    id: "ledger-a",
    moduleKey: "ledger",
    title: "供品支出草稿",
    status: "草稿",
    statusCategory: "draft",
    summary: "分類、實際金額、承辦人員與月報公告草稿。",
    owner: "帳務人員 A",
    dateLabel: "2026-06-23",
    relation: "供品採買、善信範例 A",
    note: "不含真實銀行資料、帳戶或收據號碼。",
    listFields: [
      { label: "科目", value: "供品支出" },
      { label: "承辦", value: "帳務人員 A" },
      { label: "月報", value: "待整理" },
    ],
    detailFields: [
      { label: "帳務科目", value: "供品支出" },
      { label: "帳務日期", value: "2026-06-23" },
      { label: "承辦人員", value: "帳務人員 A" },
      { label: "關聯來源", value: "供品採買" },
      { label: "付款狀態", value: "待核對" },
      { label: "月報狀態", value: "待整理公告草稿" },
    ],
    editFields: [
      { key: "cashType", label: "收支類型", type: "select", value: "支出", options: ["收入", "支出", "調整"] },
      { key: "date", label: "帳務日期", type: "date", value: "2026-06-23" },
      { key: "amount", label: "實際金額", type: "number", value: "3600" },
      { key: "quantity", label: "數量", type: "number", value: "1" },
      { key: "itemName", label: "品項", type: "text", value: "供品" },
      { key: "procurementNo", label: "採購單編號", type: "text", value: "採購範例 A" },
      { key: "paymentStatus", label: "付款狀態", type: "select", value: "待核對", options: ["待付款", "已付款", "待核對", "已封存"] },
      { key: "category", label: "帳務類別", type: "select", value: "供品支出", options: ["香油錢", "供品支出", "活動支出", "採購付款", "其他"] },
      { key: "relations", label: "相關紀錄", type: "tags", value: ["供品採買", "善信範例 A"], options: ["供品採買", "善信範例 A", "平安祈福活動", "中元普渡準備"] },
      { key: "handler", label: "經辦 / 承辦人員", type: "select", value: "帳務人員 A", options: ["主任委員 A", "總幹事 A", "帳務人員 A"] },
      { key: "note", label: "內部備註", type: "textarea", value: "不含真實銀行資料、帳戶或收據號碼。" },
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
    relation: "舊年度服務紀錄",
    note: "封存後不在日常列表優先顯示。",
    listFields: [
      { label: "服務", value: "舊年度紀錄" },
      { label: "授權", value: "已封存" },
      { label: "最近", value: "2025 年度整理" },
    ],
    detailFields: [
      { label: "善信類型", value: "一般善信" },
      { label: "服務紀錄", value: "舊年度服務" },
      { label: "往來紀錄", value: "舊年度服務" },
      { label: "資料維護人員", value: "櫃檯人員 A" },
    ],
    editFields: [
      { key: "name", label: "善信姓名 / 代稱", type: "text", value: "善信封存紀錄" },
      { key: "date", label: "建立日期", type: "date", value: "2025-12-20" },
      { key: "devoteeType", label: "善信類型", type: "select", value: "一般善信", options: ["一般善信", "委員 / 志工相關", "友宮聯絡人", "其他"] },
      { key: "mobile", label: "手機號碼", type: "text", value: "" },
      { key: "address", label: "地址", type: "text", value: "" },
      { key: "gender", label: "性別", type: "select", value: "未填寫", options: ["未填寫", "男", "女", "其他 / 不便透露"] },
      { key: "ageRange", label: "年齡級距", type: "select", value: "未填寫", options: ["未填寫", "14 以下", "15～24", "25～34", "35～44", "45～54", "55～64", "65 以上"] },
      { key: "birthMonthDay", label: "出生月 / 日", type: "text", value: "" },
      { key: "interactionCategory", label: "往來分類", type: "select", value: "沒有往來紀錄", options: ["沒有往來紀錄", "有返還需求的財務往來", "不需返還的財務紀錄", "非財務物資往來"] },
      { key: "interactionType", label: "往來類型", type: "select", value: "未填寫", options: ["未填寫", "發財金", "平安龜", "善信捐款", "香油錢", "金牌", "物資捐贈", "供品捐贈", "其他"] },
      { key: "handler", label: "資料維護人員", type: "select", value: "櫃檯人員 A", options: ["櫃檯人員 A", "值勤人員 A", "總幹事 A"], help: "從可指派團隊成員中選擇。" },
      { key: "note", label: "備註", type: "textarea", value: "封存後不在日常列表優先顯示。" },
    ],
  },
];

export const reminders = [
  "待回覆請帖 2 筆，請確認接待窗口。",
  "採購驗收與帳務草稿需對齊。",
  "公文紀錄仍有待整理項目，若需對外通知需另建發布內容。",
];

export const mockDataStatus = [
  "待確認資料整理規則。",
  "待確認權限與審核流程。",
  "待確認後續維運窗口。",
];

export function recordsForModule(moduleKey: ModuleKey) {
  return mockRecords.filter((record) => record.moduleKey === moduleKey).map(normalizeRecordDates);
}

export function recordById(id: string) {
  const record = mockRecords.find((item) => item.id === id);
  return record ? normalizeRecordDates(record) : undefined;
}

function normalizeRecordDates(record: MockRecord): MockRecord {
  return {
    ...record,
    dateLabel: formatDisplayDate(record.dateLabel),
    listFields: record.listFields.map((field) => ({ ...field, value: formatDisplayDate(field.value) })),
    detailFields: record.detailFields.map((field) => ({ ...field, value: formatDisplayDate(field.value) })),
  };
}
