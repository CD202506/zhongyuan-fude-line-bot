# Handoff

## 目前狀態

版本 `0.2.3`。LINE 友宮查詢 MVP 已完成：

- 依 `shrines` 的廟名或 alias 查詢
- 依 `members.line_uid`、`active`、`can_view_internal_shrine` 回公開版或內部版
- 查無資料回覆
- `line_query_logs` 紀錄
- Sheets TTL cache
- `/debug/sheets` 預設關閉
- log 寫入失敗不阻擋 LINE 回覆

## 確認系統正常

1. 開啟 `/health`，確認 `status=ok`、版本為 `0.2.3`。
2. 在 LINE 輸入「白沙屯」，確認收到一則友宮資料回覆。
3. 輸入「白沙屯測試」，確認回查無資料。
4. 檢查 `line_query_logs` 有新增紀錄。
5. 若失敗，查看 Render Logs，再檢查 LINE token、Sheet ID、Service Account 權限與
   Google Sheets tab 名稱。

## 公開版 / 內部版測試

使用指定測試 member，確認 `line_uid` 與測試 LINE 帳號相符：

- 內部版：`active=yes`、`can_view_internal_shrine=yes`
- 公開版：`active=yes`、`can_view_internal_shrine=no`

變更後等待 `SHEETS_CACHE_TTL_SECONDS` 再測，完成後還原原值。不要修改其他 member。

## 主要檔案

| 檔案 | 用途 |
| --- | --- |
| `main.py` | FastAPI routes 與 LINE webhook 流程 |
| `config.py` | 版本與環境設定 |
| `line_client.py` | 呼叫 LINE Reply API |
| `sheets_client.py` | Google Sheets 讀寫與 TTL cache |
| `permission_service.py` | members 查找與內部權限判斷 |
| `shrine_search_service.py` | shrines 搜尋 |
| `reply_builder.py` | 公開版、內部版、查無資料文字 |
| `log_service.py` | `line_query_logs` 寫入 |

## 下一步建議

- 先不要急著做公告發布。
- 可評估加入 `shrine_visits`。
- 可評估加入 `announcements`。
- 可評估整理 V2 → V1 改版清單。

新增功能前先保持目前 MVP 穩定，並避免同時修改 LINE 回覆、權限與 Sheets 結構。
