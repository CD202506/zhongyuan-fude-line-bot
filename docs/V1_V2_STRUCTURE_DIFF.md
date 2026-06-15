# V1 / V2 Excel Structure Diff

## 比對來源

本報告以唯讀方式比對以下 Excel 匯出檔，未使用 Google Sheets API：

- V1：`中原福德宮_AppSheet_0612.xlsx`
- V2：`中原福德宮_AppSheet_0612--暫存檔 (1).xlsx`

未修改、另存、合併或搬移任何 Excel 資料。

## 結論

- V1 可保留：`members`、`shrines`、`finance_logs`、`events`、
  `settings_lists`、`field_dictionary`。
- V1 需要補齊或升級：`shrine_visits`、`line_query_logs`、
  `announcements`。
- V1 缺少 LINE Bot 必要 tab：`announcements`。
- `members`、`shrines`、`finance_logs`、`events` 的 headers 與資料內容在
  V1 / V2 完全一致。
- V1 的 `shrine_visits` 與 `line_query_logs` 是舊結構，不宜直接讓 LINE Bot
  `0.6.0` 使用。
- 建議建立 `V1_LINE_TEST`，在副本完成結構與資料驗證後才調整正式 V1。

## V1 tab 清單

| Tab | 資料列數 | 第一列表頭 |
| --- | ---: | --- |
| `members` | 4 | `member_id`, `name`, `role`, `phone`, `line_uid`, `permission_level`, `active`, `can_view_internal_shrine`, `can_view_finance`, `can_manage_members`, `note`, `created_at`, `updated_at` |
| `shrines` | 3 | `shrine_id`, `name`, `alias`, `main_god`, `address`, `contact_person`, `contact_phone`, `relation_status`, `public_summary`, `public_notice`, `history_context`, `cultural_taboos`, `internal_note`, `public_visible`, `internal_only`, `last_contact_date`, `next_followup_date`, `owner_member_id`, `updated_by`, `created_at`, `updated_at` |
| `shrine_visits` | 3 | `visit_id`, `shrine_id`, `visit_date`, `visit_type`, `participants`, `summary`, `followup_required`, `followup_note`, `created_by`, `created_at` |
| `finance_logs` | 2 | `log_id`, `date`, `finance_type`, `category`, `amount`, `donor_name`, `public_name`, `purpose`, `receipt_no`, `payment_method`, `public_visible`, `approved`, `created_by`, `note`, `created_at`, `updated_at` |
| `events` | 1 | `event_id`, `event_name`, `event_type`, `start_date`, `end_date`, `status`, `owner_member_id`, `budget_amount`, `actual_amount`, `public_visible`, `public_summary`, `internal_note`, `line_reply_text`, `created_at`, `updated_at` |
| `line_query_logs` | 1 | `log_id`, `query_datetime`, `line_uid`, `member_id`, `query_text`, `query_type`, `target_sheet`, `matched_record_id`, `result`, `reply_mode`, `note` |
| `settings_lists` | 36 | `list_name`, `value`, `display_zh`, `note` |
| `field_dictionary` | 14 | `sheet`, `field_key`, `中文名稱`, `AppSheet 類型建議`, `是否敏感`, `說明` |

## V2 tab 清單

| Tab | 資料列數 | 第一列表頭 |
| --- | ---: | --- |
| `members` | 4 | 與 V1 相同 |
| `shrines` | 3 | 與 V1 相同 |
| `shrine_visits` | 3 | `visit_id`, `visit_type`, `related_shrine_id`, `related_shrine_name`, `direction`, `event_title`, `event_date`, `event_time`, `location`, `contact_person`, `contact_phone`, `participants_text`, `invitation_image_url`, `source_channel`, `source_message_date`, `received_by`, `follow_up_required`, `follow_up_date`, `follow_up_status`, `internal_note`, `created_at`, `updated_at` |
| `finance_logs` | 2 | 與 V1 相同 |
| `events` | 1 | 與 V1 相同 |
| `line_query_logs` | 59 | `log_id`, `query_datetime`, `line_uid`, `member_id`, `query_text`, `query_type`, `target_sheet`, `matched_record_id`, `matched_record_name`, `result_status`, `reply_mode`, `reply_token_used`, `error_message`, `source_type`, `scenario_version`, `note` |
| `settings_lists` | 60 | 與 V1 相同 |
| `field_dictionary` | 34 | 與 V1 相同 |
| `README_V2` | 8 | `項目`, `內容` |
| `change_log` | 6 | `change_id`, `change_date`, `change_type`, `target_sheet`, `target_field`, `change_summary`, `reason`, `impact_level`, `status`, `confirmed_by`, `note` |
| `announcements` | 2 | `announcement_id`, `title`, `category`, `status`, `event_date`, `event_time`, `location`, `line_title`, `line_body`, `facebook_body`, `image_url`, `fb_post_url`, `target_audience`, `publish_to_line`, `line_publish_status`, `line_published_at`, `created_by`, `created_at`, `updated_at`, `note` |
| `v2_migration_checklist` | 11 | `phase`, `task_id`, `task`, `owner`, `status`, `note` |

資料列數不含第一列表頭，並只計算有內容的列。

## LINE Bot 必要 tab

| Tab | V1 | V2 | 判斷 |
| --- | --- | --- | --- |
| `members` | 有 | 有 | V1 / V2 結構與資料相同，可保留 V1 |
| `shrines` | 有 | 有 | V1 / V2 結構與資料相同，可保留 V1 |
| `shrine_visits` | 有，舊版 | 有，新版 | V1 需升級 |
| `announcements` | 缺少 | 有 | V1 需新增 |
| `line_query_logs` | 有，舊版 | 有，新版 | V1 需升級 |

