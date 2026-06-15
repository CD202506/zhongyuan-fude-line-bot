# V1_LINE_TEST Build Report

## 產出檔案

```text
data/sheets_exports/V1_LINE_TEST_中原福德宮_AppSheet_0612.xlsx
```

本檔案是以 V1 匯出檔為基礎建立的本機測試 workbook，不是正式 V1，也未上傳至
Google Sheets。

## 原始檔案

- V1：`中原福德宮_AppSheet_0612.xlsx`
- V2：`中原福德宮_AppSheet_0612--暫存檔 (1).xlsx`

兩份原始檔只讀取，建置前後 SHA-256 相同，未被修改或覆蓋。

## 新增與升級

### `announcements`

- 從 V2 複製完整 headers。
- 搬入 `A-0001`，因其 `status=published`。
- 未搬入 `A-0002`，因其為 `draft` 且內容明確是 LINE 測試公告。

### `shrine_visits`

- 將 V1 舊版 headers 替換為 V2 headers。
- 保留 V1 可識別歷史列 `V-0001`，只依同名欄位映射：
  `visit_id`、`visit_type`、`created_at`。
- 未猜測 `shrine_id`、`visit_date`、`participants` 等舊欄位與新欄位的對應，
  因此無同名欄位的值留空。
- 從 V2 原樣搬入 `V-0002`、`V-0003`。
- V1 另外兩筆沒有 `visit_id` 且內容為範例的列未保留。

`V-0001` 本身亦含範例內容，現階段只為保留 V1 歷史識別資料；正式搬回 V1 前應
人工確認是否刪除。

### `line_query_logs`

- 將 V1 舊版 headers 升級為 LINE Bot 現行 16 欄。
- 保留 V1 的 `L-0001` 歷史範例。
- 舊欄位 `result` 的值放入新欄位 `result_status`；其餘沒有來源的新增欄位留空。
- 未搬入 V2 的 59 筆開發 logs，也未搬入任何測試 query logs。

## 保留的 V1 tabs

以下 tabs 沿用 V1 原始內容：

```text
members
shrines
finance_logs
events
settings_lists
field_dictionary
```

`events` 維持 AppSheet 活動管理用途，未與 `announcements` 合併。

## 未搬入項目

- `A-0002`：draft 測試公告。
- V2 的 59 筆 `line_query_logs`：包含多版本開發與測試紀錄。
- V1 `shrine_visits` 中兩筆沒有 `visit_id` 的範例列。
- `README_V2`、`change_log`、`v2_migration_checklist`：不是 LINE Bot runtime
  必要 tabs。
- 任何空白列。

## 建立 Google Sheets 測試表

1. 將本檔案上傳為新的 Google Sheets，名稱建議使用 `V1_LINE_TEST`。
2. 不要覆蓋正式 V1，也不要改 AppSheet 的正式資料來源。
3. 將現有 Google Service Account 分享至測試表，先給必要權限。
4. 使用 Render 測試服務或臨時環境變數指向測試表。
5. 測試完成後移除臨時設定；正式 Render 尚不可直接切換。

## LINE Bot 測試前檢查

- 確認五個必要 tabs 都存在：
  `members`、`shrines`、`shrine_visits`、`announcements`、
  `line_query_logs`。
- 確認 `line_query_logs` 第一列是現行 16 欄，並可 append。
- 確認 `members.line_uid` 與測試帳號對應，權限值正確。
- 確認 `shrines` 可查白沙屯，公開／內部回覆分流正常。
- 確認 `查來訪 集慶福德廟` 與 `查來訪 大有福德宮`。
- 確認 `查公告` 只顯示 `A-0001`。
- 確認 `查紀錄`、`查無資料`、`補資料建議` 可讀取新 logs。
- 確認新查詢只追加到測試表，不影響正式 V1 或 V2。
