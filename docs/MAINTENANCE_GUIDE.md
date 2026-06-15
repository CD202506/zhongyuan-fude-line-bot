# Maintenance Guide

## 日常維護

1. 開始前執行 `git status`，不要覆蓋未確認的本機修改。
2. 查看最近 commit 與目前 `config.py` 的 `APP_VERSION`。
3. 只在測試用 V2 Spreadsheet 驗證 LINE 串接資料。
4. 修改後先本機編譯與測試，再 commit、push、觀察 Render deployment。
5. 每次部署後檢查 `/health`、LINE 查詢、`line_query_logs` 與 Render Logs。

`shrines` 與 `members` 有記憶體 TTL cache。Sheet 內容變更後可能需要等待
`SHEETS_CACHE_TTL_SECONDS`，或重啟 Render service 才會立即重新讀取。

## 確認 Render

1. 開啟 Render Dashboard 的 `zhongyuan-fude-line-bot`。
2. 確認最新 deploy 為成功狀態，且 commit hash 符合預期。
3. 開啟 `https://<service-host>/health`。
4. 確認 HTTP 200、`status=ok`、service 名稱及版本正確。
5. 查看 Logs，確認沒有啟動失敗、import error 或重複 crash。

## 確認 LINE Webhook

1. 確認 LINE Developers Console 的 Webhook URL 為
   `https://<service-host>/webhook`。
2. 執行 Verify，應成功收到 HTTP 200。
3. 從 LINE 傳送「白沙屯」，確認收到一則回覆。
4. 檢查 Render Logs 的 event/message 資訊與 LINE reply status。
5. 不要嘗試重送相同 reply token；LINE reply token 只能使用一次。

## 確認 Google Sheets 可讀

優先使用正常 LINE 查詢驗證，避免在正式環境開放 debug endpoint。

若需要暫時使用 `/debug/sheets`：

1. 設定 `ENABLE_DEBUG_ENDPOINT=true`。
2. 同時設定強度足夠的 `DEBUG_TOKEN`。
3. 使用 `/debug/sheets?token=<temporary-token>`。
4. 只確認 counts、headers 與 sample names。
5. 完成後立即將 `ENABLE_DEBUG_ENDPOINT=false`。

不得將 token、完整 `line_uid`、Service Account JSON 或 private key 放入截圖或紀錄。

## 確認 line_query_logs

傳送一筆測試查詢後，檢查最新列至少包含：

- `log_id`
- `query_datetime`
- `line_uid`
- `query_text`
- `query_type`
- `target_sheet`
- `matched_record_id` / `matched_record_name`
- `result_status`
- `reply_type`
- `reply_mode`
- `reply_token_used`
- `source_type`
- `scenario_version`

寫入採 header-based mapping。不要假設固定欄位順序，也不要任意重新命名 header。
Log 寫入失敗不應阻擋 LINE 回覆；錯誤會留在 Render Logs。

## members 權限測試

使用指定測試帳號的完整 LINE user ID 對應 `members.line_uid`：

- 內部版：`active=yes` 且 `can_view_internal_shrine=yes`
- 公開版：`active=yes` 且 `can_view_internal_shrine=no`
- 非 member 或 inactive：公開權限

每次只改測試 member，記錄原值，完成後還原。變更後等待 cache TTL 再測。
不要使用真實伙伴帳號做破壞性測試。

## 常見錯誤

### `GOOGLE_SERVICE_ACCOUNT_JSON is not set` 或 JSON 無效

檢查 Render environment variable 是否存在且為完整、合法的 JSON 字串。不要把內容
貼到公開管道。

### `GOOGLE_SHEET_ID is not set`

確認變數名稱與值，不要把 Spreadsheet URL 當成 ID，除非程式已明確支援。

### Worksheet 找不到

確認 V2 Spreadsheet 內有 `shrines`、`members`、`line_query_logs`，名稱與大小寫一致。

### LINE 回覆 401/403

通常是 Channel Access Token 無效、過期或屬於不同 channel。確認後輪替 token。

### LINE 回覆 400

檢查 Render Logs 的 response text。常見原因是 reply token 已使用或已過期。

### 權限或資料看起來沒更新

等待 cache TTL；若需要立即生效，可在確認影響後重啟 service。

## 不能直接修改

- 正式 LINE Channel Access Token
- Google Service Account private key / JSON
- Render environment variables 與 service 設定
- V1 AppSheet 使用中的資料結構
- V2 工作表名稱、header 與欄位語意
- `members.line_uid` 真實資料
- LINE 回覆格式、搜尋順序、權限條件、reply token 流程

上述項目必須先備份、說明影響並取得維護者確認。
