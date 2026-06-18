# 正式 V1 手動補齊指南

本指南用於把已在 `V1_LINE_TEST` 驗證過的必要結構與少量資料，人工補回正式 V1
`中原福德宮_AppSheet_0612`。本階段不切換 Render。

## 1. 操作總原則

- 先複製正式 V1 作完整備份。
- 操作期間不要讓前端伙伴同時編輯。
- 不刪除 V1 既有 `events`，也不合併 `events` 與 `announcements`。
- 不把 AppSheet 改接 V2，不覆蓋或清空正式 V1。
- 只補必要 tab、欄位與少量已確認資料。
- 完成後再請前端伙伴只確認 AppSheet 畫面與原功能。

## 2. 正式 V1 需要補齊項目

```text
新增 tab：
- announcements

升級 tab：
- shrine_visits
- line_query_logs

不處理：
- events
- finance_logs
- settings_lists
- field_dictionary
- README_V2
- change_log
- v2_migration_checklist
```

## 3. `announcements` 表頭

在新建的 `announcements` 工作表 A1 貼上以下 TSV：

```tsv
announcement_id	title	category	status	event_date	event_time	location	line_title	line_body	facebook_body	image_url	fb_post_url	target_audience	publish_to_line	line_publish_status	line_published_at	created_by	created_at	updated_at	note
```

## 4. `announcements` 搬入資料

`A-0001` 可搬入，因為 `status=published`；但其 note 標示為歷史活動範例，貼入後
仍需核對日期、地點與內容。`A-0002` 是 draft 測試公告，不搬入。

以下是完整 TSV 資料列。`line_body` 含多行文字，因此使用雙引號包住；建議整段
複製後貼入 A2，再確認只產生一筆資料且共有 20 欄。

```tsv
A-0001	端午佳節百顆愛心肉粽發送	公益/端午	published	115/06/13	上午 11 點開始	宏昌十三街512號對面	❤️ 百顆愛心肉粽發送	"❤️ 百顆愛心肉粽發送
【粽香傳愛・福德送暖】
桃園中原福德宮秉持關懷鄉里、敦親睦鄰的精神，於端午佳節舉辦愛心肉粽分享活動，將節慶的喜悅與祝福送到每一位鄉親手中。

📅 日期：115年6月13日（星期六）
⏰ 時間：上午 11 點開始
📍 地點：宏昌十三街512號對面

數量有限，送完為止。
桃園中原福德宮 敬祝大家安康平安。"	FB 已發表貼文，可將完整貼文內容整理後貼於此欄。第一版不建議自動同步 FB，應人工確認 LINE 短版文字後再發送。			all	no	not_sent			2026-06-13	2026-06-13	範例由已辦完之愛心肉粽活動建立；正式推播前需使用 test audience 驗證
```

若 Google Sheets 直接貼上後把引號內換行拆成多列，請改由「檔案 → 匯入」匯入
`V1_LINE_TEST` 的 `announcements`，或先貼入單一儲存格後再分欄；不要手動刪減
`line_body`。

## 5. `shrine_visits` 新版表頭

先備份舊工作表，再將第一列升級為：

```tsv
visit_id	visit_type	related_shrine_id	related_shrine_name	direction	event_title	event_date	event_time	location	contact_person	contact_phone	participants_text	invitation_image_url	source_channel	source_message_date	received_by	follow_up_required	follow_up_date	follow_up_status	internal_note	created_at	updated_at
```

## 6. `shrine_visits` 搬入資料

只搬入 `V-0002`、`V-0003`：