`events`、`finance_logs`、`settings_lists`、`field_dictionary` 目前 LINE Bot
未直接使用。`README_V2`、`change_log`、`v2_migration_checklist` 是維護用途，
不是 runtime 必要 tab。

## 必要欄位差異

### `members`

指定欄位均存在於 V1 / V2：

```text
member_id, name, role, line_uid, permission_level, active,
can_view_internal_shrine, can_view_finance, can_manage_members
```

兩版本 headers 與 4 筆資料完全一致。V1 可保留，但正式切換前仍應人工確認
`測試管理者` 與各 member 的權限、啟用狀態及 LINE 帳號歸屬。

### `shrines`

V1 / V2 headers 與 3 筆資料完全一致。指定基準中的 `internal_reminder` 兩版都沒有，
實際使用 `cultural_taboos`；這也是目前 LINE Bot 內部提醒的 runtime 欄位，因此
不構成功能缺口。

目前資料包含白沙屯拱天宮、北港朝天宮及 `友宮範例廟`。前兩筆可保留；
`友宮範例廟` 明顯為範例資料，不建議搬入正式資料集。

### `shrine_visits`

V1 與 V2 只有 `visit_id`、`visit_type`、`created_at` 三個欄位名稱相同。

V1 舊版特有欄位：

```text
shrine_id, visit_date, participants, summary, followup_required,
followup_note, created_by
```

V2 新版特有欄位：

```text
related_shrine_id, related_shrine_name, direction, event_title,
event_date, event_time, location, contact_person, contact_phone,
participants_text, invitation_image_url, source_channel,
source_message_date, received_by, follow_up_required, follow_up_date,
follow_up_status, internal_note, updated_at
```

使用者指定基準中的 `record_type`、`title`、`note` 並未直接出現在 V2，但目前程式
分別支援 `visit_type`、`event_title`、`internal_note`，因此 V2 可供 LINE Bot
`0.6.0` 使用。

V1 的 3 列含範例文字，且其中 2 列沒有 `visit_id`，不建議直接搬移。V2 的搬移
候選如下：

- `V-0002` 集慶福德廟：來訪紀錄，建議人工確認人員與來源後搬移。
- `V-0003` 大有福德宮：活動邀請，具日期、時間與地點，建議人工確認後搬移。
- `V-0001` 白沙屯拱天宮：由舊範例資料轉換，需先確認是否真實紀錄。

### `announcements`

V1 完全缺少此 tab。V2 具備 LINE Bot 所需欄位，並另有 Facebook 與發布紀錄欄位。

- `A-0001`：`published`，內容源自已辦理的端午愛心肉粽活動，可作半正式搬移
  候選，但 note 標示為範例，搬移前需核對日期與內容。
- `A-0002`：`draft` 且標題、內容明確為 LINE 測試，不應搬移。

### `line_query_logs`

V1 舊版缺少：

```text
matched_record_name, result_status, reply_token_used, error_message,
source_type, scenario_version
```

V1 使用舊欄位 `result`，V2 改為 `result_status`。LINE Bot 現行 header-based append
要求 V2 的完整 16 欄，因此 V1 必須先升級表頭。

V2 有 59 筆紀錄，涵蓋多個開發版本；至少 13 筆 `query_text` 含測試字樣，另有
早期欄位錯置或舊格式紀錄。這些紀錄適合作為 V2 開發歷史，不建議整批搬至 V1。

## 其他 tab 差異

- `finance_logs`、`events`：V1 / V2 headers 與資料完全一致，V1 可保留。
- `settings_lists`：headers 相同，V1 36 筆、V2 60 筆。V2 多 24 筆設定值，但
  LINE Bot 未直接使用，應由 AppSheet 維護者確認後再決定是否補入 V1。
- `field_dictionary`：headers 相同，V1 14 筆、V2 34 筆。V2 多 20 筆欄位說明，
  屬維護資料，不是 LINE Bot 切換的阻塞項目。
- `README_V2`、`change_log`、`v2_migration_checklist`：不需搬入正式 V1；
  維護說明應優先保留在 GitHub `docs/`。

## 搬移建議

### 可考慮搬移

- `announcements` 中經人工確認的 `published` 公告，現階段候選為 `A-0001`。
- `shrine_visits` 中非測試且來源可確認的來訪／請帖，優先檢查 `V-0002`、
  `V-0003`。
- `shrines` 中已確認的白沙屯拱天宮、北港朝天宮資料。
- `members` 中必要管理者與內部人員，但需排除或重新確認測試帳號。

### 不建議搬移

- `line_query_logs` 的大量開發與測試紀錄。
- `query_text` 含「測試」的紀錄。
- `友宮範例廟`、`LINE 公告測試範例` 及未確認的範例來訪資料。
- `README_V2`、`change_log`、`v2_migration_checklist`。
- 無 ID、空白、重複或來源無法確認的資料列。

## 下一步建議

建議建立 `V1_LINE_TEST`，不要直接修改正式 V1：

1. 複製 V1 成 `V1_LINE_TEST`。
2. 將 `shrine_visits` 升級為 V2 相容結構。
3. 將 `line_query_logs` 升級為現行 16 欄結構。
4. 新增 V2 相容的 `announcements`。
5. 只匯入人工確認的 `V-0002`、`V-0003` 與 published 公告候選。
6. 保留 V1 原有 `members`、`shrines`、`finance_logs`、`events`。
7. 視 AppSheet 實際需求，另行決定是否補充 `settings_lists` 與
   `field_dictionary` 的新增維護列。
8. 使用測試服務驗證友宮、來訪、公告、查紀錄與補資料建議。
9. 測試通過後，才把同樣結構與確認資料補回正式 V1。
