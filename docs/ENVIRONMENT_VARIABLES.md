# Environment Variables

所有正式值只應儲存在 Render Environment 或受控的本機秘密管理方式。不得提交到
Git、README、issue、聊天紀錄或截圖。

| 變數 | 用途 | 必要 | 敏感 | 範例格式 | 可公開 |
| --- | --- | --- | --- | --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | 呼叫 LINE Reply API | 是，需回覆 LINE 時 | 是 | `your_line_channel_access_token` | 否 |
| `GOOGLE_SHEET_ID` | 指定 V2 Spreadsheet | 是 | 建議視為敏感 | `your_google_sheet_id` | 否 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google API 驗證 | 是 | 高度敏感 | `{"type":"service_account","project_id":"your_project_id"}` | 否 |
| `ENABLE_DEBUG_ENDPOINT` | 控制 `/debug/sheets` | 否 | 否 | `false` | 可公開設定名稱，不公開正式策略細節 |
| `DEBUG_TOKEN` | 保護已開啟的 debug endpoint | 開啟 debug 時建議必設 | 是 | `a-long-random-token` | 否 |
| `SHEETS_CACHE_TTL_SECONDS` | `shrines`/`members` cache 秒數 | 否 | 否 | `60` | 是 |

## LINE_CHANNEL_ACCESS_TOKEN

- 由 LINE Developers Console 的 Messaging API channel 取得。
- 不可加引號或前綴 `Bearer`；程式會自行建立 Authorization header。
- 外洩時立即撤銷並重新發行。

## GOOGLE_SHEET_ID

- 使用 Spreadsheet URL 中的文件 ID，不是工作表名稱。
- 必須指向 V2 暫存檔。
- 雖不是 private key，仍不應公開正式值。

## GOOGLE_SERVICE_ACCOUNT_JSON

- 以完整 JSON 字串存入單一環境變數。
- 必須包含有效的 service account identity 與 private key。
- Service Account email 需獲得 V2 Spreadsheet 存取權。
- 不要提交 `.json` 憑證檔，也不要輸出 JSON 到 log。

## ENABLE_DEBUG_ENDPOINT

- 預設或建議值：`false`。
- 只有值為 `true` 時 `/debug/sheets` 才啟用。
- 正式環境完成診斷後應立即改回 `false`。

## DEBUG_TOKEN

- 若有設定，呼叫 debug endpoint 時必須帶 `?token=<value>`。
- 使用長度足夠的隨機值，不要使用範例文字。
- 不應與 LINE token、GitHub token 或其他系統密碼共用。

## SHEETS_CACHE_TTL_SECONDS

- 預設 `60` 秒。
- `0` 代表停用 read cache。
- 設太長會延後 `shrines` 與 `members` 更新可見時間。
- 不影響 `line_query_logs`，每筆查詢仍會嘗試寫入。