```tsv
V-0002	visit_record		集慶福德廟	incoming	友宮來訪 / 交誼名單紀錄						集慶福德廟主任委員 田達士、爐主 陳國欽、三星地區農會理事長 徐進忠、鄉民代表 溫慶華、三星社區發展協會理事長 林麗花、總幹事 廖妙妃、安農溪志工隊隊長 陳建彰、顯微宮副主任委員 張文子、張公圍福德廟誦經團團長 余進益、集慶村村長 彭正賢。		LINE	2026-05-16		no		no_need	來源為 LINE 截圖文字，建議人工確認友宮名稱與人名後再整理 contacts。	2026-06-13	2026-06-13
V-0003	invitation		大有福德宮	incoming	大有福德宮活動邀請	115/05/20	晚上 6 點入席	桃園大有福德宮 / 邀請函所載地點			邀請對象：桃園中原福德宮 殿；紙本邀請函照片。		LINE image	2026-05-16		yes		pending	來源為請帖照片，日期、時間與地點需由人工依原件確認；圖片請上傳 Google Drive 後填入 invitation_image_url。	2026-06-13	2026-06-13
```

- V1 原本 `V-0001` 可保留，但它含範例內容，正式使用前應再次確認。
- V1 另外兩筆沒有 `visit_id` 的範例列不建議搬入新版正式結構。
- `V-0002`、`V-0003` 貼入後，需人工確認友宮名稱、日期、人名及請帖資料。

## 7. `line_query_logs` 新版表頭

先備份舊工作表，再將第一列升級為完整 16 欄：

```tsv
log_id	query_datetime	line_uid	member_id	query_text	query_type	target_sheet	matched_record_id	matched_record_name	result_status	reply_mode	reply_token_used	error_message	source_type	scenario_version	note
```

## 8. `line_query_logs` 歷史資料處理

- 正式 V1 可保留原本 `L-0001` 歷史範例，但不是必要。
- 若保留，舊欄位 `result` 應對應到新欄位 `result_status`，其他無來源欄位留空。
- 不搬 V2 的 59 筆開發 logs，也不搬測試 query logs。
- 不清空 `line_query_logs`；先備份，再升級表頭。
- 正式切換後由 LINE Bot 自動追加新 logs。

## 9. 手動操作步驟

1. 複製正式 V1 作備份。
2. 在正式 V1 新增 `announcements`。
3. 貼上 announcements 表頭。
4. 貼上 `A-0001`，確認一筆、20 欄。
5. 進入 `shrine_visits`。
6. 備份舊表頭與資料。
7. 將表頭升級為新版。
8. 保留人工確認後可保留的舊資料。
9. 貼上 `V-0002`、`V-0003`，確認各 22 欄。
10. 進入 `line_query_logs`。
11. 備份舊表頭與資料。
12. 將表頭升級為 16 欄。
13. 暫不搬入 V2 logs。
14. 儲存並等待 Google Sheets / AppSheet 同步。
15. 請前端伙伴只檢查 AppSheet 畫面是否正常。

## 10. AppSheet 檢查點

- AppSheet 是否仍能開啟。
- `members` 是否可查看。
- `shrines` 是否可查看。
- `shrine_visits` 是否可查看。
- `events` 是否未受影響。
- 原有新增、編輯流程是否仍正常。
- 若 AppSheet 未自動辨識新版欄位，只由技術端重新產生或更新 schema。
- 若未來要讓 AppSheet 讀取 `announcements`，由技術端另行安排，不由前端伙伴
  修改底層結構。

## 11. Render 正式切換前檢查

- [ ] V1 有 `members`。
- [ ] V1 有 `shrines`。
- [ ] V1 有新版 `shrine_visits`。
- [ ] V1 有 `announcements`。
- [ ] V1 有新版 `line_query_logs`。
- [ ] Service Account 已加入 V1 並具備 Editor 權限。
- [ ] `V1_LINE_TEST` 的 LINE 測試結果已通過。
- [ ] 已安全備份目前 V2 的 `GOOGLE_SHEET_ID`，但未寫入 Git 文件。
- [ ] AppSheet 已由前端伙伴確認原功能正常。

## 12. 禁止事項

- 不刪除 V1，不覆蓋 V1 整份檔案。
- 不把 AppSheet 改接 V2。
- 不刪除 `events`。
- 不讓前端伙伴修改 tab、欄位、Render 或 Bot 設定。
- 不搬 V2 開發 logs 或測試 query logs。
- 不搬 `A-0002` 等 draft 測試公告。
- 不清空 `line_query_logs`。
- 在上述檢查完成前，不切換正式 Render。
