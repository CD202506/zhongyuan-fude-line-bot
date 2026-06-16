# Handoff

## 目前正式狀態

- 目前正式資料來源：`中原福德宮_AppSheet_0612`
- Render：`GOOGLE_SHEET_ID` 已正式指向 V1
- AppSheet：`中原福德宮_AppSheet` 已接 V1，基本檢查通過
- V2 暫存表：保留備份 / 測試，不再作正式來源
- V1_LINE_TEST：保留測試，不刪除
- LINE 官方帳號預設自動回覆：已關閉
- Runtime version：`0.6.0`

## 目前可用 LINE 指令

```text
說明
白沙屯
查友宮 白沙屯
查廟 白沙屯
查來訪 集慶福德廟
查來訪 大有福德宮
請帖 大有
活動公告
查紀錄
查記錄
最近記錄
查無資料
補資料建議
```

## 目前不要做

- 不要刪 V2 暫存表
- 不要刪 V1_LINE_TEST
- 不要清空 `line_query_logs`
- 不要讓前端伙伴修改 tab / 欄位
- 不要把 AppSheet 改接 V2
- 不要更換 Render `GOOGLE_SHEET_ID`，除非有明確 rollback 需求
- 不要手動改 Service Account JSON

## 確認系統正常

1. 開啟 `/health`，確認 `status=ok`。
2. LINE 輸入「白沙屯」，確認收到友宮資料。
3. LINE 輸入「查來訪 集慶福德廟」，確認可查來訪或請帖。
4. LINE 輸入「活動公告」，確認可查公告。
5. LINE 輸入「白沙屯測試」，確認回查無資料。
6. LINE 輸入「查紀錄」與「查記錄」，確認內部查詢紀錄可讀。
7. 檢查正式 V1 的 `line_query_logs` 有新增紀錄。

## 主要檔案

| 檔案 | 用途 |
| --- | --- |
| `main.py` | FastAPI routes 與 LINE webhook 流程 |
| `config.py` | 版本與環境設定 |
| `command_router.py` | LINE 文字指令分流 |
| `line_client.py` | 呼叫 LINE Reply API |
| `sheets_client.py` | Google Sheets 讀寫與 TTL cache |
| `permission_service.py` | members 查找與內部權限判斷 |
| `shrine_search_service.py` | shrines 搜尋 |
| `shrine_visit_service.py` | 友宮來訪 / 請帖查詢 |
| `announcement_service.py` | 公告被動查詢 |
| `query_log_lookup_service.py` | 內部查詢紀錄與補資料建議 |
| `reply_builder.py` | LINE 純文字回覆組合 |
| `log_service.py` | `line_query_logs` 寫入 |

## 下一步建議

- `0.7.8`：AppSheet 公告管理畫面規劃
- `0.7.9`：廟方資料維護流程簡化
- `0.8.0`：LINE 發布公告 / 主動推播規劃
