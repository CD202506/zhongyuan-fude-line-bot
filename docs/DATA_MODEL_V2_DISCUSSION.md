# 0.8.0A 資料模型 V2 討論

## 討論目標

本文件整理 Web 後台 MVP 與資料模型 V2 的命名、關聯與相容方向。這不是正式 migration 計畫，也不是正式 LINE Bot runtime 改寫計畫。

第一版 Web 後台 MVP 可先使用 V2 語意規劃畫面與 adapter，但不得修改正式主檔 `中原福德宮_AppSheet_0612`，不得把正式 runtime 的 `shrines` / `shrine_visits` 直接改名為 `temples` / `temple_visits`。

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

## 本階段不做

- 不做正式資料庫 migration。
- 不改正式 Google Sheets 結構。
- 不改正式 LINE Bot runtime code。
- 不改 Render。
- 不改 LINE Developers Webhook。
- 不把正式 `shrines` / `shrine_visits` 改名。
