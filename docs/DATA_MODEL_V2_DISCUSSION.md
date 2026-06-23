# 0.8.0A 資料模型 V2 討論

## 討論目標

本文件整理 Web 後台 MVP 與資料模型 V2 的命名、關聯與相容方向。這不是正式 migration 計畫，也不是正式 LINE Bot runtime 改寫計畫。

第一版 Web 後台 MVP 可先使用 V2 語意規劃畫面與 adapter，但不得修改正式主檔 `中原福德宮_AppSheet_0612`，不得把正式 runtime 的 `shrines` / `shrine_visits` 直接改名為 `temples` / `temple_visits`。

`0.8.0A-9` 補充 V1 freeze 決策：現有 V1 = Google Sheets + Render FastAPI + LINE Bot 保留但凍結，不再作為 Web 後台 V2 的設計前提。V2 不再以現有 Google Sheets 是否能承擔作為設計限制，正式進入 Web 後台架構與開發階段。未來 LINE Bot 不取消，但應待 V2 核心資料模型、權限與 API 邊界穩定後，再規劃轉接 Web 後台 / API / 新資料核心。詳見 `docs/V1_FREEZE_AND_WEB_ADMIN_TRANSITION_DECISION.md`。

`0.8.0A-10` 補充正式技術架構規劃：Web 後台 V2 建議採 Vercel Next.js / React 前端、Render FastAPI 後端 API、Render PostgreSQL 作為未來資料核心。`web_admin_mvp/` 只保留為 UX prototype；未來正式前端建議另開 `web_admin_app/`，但本輪不建立、不部署、不修改 runtime。

## 命名方向

Web 後台與 V2 模型內部開始使用 `temple` 命名：

- `temples`
- `temple_contacts`
- `temple_visits`

短期正式 V1 runtime 不改現有 tab 名稱：

- `shrines`
- `shrine_visits`

Repository / adapter 層需保留相容說明：

| V2 語意 | 短期 V1 / 現有 tab | 說明 |
| --- | --- | --- |
| `temples` | `shrines` | Web 後台用 `temple` 表達友宮，但正式 runtime 仍讀 `shrines`。 |
| `temple_visits` | `shrine_visits` | Web 後台用 `temple_visits` 表達來訪 / 請帖 / 廟際互動。 |
| `temple_contacts` | 可能來自現有友宮欄位或新開發表 | 聯絡人應從友宮主檔拆出。 |

更多 V1 / V2 模組與 tab 對照，詳見 `docs/V1_V2_DATA_MAPPING_PLAN.md`。

## 成員、廟務職務與系統權限

`members` 需區分兩種概念：

- 廟務職務：人在廟裡的實際職稱與任期。
- 系統權限：人在後台或系統中可做的操作等級。

廟務職務例如：

- 主任委員
- 總幹事
- 值年爐主
- 值年副爐主

系統權限例如：

- `admin`
- `staff`
- `viewer`

目前使用者本人的廟務職稱是總幹事，系統權限是 `admin`。

但 `admin` 不應綁定單一個人，未來需可轉移、增減、停用。

## 人員層級補充

Web 後台 V2 需區分不同人員層級：

| 層級 | 來源 | 系統關係 | 權限 | 相關模組 |
| --- | --- | --- | --- | --- |
| 任何人 | LINE 官方帳號外部使用者 | 尚未成為好友或尚未建檔 | 無 | LINE |
| 善信 | 加入 LINE 官方帳號好友、現場登記、求發財金 / 平安龜者 | 善信資料、LINE Bot 查詢 | 接收公開訊息、查詢本人授權內容 | 善信管理、活動、公告、發財金、平安龜、還金 / 還願 |
| 團隊成員 | 善信或內部協助者 | 值勤、協作、通知 | 同善信，並可接收內部可公開或授權通知事項 | 團隊管理、班表、活動、公告、來訪支援 |
| 系統使用者 | 管理委員會成員 | 後台操作 | 依權限模組 | 來訪、活動、公告、友宮、善信、帳務 |
| 系統管理者 | 管理委員會成員 | 系統維運 | 最高權限 | 全模組、系統設定、權限、資料來源、LINE 維運 |

重要原則：

