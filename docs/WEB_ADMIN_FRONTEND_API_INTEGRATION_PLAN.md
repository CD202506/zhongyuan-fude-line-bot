# Web Admin Frontend API Integration Plan

## 1. 目前狀態

目前 `web_admin_app/` 仍使用前端資料，已完成 A14 UI / UX 測試版並部署到 Vercel。第三方測試回饋指出純前端資料缺乏真實 CRUD 臨場感。

## 2. 下一步方向

下一步會新增前端 API client，讓 `web_admin_app/` 可呼叫 `web_admin_api/`：

- 列表改由 API 讀取 staging DB
- 詳情改由 API 讀取單筆資料
- 新增資料送至 API
- 編輯資料送至 API
- 停用 / 封存送至 API
- audit events 由 API 提供

## 3. API base URL

未來使用：

```text
VITE_WEB_ADMIN_API_BASE_URL
```

Vercel env 不應硬寫在程式碼。repo 不提交 `.env` 或任何 secret。

## 4. Demo mode 與 API mode

- 沒有 API 時可保留 demo mode，避免 Vercel 測試版壞掉。
- 有 API 時切到 API mode，讀取 Render PostgreSQL staging DB。
- 第三方測試版本應切到 API mode，讓測試者可驗證資料保存。

## 5. 切換原則

- 先建立 API client 與資料型別。
- 再逐步替換列表、詳情、新增、編輯、封存流程。
- 保留停用 / 封存，不提供一般刪除。
- 不接 LINE Bot。
- 不修改 V1 Google Sheets。
- 不修改 AppSheet。
