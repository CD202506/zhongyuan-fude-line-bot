# Web Admin Database Schema Draft

本文件為 Web Admin database-backed MVP 的 schema 草案。這是 MVP schema，不是最終正式 schema。

現階段目標是快速支援十個主要模組的實際新增、查詢、編輯與停用 / 封存，因此先採用 flexible records 設計。未來流程穩定後，可再拆成 `devotees`、`shrines`、`events`、`ledger` 等正式資料表。

## 1. `web_admin_records`

用途：所有模組共用的 MVP 主資料表。

欄位草案：

- `id`
- `module_key`
- `title`
- `summary`
- `status`
- `record_date`
- `due_date`
- `responsible`
- `category`
- `fields_json`
- `tags_json`
- `is_archived`
- `archived_at`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

設計說明：

- `module_key` 對應前端模組，例如 `temple-affairs`、`devotees`、`shrines`、`ledger`。
- `fields_json` 存放模組差異欄位，例如授權狀態、聯絡窗口、供應商、關聯廟務。
- `tags_json` 存放多選標籤，例如服務紀錄、發布管道、支援項目、關聯紀錄。
- `is_archived` 表示資料已停用 / 封存，不等於刪除。
- 前端不開放 `DELETE`，刪除需求一律轉為 `is_archived = true` 或 `status = archived / disabled`。

## 2. `web_admin_audit_events`

用途：紀錄新增、編輯、封存、還原等操作。

欄位草案：

- `id`
- `record_id`
- `action`
- `actor_role`
- `actor_name`
- `before_json`
- `after_json`
- `created_at`

設計說明：

- `action` 可包含 `create`、`update`、`archive`、`restore`。
- `before_json` 與 `after_json` 用於保留操作前後摘要。
- MVP 階段先作測試稽核，不等同正式權限稽核。

## 3. `web_admin_test_users`

用途：支援第三方測試帳號或測試角色。

欄位草案：

- `id`
- `display_name`
- `role`
- `access_code_hash`
- `is_active`
- `created_at`

設計說明：

- `role` 可使用 `admin`、`staff`、`viewer`。
- 測試用 code 不應明文提交到 repo。
- 正式登入與正式權限稽核留待後續階段。

## 4. 後續拆表方向

MVP 使用 flexible records 是為了加速實測。未來若流程穩定，可逐步拆成正式 schema：

- 善信管理：`devotees`
- 友宮管理：`shrines`
- 來訪 / 請帖：`visits`
- 公告：`announcements`
- 活動：`events`
- 採購管理：`procurements`
- 公文 / 通知：`documents`
- 團隊管理：`team_members`
- 帳務管理：`ledger_entries`

正式 schema 設計前，仍需確認資料保護、角色權限、稽核、備份與 rollback 策略。