- 團隊成員不一定等於系統使用者。
- 管理委員會成員不一定永遠是系統管理者。
- `admin` 是系統權限，不是廟務職務。
- 廟務職務、團隊值勤、系統權限必須分開。

## 廟務管理、善信管理與帳務管理邊界

`0.8.0A-8` 補充以下資料模型語意。本段只作 V2 討論，不是正式 migration。

- 善信管理 = 管人。`devotees` 應聚焦善信基本資料，例如會員編碼、手機、電話、地址、出生日期、推播同意、key in 人員代號與 key in 日期時間。
- 廟務管理 = 管事。未來可管理添油香、光明燈、太歲、發財金、平安龜、還金 / 還願、採購、公文 / 通知、廟務維持等日常事項。
- 帳務管理 = 管錢。`finance_logs` 或後續帳務流水表負責收入、支出、帳務科目、金額、關聯來源、經手人與月報公告草稿。

帳務科目 / 費用科目 / 收支科目應視為同一套帳務科目主檔，由帳務管理統一維護。善信、廟務管理、友宮、來訪、活動與採購紀錄只能選用既有科目，不應自由輸入。每筆紀錄仍可保留備註欄。

## 採購與公文 / 通知

採購是廟務管理的子功能。

採購紀錄可包含：

- `procurement_id`
- `item_name`
- `quantity`
- `purpose`
- `vendor_name`
- `handled_by`
- `related_affair_id`
- `related_event_id`
- `related_visit_id`
- `finance_id`
- `note`
- `created_at`
- `updated_at`

採購管理管品項、數量、用途、店家 / 供應商、經手人與關聯事項。若採購產生支出，付款與支出流水由帳務管理處理，並以 `finance_id` 或同等關聯連回帳務流水。

公文 / 通知可先歸廟務管理，未來視規模再評估是否拆成獨立模組。

公文 / 通知紀錄可包含：

- `document_id`
- `document_type`
- `direction`
- `source_name`
- `target_name`
- `subject`
- `document_date`
- `related_temple_id`
- `related_visit_id`
- `related_event_id`
- `related_procurement_id`
- `related_affair_id`
- `announcement_id`
- `note`
- `created_at`
- `updated_at`

公文 / 通知可包含行政單位來文、發文、友宮來函、友宮回函、內部通知、會議通知與活動協調通知。公文 / 通知是文件紀錄，公告 / 活動是發布內容或活動資料；公文 / 通知可產生公告草稿，但不取代公告 / 活動。

## 建議核心資料表

### `members`

用途：系統中的人員主檔。

建議保留：

- `member_id`
- `name`
- `line_uid`
- `phone`
- `active`
- `system_permission`

注意：

- `system_permission` 可先作為短期欄位，但長期應可抽成可管理權限。
- 不要用單一職稱欄位同時表示廟務職務與系統權限。

### `devotees`

用途：善信主資料。

建議欄位方向：

- `devotee_id`
- `name`
- `phone`
- `line_uid`
- `contact_note`
- `consent_scope`
- `active`
- `created_at`
- `updated_at`

善信本人只能查詢自己的授權紀錄。團隊成員可協助查詢或登記部分資料，但不等於可管理帳務。

### `fortune_money_records`

用途：發財金登記、年度紀錄與還金關聯。

建議欄位方向：

- `record_id`
- `devotee_id`
- `year`
- `status`
- `amount_label`
- `repayment_id`
- `finance_id`
- `note`
- `created_at`
- `updated_at`

### `peace_turtle_records`

用途：平安龜登記、年度紀錄與還願關聯。

建議欄位方向：

- `record_id`
- `devotee_id`
- `year`
- `status`
- `repayment_id`
- `finance_id`
- `note`
- `created_at`
- `updated_at`

### `repayment_records`

用途：還金 / 還願紀錄。

建議欄位方向：

- `repayment_id`
- `devotee_id`
- `repayment_type`
- `related_type`
- `related_id`
- `finance_id`
- `date`
- `note`
- `created_at`
- `updated_at`

### `team_members`

用途：團隊值勤與協作成員，不等同於系統使用者。

建議欄位方向：

- `team_member_id`
- `member_id`
- `devotee_id`
- `name`
- `phone`
- `active`
- `note`
- `created_at`
- `updated_at`

