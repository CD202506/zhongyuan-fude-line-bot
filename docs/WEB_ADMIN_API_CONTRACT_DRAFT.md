# Web Admin API Contract Draft

本文件定義 Web Admin database-backed MVP 初版 API contract。API 供 `web_admin_app/` 使用，後端預計由新增的 `web_admin_api/` FastAPI service 提供。

本階段不接 LINE Bot、不接 Google Sheets、不接 AppSheet，不修改 V1 runtime。

## 1. Health

### `GET /api/health`

用途：確認 API service 可回應。

回應草案：

```json
{
  "status": "ok",
  "service": "web_admin_api"
}
```

## 2. Modules

### `GET /api/modules`

用途：取得 Web 後台模組清單。

回應草案：

```json
[
  {
    "key": "temple-affairs",
    "title": "廟務管理",
    "description": "管事：例行工作、祭典準備、關聯任務與內部提醒。"
  }
]
```

## 3. Records

### `GET /api/records?module_key=&q=&status=`

用途：查詢列表。

查詢參數：

- `module_key`：模組 key
- `q`：關鍵字
- `status`：狀態或封存篩選

### `POST /api/records`

用途：新增資料。

### `GET /api/records/{record_id}`

用途：查看單筆詳情。

### `PATCH /api/records/{record_id}`

用途：編輯資料。

### `POST /api/records/{record_id}/archive`

用途：停用 / 封存資料。

### `POST /api/records/{record_id}/restore`

用途：還原封存資料。初期可只開給管理者測試。

## 4. Audit

### `GET /api/records/{record_id}/audit-events`

用途：查詢單筆資料的操作紀錄。

## 5. 不提供 DELETE

不提供：

```text
DELETE /api/records/{id}
```

前端「刪除」概念統一為停用 / 封存。資料仍保留於紀錄中。

## 6. 權限原則

- 檢視者：只讀。
- 廟方人員：可新增 / 編輯日常資料，但封存需管理者確認。
- 管理者：可新增 / 編輯 / 封存 / 還原。

本階段權限可先以測試角色或 access code 模擬。未來再接正式登入、正式權限與正式稽核。
