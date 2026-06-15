# V1 / V2 Google Sheets 對齊與切換計畫

## 目前結論

- V1 `中原福德宮_AppSheet_0612` 是 AppSheet 正式資料來源，不建議更換
  AppSheet 資料來源。
- V2 `中原福德宮_AppSheet_0612--暫存檔` 是 LINE Bot `0.6.0` 功能驗證表，
  後續應退為測試與備份表。
- 合併策略是「AppSheet 不搬家，LINE Bot 最後搬到 V1」。
- 不建議直接修改正式 V1、不建議把 AppSheet 改接 V2，也不建議讓前端伙伴操作
  底層表結構。
- 本機沒有兩份 Spreadsheet 的唯讀憑證或結構匯出，因此無法在本次直接列出
  V1 / V2 的完整 tab 與現有 headers。切換前應由維護者匯出兩份檔案的 tab 名稱與
  第一列表頭，依本文件逐項勾稽。

## V1 / V2 分工

| 資料來源 | 現況 | 後續定位 |
| --- | --- | --- |
| V1 | AppSheet 正式前端資料來源 | 保留為正式主表，補齊 LINE Bot 所需結構 |
| V2 | LINE Bot 0.6.0 驗證資料來源 | 搬移確認過的資料後，保留為備份與開發測試表 |

目前可確認 V2 已能支援 `members`、`shrines`、`shrine_visits`、
`announcements`、`line_query_logs`；V1 是否已有同名 tab 與相容欄位，仍需以實際
表頭比對。

## LINE Bot 必要 tab

| Tab | 用途 | 程式行為 |
| --- | --- | --- |
| `members` | LINE 身分與內部權限 | 讀取，60 秒 TTL cache |
| `shrines` | 友宮搜尋與公開／內部回覆 | 讀取，60 秒 TTL cache |
| `shrine_visits` | 來訪與請帖查詢 | 每次查詢讀取 |
| `announcements` | 公告被動查詢 | 每次查詢讀取 |
| `line_query_logs` | 查詢紀錄、查無資料、補資料建議 | 讀取並依 header 寫入 |

`settings_lists`、`field_dictionary`、`events`、`finance_logs` 目前 LINE Bot
未直接使用。`main.py` 中的 `events` 是 LINE webhook 事件陣列，不是 Google
Sheets 的 `events` tab。

## LINE Bot 必要欄位

### `members`

- 必要：`line_uid`、`active`、`can_view_internal_shrine`
- 支援顯示或紀錄：`member_id`、`name`
- 只有 `active=yes` 且 `can_view_internal_shrine=yes` 可使用內部功能。

### `shrines`

- 搜尋與權限必要：`name`、`public_visible`、`internal_only`
- 建議保留：`shrine_id`、`alias`
- 公開回覆支援：`main_god`、`public_summary`、`public_notice`
- 內部回覆支援：`cultural_taboos`、`history_context`、`internal_note`

`shrine_id` 雖非單純名稱搜尋的硬性欄位，但建議列為必要，以便連結
`shrine_visits` 與記錄命中資料。

### `shrine_visits`

- 友宮識別至少一組：
  - ID：`related_shrine_id` 或 `shrine_id`
  - 名稱：`related_shrine_name`、`shrine_name` 或 `name`
- 日期：`event_date`、`visit_date`、`created_at`、`source_date`
- 時間：`event_time`、`visit_time`、`time`
- 地點：`location`、`place`、`venue`
- 主題：`title`、`event_title`、`visit_title`、`subject`、`summary`、
  `event_name`、`activity`
- 類型：`record_type`、`visit_type`、`event_type`、`type`、`category`
- 方向：`direction`、`visit_direction`
- 摘要／備註支援：`description`、`content`、`detail`、`details`、`note`、
  `notes`、`remark`、`remarks`、`source_note`、`internal_note`、`people`、
  `people_list`、`attendees`、`contact_names`

### `announcements`

- 狀態：`status` 或 `publish_status`
- 標題：`line_title` 或 `title`
- LINE 內容優先：`line_body`
- 內容 fallback：`body`、`content`、`description`
- 日期排序：`event_date`、`publish_date`、`created_at`、`updated_at`
- 顯示支援：`event_time` / `time`、`location` / `venue` / `place`

