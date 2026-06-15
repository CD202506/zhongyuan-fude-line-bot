# V1 / V2 Google Sheets Structure Diff

## 執行狀態

本次尚未連線讀取 V1 / V2，因本機缺少：

```text
V1_GOOGLE_SHEET_ID
V2_GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_JSON
```

未使用現有 `GOOGLE_SHEET_ID` 猜測 V1 或 V2，也未修改任何 Google Sheets。

設定上述本機環境變數後，可執行：

```powershell
.\.venv\Scripts\python.exe tools\compare_sheet_headers.py `
  --output docs\V1_V2_STRUCTURE_DIFF.md
```

腳本使用 Google Sheets read-only scope，只輸出 tab 名稱、第一列表頭、第一欄非空
資料列數與欄位差異，不輸出 Sheet ID、憑證或儲存格內容，也不讀取整張表的資料列。

## 初步結論

- LINE Bot 必要 tab：`members`、`shrines`、`shrine_visits`、
  `announcements`、`line_query_logs`。
- `events`、`finance_logs`、`settings_lists`、`field_dictionary` 目前 LINE Bot
  未直接使用。
- V1 / V2 的實際 tab、headers、列數與缺口尚待執行唯讀腳本後填入。
- 不應在取得實際結構差異前直接修改正式 V1。

## V1 tab 清單

尚未讀取。執行腳本後會列出 tab、headers 與第一欄非空資料列數。

## V2 tab 清單

尚未讀取。執行腳本後會列出 tab、headers 與第一欄非空資料列數。

## LINE Bot 必要 tab 存在狀態

| Tab | V1 | V2 |
| --- | --- | --- |
| `members` | 尚未讀取 | 尚未讀取 |
| `shrines` | 尚未讀取 | 尚未讀取 |
| `shrine_visits` | 尚未讀取 | 尚未讀取 |
| `announcements` | 尚未讀取 | 尚未讀取 |
| `line_query_logs` | 尚未讀取 | 尚未讀取 |

## 必要欄位基準

| Tab | 基準欄位 |
| --- | --- |
| `members` | `member_id`, `name`, `role`, `line_uid`, `permission_level`, `active`, `can_view_internal_shrine`, `can_view_finance`, `can_manage_members` |
| `shrines` | `shrine_id`, `name`, `alias`, `main_god`, `public_visible`, `public_summary`, `public_notice`, `internal_reminder`, `history_context`, `internal_note` |
| `shrine_visits` | `visit_id`, `record_type`, `related_shrine_id`, `related_shrine_name`, `direction`, `title`, `event_date`, `event_time`, `location`, `note` |
| `announcements` | `announcement_id`, `title`, `category`, `status`, `event_date`, `event_time`, `location`, `line_title`, `line_body`, `target_audience`, `publish_to_line`, `line_publish_status`, `created_at`, `updated_at`, `note` |
| `line_query_logs` | `log_id`, `query_datetime`, `line_uid`, `member_id`, `query_text`, `query_type`, `target_sheet`, `matched_record_id`, `matched_record_name`, `result_status`, `reply_mode`, `reply_token_used`, `error_message`, `source_type`, `scenario_version`, `note` |

`shrine_visits` 與 `announcements` 的程式容錯欄位已納入比較腳本；實際結果產生後，
會同時列出 V1 缺少欄位、V2 有但 V1 沒有，以及 V1 有但 V2 沒有的欄位。

## 必要 tab header 差異

尚未讀取。執行腳本後會逐一列出：

- V1 缺少的必要 tab。
- V1 / V2 各自缺少的基準欄位。
- V2 有但 V1 沒有的欄位。
- V1 有但 V2 沒有的欄位。
- 目前程式可接受且實際出現在任一版本的容錯欄位。

## 資料列搬移判斷

結構腳本不讀出或分析儲存格內容，因此目前無法列出特定測試列或正式列。

- 不建議搬移：包含「測試」、placeholder、假廟名、測試 LINE 帳號、
  draft / archived 公告、來源不明、空白或重複資料。
- 建議人工確認後搬移：權限已核對的 members、校對完成的 shrines、來源可確認的
  shrine_visits、狀態為 published / ready 的 announcements。
- `line_query_logs` 預設不整批搬移；需要延續統計時，先排除測試與敏感紀錄。

## 下一步建議

1. 由維護者在本機暫時設定三個必要環境變數。
2. 執行唯讀腳本覆寫本文件，取得實際結構差異。
3. 依結果複製 V1 成 `V1_LINE_TEST`，只在副本補齊結構。
4. 人工複核 V2 資料內容後，再決定可搬移資料。
5. 完成副本測試前，不修改正式 V1，也不切換 Render。