### `duty_rosters`

用途：值勤班表、輪值日期與節日 / 特殊日備註。

建議欄位方向：

- `roster_id`
- `member_id` 或 `team_member_id`
- `duty_start_date`
- `duty_end_date`
- `lunar_note`
- `festival_note`
- `note`
- `active`
- `created_at`
- `updated_at`

值勤班表不等於職務任期。值勤提醒可與 LINE 通知或公告有關，但本階段不做正式推播。

### `role_types`

用途：集中管理職務名稱與類型，避免自由輸入造成名稱混亂。

建議支援：

- 廟方內部職務
- 友宮聯絡人職務
- 系統權限顯示名稱或分類

建議欄位：

- `role_type_id`
- `role_name`
- `role_category`
- `active`
- `sort_order`
- `note`

`role_category` 可先討論為：

- `temple_internal`
- `external_contact`
- `system_permission`

### `member_role_assignments`

用途：記錄一人多職與任期。

必須支援：

- 一人多職
- 任期起訖
- 值年爐主 / 值年副爐主一年一選
- 歷史紀錄保留

建議欄位：

- `assignment_id`
- `member_id`
- `role_type_id`
- `start_date`
- `end_date`
- `active`
- `note`

### `temples`

用途：友宮主資料。

建議從現有 `shrines` 語意演進，但不要直接改正式 tab。

建議欄位方向：

- `temple_id`
- `name`
- `alias`
- `region`
- `address`
- `main_god`
- `public_summary`
- `public_notice`
- `internal_note`
- `public_visible`
- `internal_only`
- `active`

### `temple_contacts`

用途：友宮聯絡人。

友宮資料應拆成：

- `temples`
- `temple_contacts`

建議欄位：

- `contact_id`
- `temple_id`
- `name`
- `role_type_id`
- `phone`
- `line_id`
- `email`
- `is_primary`
- `active`
- `note`

友宮聯絡人的職務名稱應盡量透過 `role_types` 下拉選單，避免自由輸入造成名稱混亂。

### `temple_visits`

用途：來訪、請帖、進香、祝壽、遶境、會香等廟際互動紀錄。

建議欄位：

- `visit_id`
- `temple_id`
- `visit_date`
- `visit_time`
- `location`
- `title`
- `visit_types`
- `direction`
- `contact_ids`
- `summary`
- `internal_note`
- `status`

`visit_types` 需支援多選，例如：

- 參訪
- 用餐
- 進香
- 邀請
- 請帖
- 祝壽
- 遶境
- 會香
- 聯誼
- 其他

來訪次數不應手動填，未來應由 `temple_visits` 中同一 `temple_id` 的紀錄數自動計算。

### `announcements`

用途：公告內容管理。

未來需能關聯 `temple_visits` 或 `events`。

建議欄位：

- `announcement_id`
- `title`
- `body`
- `status`
- `event_date`
- `location`
- `related_visit_id`
- `related_event_id`
- `created_by`
- `updated_at`
- `internal_note`

關聯方式可二選一或並存討論：

- `announcement_links`
- `announcements.related_visit_id`

### `announcement_links`

用途：若公告未來需要關聯多個對象，可用獨立關聯表。

建議欄位：

- `announcement_link_id`
- `announcement_id`
- `target_type`
- `target_id`
- `note`

`target_type` 可包含：

- `temple_visit`
- `event`
- `temple`

### `finance_logs`

用途：記錄收入 / 支出流水帳，並連回善信、友宮、活動、公告或手動紀錄。正式 Web 後台模組命名應使用「帳務管理」，避免以容易被理解成正式會計平台的名稱描述，以免誤解為報稅、審計或銀行帳務功能。

短期定位：

- 廟務流水帳紀錄。
- 收支摘要。
- 月度收支公告草稿。
- 對指定對象的 LINE 群組公告內容輔助。

本階段不做完整會計系統、不做正式報稅或審計功能、不做銀行帳戶管理，也不存放銀行帳號、帳戶資訊、真實收據號碼或敏感帳務資料。

建議欄位方向：

