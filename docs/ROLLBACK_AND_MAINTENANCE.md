# 回復與維護

## 目前正式狀態

- 正式資料來源：`中原福德宮_AppSheet_0612`
- Render 正式指向 V1。
- V2 暫存表不作正式來源。
- V1_LINE_TEST 不作正式來源。
- 正式啟用前備份已建立。

## 常見問題與處理

### LINE Bot 沒有回覆

檢查：

- Render 是否正常。
- `/health` 是否可開。
- LINE Webhook 是否啟用。
- Channel Access Token 是否仍存在。
- Render env 是否被改。

### LINE 查不到資料

檢查：

- Google Sheets 是否有資料。
- 關鍵字是否太模糊。
- `shrines` / `shrine_visits` 是否資料完整。
- `line_query_logs` 是否有紀錄。
- 使用 `查無資料` / `補資料建議` 追蹤。

### AppSheet 打不開

檢查：

- AppSheet 是否仍連到 `中原福德宮_AppSheet_0612`。
- Google Sheets 是否被刪表頭或 tab。
- 最近是否有人按 Regenerate schema。
- 是否有 AppSheet schema error。

### line_query_logs 太多

原則：

- 不要直接清空。
- 可另行建立封存流程。
- 正式版先保留紀錄。

## Rollback 原則

- 優先不要 rollback。
- 先判斷是 LINE 問題、AppSheet 問題、Google Sheets 資料問題，還是 Render 問題。
- 若正式 V1 結構被破壞，可參考正式啟用前備份。
- 不要讓 Render 指向備份表，除非明確決定進行緊急切換。
- 若需切回舊表，必須先備份目前 Render `GOOGLE_SHEET_ID`。

## 禁止事項

- 不要刪 V2 暫存表。
- 不要刪 V1_LINE_TEST。
- 不要刪正式 V1。
- 不要清空 `line_query_logs`。
- 不要把 AppSheet 改接 V2。
- 不要手動修改 Service Account JSON。
- 不要隨意重設 LINE Channel token。
