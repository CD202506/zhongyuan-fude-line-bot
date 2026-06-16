# zhongyuan-fude-line-bot

中原福德宮 LINE 官方帳號的友宮資料查詢 MVP。目前 runtime 版本為 `0.6.0`，依
Google Sheets 的友宮、會員、來訪、公告與查詢紀錄資料，回覆公開版或內部版資訊。

## 目前正式狀態

- 正式資料來源：`中原福德宮_AppSheet_0612`
- Render service：`zhongyuan-fude-line-bot`
- Render `GOOGLE_SHEET_ID` 已正式指向 V1
- AppSheet 已接 V1，基本檢查通過
- V2 暫存表與 V1_LINE_TEST 保留作備份 / 測試，不作正式來源

## 架構

```text
LINE → Render Python FastAPI → Google Sheets V1 正式表 → LINE Reply API
```

## 本機啟動

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

程式讀取作業系統環境變數，不會自動載入 `.env`。需要連接 LINE 或 Google
Sheets 時，請以 `.env.example` 為格式在本機安全設定，不要提交真實值。

啟動後可開啟：

```text
http://127.0.0.1:8000/health
```

## Render 部署

- Build Command：`pip install -r requirements.txt`
- Start Command：`uvicorn main:app --host 0.0.0.0 --port $PORT`
- LINE Webhook URL：`https://<render-service-host>/webhook`

將確認過的 commit push 到 Render 連接的 GitHub branch 後，等待自動部署完成。
接著確認 `/health` 版本、LINE Developers Verify 與人工查詢結果。

## 環境變數

| 名稱 | 用途 |
| --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | 呼叫 LINE Reply API |
| `GOOGLE_SHEET_ID` | 指定目前正式 Google Sheets 資料來源 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets 驗證 |
| `ENABLE_DEBUG_ENDPOINT` | 是否開啟 `/debug/sheets`，預設關閉 |
| `DEBUG_TOKEN` | 開啟 debug endpoint 時的查詢 token |
| `SHEETS_CACHE_TTL_SECONDS` | `shrines`、`members` 快取秒數，預設 `60` |

不得將真實 token、Sheet ID、private key 或完整 Service Account JSON 提交到 Git。

## Google Sheets

正式 Spreadsheet 需要以下 tabs：

- `shrines`：友宮資料與搜尋欄位
- `members`：LINE user ID、啟用狀態與內部資料權限
- `shrine_visits`：友宮來訪 / 請帖資料
- `announcements`：LINE 被動查詢公告資料
- `line_query_logs`：每次 LINE 查詢的紀錄

Service Account 必須有該 Spreadsheet 的存取權。程式依 `line_query_logs` 第一列
header 寫入，不要任意重新命名 tab 或欄位。

## 最小人工測試

1. 確認 `/health` 回傳 `status=ok`。
2. LINE 輸入「白沙屯」，確認可找到友宮資料。
3. LINE 輸入「白沙屯測試」，確認回查無資料。
4. 測試 member 設為 `active=yes`、`can_view_internal_shrine=yes`，等待 cache TTL
   後確認回內部版。
5. 將同一測試 member 改為 `can_view_internal_shrine=no`，等待 cache TTL 後確認
   回公開版，完成後還原原值。
6. 檢查 `line_query_logs` 新增一列且欄位對齊。
7. 確認 `/debug/sheets` 預設回傳 disabled，不顯示 Sheets 資料。

## 常見問題

| 問題 | 優先檢查 |
| --- | --- |
| `/health` 無法開啟 | Render deploy 狀態、Start Command、Render Logs |
| LINE Verify 失敗 | Webhook URL 是否為 HTTPS 且結尾為 `/webhook` |
| LINE 沒有回覆 | `LINE_CHANNEL_ACCESS_TOKEN` 與 Render Logs 的 reply status |
| Sheets 讀取失敗 | Sheet ID、Service Account JSON、分享權限、tab 名稱 |
| 權限結果未更新 | `line_uid`、`active`、`can_view_internal_shrine`，並等待 cache TTL |
| query log 沒寫入 | `line_query_logs` headers 與 Render Logs |

目前交接狀態與程式檔案分工見 [docs/HANDOFF.md](docs/HANDOFF.md)。
