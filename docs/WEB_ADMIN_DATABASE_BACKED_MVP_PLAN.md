# Web Admin Database-backed MVP Plan

## 1. 為什麼進入資料庫版 MVP

A14 Web 後台 UI / UX 測試版已部署到 Vercel，第三方測試者已能檢查角色切換、側欄、搜尋、列表、詳情、新增、編輯與停用 / 封存確認流程。

第三方回饋指出：目前仍是純前端資料，缺乏真實新增、查詢、編輯後可保存的臨場感。純前端測試版已不足以驗證完整流程，後續 UI / UX 調整必須建立在資料可保存、可多人測試、可重新整理後仍存在的基礎上。

因此下一階段進入 database-backed MVP：先建立 Web 後台可接資料庫的架構與 CRUD 基礎，再於此基礎上繼續調整 UI / UX。

## 2. 本階段目標

- 實際新增資料
- 實際查詢列表
- 實際查看詳情
- 實際編輯資料
- 實際停用 / 封存資料
- 重新整理後資料仍存在
- 多位測試者可以看到同一批測試資料

## 3. 本階段不做事項

- 不接 LINE Bot
- 不同步 Google Sheets
- 不接 AppSheet
- 不使用正式資料
- 不建立正式登入
- 不做正式權限稽核
- 不提供一般刪除
- 不直接改 V1

## 4. 建議部署架構

- Vercel：`web_admin_app/`
- Render：新增 `web_admin_api/`
- Render service 建議名稱：`zhongyuan-fude-web-admin-api`
- Render PostgreSQL：staging database
- Vercel env：`VITE_WEB_ADMIN_API_BASE_URL`
- Render env：
  - `DATABASE_URL`
  - `WEB_ADMIN_ALLOWED_ORIGINS`
  - `WEB_ADMIN_TEST_MODE`
  - `WEB_ADMIN_TEST_ACCESS_CODE` 或等效測試保護機制

Web 後台 API 應與現有 LINE Bot service 解耦，不與既有 `zhongyuan-fude-line-bot` runtime 混用，避免影響 V1。

## 5. 安全邊界

- 不放正式個資
- 不放正式電話
- 不放 LINE user id
- 不放正式地址
- 不放正式財務資料
- 測試資料可重置
- 停用 / 封存不等於刪除

第三方測試資料應使用 staging database。若未來需要 reset 測試資料，應建立明確的 staging reset 流程，不應手動改正式資料來源。
