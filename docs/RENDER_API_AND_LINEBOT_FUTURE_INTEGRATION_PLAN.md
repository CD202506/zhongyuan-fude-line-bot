# 0.8.0A-10 Render API 與未來 LINE Bot 整合計畫

本文件規劃未來 Render FastAPI、Web Admin API、PostgreSQL 與 LINE Bot 的整合方向。本輪只做文件，不修改 Render、不修改 LINE Bot、不部署。

## 1. 文件目的

本文件用來說明：

- 現有 V1 LINE Bot 的凍結定位。
- V2 Render API 的新角色。
- 未來 LINE Bot 如何從 V1 Google Sheets 方向轉向 V2 API / 新資料核心。
- 後端 route、service、repository、model 的分層方向。

## 2. 現有 V1 LINE Bot 凍結定位

V1 = Google Sheets + Render FastAPI + LINE Bot。

V1 保留既有功能，除非現有功能故障，否則不再修改。

V1 不再：

- 新增功能。
- 擴充 Google Sheets。
- 追隨 Web 後台 V2 模組或欄位調整。
- 作為 V2 的資料模型限制。

## 3. V2 Render API 的新角色

未來 Render FastAPI 應承擔：

- Web Admin API。
- 權限檢查。
- 商業邏輯。
- PostgreSQL 存取。
- audit log。
- LINE Bot webhook。
- 未來 LINE 查詢與通知的資料邊界。

V2 API 不應直接沿用 V1 Google Sheets 結構作為主要模型。

## 4. V1 route 與 V2 API route 分離原則

未來若在同一 Render service 上演進，應避免混淆：

- V1 LINE webhook route 保留既有行為。
- V2 Web Admin API 使用清楚的 route prefix。
- V2 LINE Bot 未來轉接另開設計，不直接改現有 V1 route。
- V1 故障維護與 V2 開發任務分開。

可能方向：

```text
/webhook/line        # V1 或未來 LINE webhook，需分階段處理
/api/admin/...       # Web Admin API
/api/v2/...          # V2 module API
```

實際 route 需後續後端階段確認。

## 5. 未來 LINE Bot 如何轉查 V2 PostgreSQL

未來方向：

1. Web 後台 V2 核心資料模型穩定。
2. PostgreSQL 與 API 權限邊界穩定。
3. LINE Bot 查詢需求重新盤點。
4. 定義 LINE Bot 可查詢資料範圍。
5. LINE Bot webhook 改透過 service 查詢 V2 API / repository。
6. 舊 Google Sheets 查詢逐步退場或只保留備查。

LINE Bot 不應直接查敏感完整資料。

## 6. 不立即改現有 LINE Bot 的理由

目前不立即改 LINE Bot，因為：

- V2 資料模型尚未正式建立。
- API 邊界尚未穩定。
- 權限設計尚未完成。
- PostgreSQL 尚未啟用。
- 直接改 LINE Bot 會影響現有穩定功能。
- 回滾風險高。

## 7. Render FastAPI 建議目錄結構

未來候選，不代表本輪建立：

```text
app/
  main.py
  routes/
    line_webhook.py
    admin_auth.py
    devotees.py
    temple_affairs.py
    ledger.py
    shrines.py
    visits.py
    announcements.py
    events.py
    procurements.py
    documents.py
  services/
  repositories/
  models/
```

## 8. API 模組分層

### routes

- HTTP request / response。
- route-level validation。
- 呼叫 service。
- 不直接寫資料庫。

### services

- 廟務流程邏輯。
- 權限判斷協調。
- 關聯資料處理。
- 作廢、沖銷、狀態轉換等規則。

### repositories

- PostgreSQL 存取。
- transaction 邊界。
- query 封裝。
- 不放 UI 或 LINE 回覆文字。

### models

- 資料表模型。
- schema。
- enum。
- API response / request 型別。

## 9. 未來 API route 初步方向

未來候選：

```text
/api/admin/auth
/api/admin/dashboard
/api/admin/devotees
/api/admin/temple-affairs
/api/admin/ledger
/api/admin/shrines
/api/admin/visits
/api/admin/announcements
/api/admin/events
/api/admin/procurements
/api/admin/documents
/api/admin/team-members
/api/admin/settings
/api/admin/audit-logs
```

實際命名應依後續 API contract 決定。

## 10. 權限與 audit log 原則

- 前端權限顯示不是安全邊界。
- 後端 API 必須驗證使用者權限。
- admin、staff、viewer 是系統權限。
- 廟務職務不等於系統權限。
- 敏感操作需寫入 audit log。
- 作廢、沖銷、權限異動、帳務異動、個資查詢需特別記錄。

## 11. LINE 查詢紀錄未來如何進入 V2

未來 `line_query_logs` 可進入 V2：

- LINE 使用者查詢紀錄。
- 查無資料。
- 補資料建議。
- 查詢權限結果。
- 回覆摘要。
- 錯誤或 fallback 狀態。

但這應由 V2 API 與 PostgreSQL 模型承擔，不再依賴現有 Google Sheets 結構。

## 12. 遷移階段建議

```text
Phase 1：保留 V1，建立 Web Admin V2 前端與 API contract
Phase 2：建立 Render API 分層與 PostgreSQL schema
Phase 3：Web 後台核心模組串接 PostgreSQL
Phase 4：建立權限、audit log、資料匯入 / 備援流程
Phase 5：重新設計 LINE Bot 查詢邊界
Phase 6：LINE Bot 逐步轉接 V2 API / 新資料核心
```

## 13. 風險與 rollback 原則

- V1 現有 LINE Bot 不跟隨 V2 即時變動。
- V2 API 未穩定前不切 LINE webhook。
- 所有 LINE Bot 轉接需可 rollback。
- PostgreSQL schema migration 需另開任務。
- 敏感資料不開放 LINE 查詢，除非另有權限設計。
- webhook、Render env、secret 不在文件規劃階段修改。

## 14. 未來候選資料表

未來候選，不代表本輪建立：

```text
users / profiles
team_members
devotees
temple_affairs
ledger_categories
ledger_entries
shrines
visits
announcements
events
procurements
documents
document_files
audit_logs
line_query_logs
```

## 15. 本輪不做

- 不改 Render。
- 不改 LINE Bot。
- 不改 webhook。
- 不改 Google Sheets。
- 不讀取或新增 secret。
- 不新增環境變數。
- 不建立 API route。
- 不建立 PostgreSQL。
- 不部署。
- 不 commit。