`draft`、`archived`、`archive` 不顯示；`published`、`ready` 會優先排序。

### `line_query_logs`

以下 headers 均為目前寫入必要欄位，順序可不同，但名稱需一致：

```text
log_id
query_datetime
line_uid
member_id
query_text
query_type
target_sheet
matched_record_id
matched_record_name
result_status
reply_mode
reply_token_used
error_message
source_type
scenario_version
note
```

## V1 需要補齊項目

取得 V1 實際表頭後，依序確認：

1. 是否存在上述五個同名 tab。
2. `members` 與 `shrines` 是否具備必要欄位及相同欄位語意。
3. `shrine_visits`、`announcements` 是否至少有一組程式支援的候選欄位。
4. `line_query_logs` 是否具備全部必要 headers，且 Service Account 可 append。
5. AppSheet 是否會因新增 tab 或欄位受影響；新增欄位後需重新確認 AppSheet schema。

未取得 V1 / V2 實際 headers 前，不應宣稱 V1 已完成對齊。

## V2 可搬移項目

- `members`：已核對 `line_uid`、權限與啟用狀態的正式人員。
- `shrines`：確認為真實友宮、名稱與公開／內部內容已校對的資料。
- `shrine_visits`：有可辨識友宮、日期、來源或內容的真實來訪與請帖紀錄。
- `announcements`：確認可公開且狀態為 `published` / `ready` 的正式公告。
- `line_query_logs`：預設不整批搬移。若需要延續查詢統計，只搬經過隱私與重複資料
  檢查的必要紀錄；V2 原檔可保留完整歷史。

搬移前應以穩定 ID 去重，避免只用名稱覆蓋 V1 已由 AppSheet 維護的資料。

## 不應搬移的測試資料

- 名稱或內容明顯包含「測試」、假廟名、假公告、placeholder 的資料。
- 測試 LINE 帳號、無法確認身分的 `line_uid`、已停用的測試 member。
- `draft`、`archived` 或僅供版型驗證的公告。
- 無法確認來源、日期或對應友宮的來訪／請帖測試列。
- 重複資料、空白列、欄位錯置列與故意產生的 `not_found` 測試 log。
- V2 中為開發除錯而建立、但 V1 沒有業務用途的資料。

## `events` 與 `announcements`

短期維持分開：

- `events` 給 AppSheet 活動管理。
- `announcements` 給 LINE 公告查詢。

目前 LINE Bot 未直接使用 `events`。不要在本次合併兩者；待欄位語意、發布流程與
權限責任明確後，再另案評估是否建立同步或關聯。

## README / README_V2

README 類 tab 不是 LINE Bot 必要 tab，刪除不影響 LINE Bot。維護說明應放在
GitHub `README.md` 與 `docs/`，不要依賴 Google Sheets tab。

## 切換前檢查清單

- [ ] 匯出 V1 / V2 的 tab 清單與第一列 headers，完成逐欄比對。
- [ ] 確認 V1 具備五個 LINE Bot 必要 tab。
- [ ] 確認必要欄位名稱、型別與值域相容。
- [ ] 確認 Service Account 對測試副本可讀，且程式只對 `line_query_logs` 執行
  append。
- [ ] 完成正式資料去重、測試資料排除與搬移筆數核對。
- [ ] 測試公開／內部權限、公告狀態過濾與 log 寫入。
- [ ] 記錄切換前的 Sheet ID、Render env 與 rollback 方式，但不要提交敏感值。

## 建議切換流程

1. 複製 V1 成 `V1_LINE_TEST`。
2. 在 `V1_LINE_TEST` 補齊 LINE Bot 必要 tab / 欄位。
3. 匯入必要資料，不匯入明顯測試資料。
4. 使用 Render 測試服務或臨時 env 指向 `V1_LINE_TEST`。
5. LINE 測試友宮、來訪、公告、查紀錄、補資料建議。
6. 確認 AppSheet 仍可正常讀取 V1。
7. 把同樣結構補回 V1。
8. 正式 Render env 改指向 V1。
9. 保留 V2 為備份與開發測試表。

正式切換前需準備 rollback：若 V1 查詢或寫入異常，立即把 Render 的
`GOOGLE_SHEET_ID` 還原為 V2，確認 `/health` 與 LINE 查詢恢復，再處理 V1。
