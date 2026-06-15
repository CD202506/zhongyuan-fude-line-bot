# 正式 V1 程式化補齊指南

手動貼表頭與多欄資料容易錯位，因此改用
`tools/patch_v1_sheet_from_line_test.py` 產生變更計畫並套用。工具只處理：

```text
announcements
shrine_visits
line_query_logs
```

LINE Bot runtime 版本維持 `0.6.0`。

## 執行前

1. 先複製正式 V1 作完整備份。
2. 確認目標 spreadsheet title 正好是 `中原福德宮_AppSheet_0612`。
3. 將 Service Account 分享至正式 V1；dry-run 至少需 Viewer，apply 需 Editor。
4. 確認本機存在：
   `data/sheets_exports/V1_LINE_TEST_中原福德宮_AppSheet_0612.xlsx`。
5. 操作期間暫停前端伙伴編輯。

工具不使用 `GOOGLE_SHEET_ID`，只讀取 `V1_GOOGLE_SHEET_ID`。

## Dry-run

預設只讀。dry-run 使用 Google Sheets read-only scope，不會寫入。

```powershell
$env:V1_GOOGLE_SHEET_ID="your_v1_sheet_id"
$env:GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account", "...":"..."}'
Remove-Item Env:APPLY_V1_PATCH -ErrorAction SilentlyContinue
python tools/patch_v1_sheet_from_line_test.py
```

先檢查輸出中的：

- `target_title` 是否正確。
- `tabs_to_create` / `tabs_to_upgrade` 是否符合預期。
- `add_ids` 是否只包含 `A-0001`、`V-0002`、`V-0003` 中尚未存在者。
- `skip_ids` 是否正確顯示已存在資料。
- `blockers` 必須是 `none`。

## Apply

只有明確設定 `APPLY_V1_PATCH=true` 才會使用可寫 scope 並執行。

```powershell
$env:V1_GOOGLE_SHEET_ID="your_v1_sheet_id"
$env:GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account", "...":"..."}'
$env:APPLY_V1_PATCH="true"
python tools/patch_v1_sheet_from_line_test.py
```

apply 前工具會再次檢查 title、表頭與資料列數。若 dry-run 後有人修改相關 tab，
工具會停止，需重新 dry-run。

## Apply 後檢查

- V1 新增或補齊 `announcements`，且只有 `A-0001` 被工具選入。
- `shrine_visits` 使用 V1_LINE_TEST 表頭，既有列仍存在。
- `V-0002`、`V-0003` 各只有一筆。
- `line_query_logs` 使用完整 16 欄，原有 logs 依欄位名稱保留。
- 舊 `result` 會映射到新 `result_status`，其餘無法對應欄位留空。
- AppSheet 可正常開啟及新增／編輯原有資料。
- Render 尚未切換；先另行安排正式 LINE 回歸測試。

## 不處理的 tabs

工具不讀寫以下 tabs：

```text
members
shrines
events
finance_logs
settings_lists
field_dictionary
README_V2
change_log
v2_migration_checklist
```

工具不刪 tab、不清空資料，也不匯入 V2 的開發 logs 或 draft 測試公告。

## Rollback

若 apply 後發現異常：

1. 不要切換正式 Render。
2. 停止 AppSheet 編輯。
3. 依操作前建立的正式 V1 備份，還原受影響的三個 tabs。
4. 再次確認 AppSheet 原功能。
5. 修正原因後重新執行 dry-run，不要直接重跑 apply。