```text
finance_id
date
direction: income / expense
category
amount
summary
related_type
related_id
related_devotee_id
related_temple_id
related_visit_id
related_event_id
handled_by
announcement_visibility
announcement_target_group
monthly_report_period
status
note
created_at
updated_at
```

`related_type` 可包含：

```text
devotee
fortune_money
peace_turtle
repayment
temple_visit
event
announcement
manual
```

帳務相關收入可來自發財金還金、平安龜還願、香油錢、活動收入、捐獻。友宮來訪相關支出可來自餐費、鮮花、香油錢、接待費、交通或停車安排、供品支出。

`announcement_visibility` 表示是否納入月度公告，`announcement_target_group` 表示公告對象，`monthly_report_period` 表示月報期間，例如 `2026-06`。

帳務流水應保留原子紀錄，一筆收入或支出是一列。未來可透過 `related_temple_id`、`related_visit_id`、`related_devotee_id`、`related_event_id` 查詢關聯。

現場行政表單不可只依賴登入 session 判斷經手人，需有顯性欄位 `經手人 / 現場值班`，並可由當日值勤班表預設後手動切換。

金額輸入未來需清洗全形數字、千分位逗號、中文單位、空白與非數字符號，再轉為乾淨數值。

作廢 / 沖銷原則：原始流水紀錄不可直接刪除；作廢時保留原紀錄並設定 `status = void`；如需抵銷可另建沖銷紀錄；月報與查詢需排除作廢紀錄或顯示沖銷關係，避免 V1 / V2 過渡期錯誤加總。

### `monthly_finance_reports`

用途：從收支流水帳產生月度 LINE 群組公告草稿。

建議欄位方向：

```text
report_id
period
title
target_group
summary_text
line_message_body
include_income
include_expense
include_related_notes
status: draft / reviewed / posted
created_by
reviewed_by
posted_at
note
```

公告對象至少包含：

- 團隊成員
- 管理委員會成員
- 系統管理者

權限原則：

- 團隊成員可接收必要的月度公告或摘要。
- 管理委員會成員可查看較完整流水帳摘要。
- 系統管理者可查看完整紀錄與設定公告範圍。
- 善信本人只可查詢與自己相關的授權紀錄，不可查看完整內部帳務流水。
- 公開公告與內部公告內容應分開。

本階段不做正式 LINE 推播，只做月報公告草稿規劃。

### 資料來源健康狀態

未來可規劃健康燈號，包含 Google Sheets 連線狀態、LINE Bot 狀態、Render 狀態與 Web 後台資料來源狀態。本階段只記錄方向，不實作真實連線檢查。

## V1 相容原則

短期正式 LINE Bot V1 維持現有 runtime：

- 仍讀 `shrines`
- 仍讀 `shrine_visits`
- 仍讀 `members`
- 仍讀 `announcements`
- 仍寫入正式 `line_query_logs`

Web 後台 MVP 不應假設正式 runtime 已改 V2。若需要展示 V2 命名，應在 adapter 或 mock 層處理：

- Web UI 看到 `temples`
- adapter 對應開發資料源或 mock
- 正式 LINE Bot 不受影響

## 暫不決定事項

以下事項留到 MVP 截圖與操作回饋後再決定：

- 是否建立正式資料庫。
- 是否以 Google Sheets 繼續作為短期 Web 後台資料源。
- `announcements` 與 `events` 是否合併或維持分表。
- `system_permission` 是否獨立成 permissions / role-based access control。
- 何時開始正式 LINE Bot 改接 V2 adapter。
- 善信本人授權查詢的欄位範圍與驗證方式。
- 值勤提醒是否透過 LINE 通知、公告或其他管道。
- 帳務關聯是否短期使用 Google Sheets，或未來改由資料庫處理。

## 本階段不做

- 不做正式資料庫 migration。
- 不改正式 Google Sheets 結構。
- 不改正式 LINE Bot runtime code。
- 不改 Render。
- 不改 LINE Developers Webhook。
- 不把正式 `shrines` / `shrine_visits` 改名。
- 不做善信管理、團隊管理或帳務關聯正式功能。
- 不寫入正式善信、值勤或帳務資料。
- 不做完整會計系統、報稅、審計或銀行帳務功能。
- 不做月度 LINE 群組公告正式推播。
