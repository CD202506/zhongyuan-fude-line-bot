# zhongyuan-fude-line-bot

中原福德宮 LINE 官方帳號的友宮資料查詢服務。目前版本為 `0.2.3`，以
Python FastAPI 部署在 Render，讀取 Google Sheets V2 暫存資料，並透過
LINE Reply API 回覆使用者。

## 系統架構

```text
LINE 官方帳號
→ Render Python FastAPI
→ Google Sheets V2 暫存檔
→ LINE Reply API
```

主要模組：

- `main.py`：FastAPI app、routes 與 webhook 流程協調
- `config.py`：版本與環境設定
- `line_client.py`：LINE Reply API
- `sheets_client.py`：Google Sheets 讀寫與 TTL cache
- `permission_service.py`：members 身分與權限判斷
- `shrine_search_service.py`：shrines 搜尋
- `reply_builder.py`：LINE 文字回覆組合
- `log_service.py`：`line_query_logs` 紀錄

## V1 / V2 分工

```text
V1：中原福德宮_AppSheet_0612，伙伴 AppSheet 前端維護版
V2：中原福德宮_AppSheet_0612--暫存檔，LINE 串接與資料結構測試版
```

此 repo 目前只連接 V2。不要把 V1 當成 LINE 測試資料來源，也不要在未確認
伙伴 AppSheet 使用狀況前變更 V1 結構。

## 已完成功能

- `/health` 健康檢查與版本回報
- `/webhook` 接收 LINE 文字訊息
- 依廟名或 alias 查詢 `shrines`
- 依 `members.line_uid`、`active`、`can_view_internal_shrine` 分流公開版與內部版
- 查無資料回覆
- `line_query_logs` 依 Google Sheets header 寫入
- `shrines` 與 `members` 的 in-memory TTL cache
- query log 寫入失敗時不阻擋 LINE 回覆
- `/debug/sheets` 預設關閉，支援環境變數與 token 防護

## 本機開發

需要 Python 3.10 以上版本。

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload
```

程式使用作業系統環境變數，不會自動載入 `.env`。本機可在啟動前透過
PowerShell 設定 `$env:VARIABLE_NAME="value"`，或使用不提交到 Git 的本機載入工具。

## Render 部署

1. 將 Render Web Service 連接至 GitHub repo
   `CD202506/zhongyuan-fude-line-bot`。
2. Build Command 使用 `pip install -r requirements.txt`。
3. Start Command 使用：

   ```text
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. 在 Render Dashboard 設定所需環境變數。
5. 部署後先確認 `/health`，再執行 LINE Developers Verify 與人工查詢測試。

實際 Render Service 設定以既有服務 `zhongyuan-fude-line-bot` 為準，未經確認
不要直接改 service、region、branch、build/start command 或環境變數。

## LINE Webhook URL

格式：

```text
https://<render-service-host>/webhook
```

範例格式：

```text
https://your-render-service.onrender.com/webhook
```

請勿在文件提交真實 access token。Webhook URL 應填入 LINE Developers Console
的 Messaging API 設定，並使用 Verify 確認可連線。

## Google Sheets 需求

目前程式需要同一份 V2 Spreadsheet 中至少存在：

- `shrines`：友宮公開/內部資料與搜尋欄位
- `members`：`line_uid`、`active`、`can_view_internal_shrine` 等權限欄位
- `line_query_logs`：LINE 查詢紀錄，使用第一列 header 對應寫入

Service Account 必須具有該 Spreadsheet 的存取權。不要任意調整工作表名稱、
header 或欄位語意；若必須改版，應先同步檢查程式與測試資料。

## Render Environment Variables

| 變數 | 必要性 | 用途 |
| --- | --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE 回覆必要 | 呼叫 LINE Reply API |
| `GOOGLE_SHEET_ID` | 必要 | 指定 V2 Spreadsheet |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 必要 | Google Service Account JSON 字串 |
| `ENABLE_DEBUG_ENDPOINT` | 選用 | `true` 才開啟 `/debug/sheets` |
| `DEBUG_TOKEN` | 建議 | debug endpoint query token |
| `SHEETS_CACHE_TTL_SECONDS` | 選用 | Sheets read cache 秒數，預設 `60` |

完整說明見 [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)。

## 測試手順

1. 編譯所有模組：

   ```powershell
   python -m py_compile main.py config.py line_client.py sheets_client.py permission_service.py shrine_search_service.py reply_builder.py log_service.py
   ```

2. 啟動服務並確認 `GET /health` 回傳 `0.2.3`。
3. 確認未設定 `ENABLE_DEBUG_ENDPOINT=true` 時，`GET /debug/sheets` 不回傳資料。
4. 使用無內部權限帳號輸入「白沙屯」，確認回公開版。
5. 使用有內部權限帳號輸入「白沙屯」，確認回內部版。
6. 輸入「白沙屯測試」，確認回查無資料。
7. 檢查 `line_query_logs` 最新列與 Render Logs。

完整清單見 [docs/TEST_CHECKLIST.md](docs/TEST_CHECKLIST.md)。

## 常見問題

### `/health` 無法開啟

先檢查 Render deploy 狀態、啟動命令、`PORT` 綁定與 Render Logs。服務必須監聽
`0.0.0.0:$PORT`。

### LINE Verify 失敗

確認 Webhook URL 使用 HTTPS 且結尾為 `/webhook`，Render 服務已啟動，LINE
Developers Console 的 webhook 已啟用。

### LINE 收不到回覆

檢查 `LINE_CHANNEL_ACCESS_TOKEN`、Render Logs 的 LINE status/response，以及同一個
reply token 是否只使用一次。

### Google Sheets 讀取失敗

檢查 `GOOGLE_SHEET_ID`、Service Account JSON 格式、Spreadsheet 分享權限與工作表
名稱。不要把完整 JSON 或 private key 貼到 issue、聊天或 log。

### 權限結果不符

確認 `members.line_uid` 完整相符，且 `active=yes`。只有
`can_view_internal_shrine=yes` 的有效 member 可看內部版。變更後最多等待 cache TTL
後再測，或重啟服務清除記憶體快取。

## 安全注意事項

- 不得提交 `.env`、token、private key、完整 Service Account JSON 或 Sheet ID 實值。
- `/debug/sheets` 正式環境應保持關閉；若暫時開啟，必須設定強度足夠的
  `DEBUG_TOKEN`，驗證後立即關閉。
- 不要在回覆、文件、issue 或 Render Logs 主動輸出完整 `line_uid`。
- 變更 Google Sheets header、LINE credentials 或 Render environment variables 前，
  必須先備份並取得維護者確認。
- 發現憑證疑似外洩時，應立即停用/輪替憑證，不要只刪除 Git 最新版本。

## 暫不處理

- `announcements`
- `shrine_visits`
- 圖片訊息
- Flex Message
- Facebook 同步
- 公告發布
- Google Sheets 表結構改版

維護與部署細節請參考 [docs/MAINTENANCE_GUIDE.md](docs/MAINTENANCE_GUIDE.md)
與 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)。
