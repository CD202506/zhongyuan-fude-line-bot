# 試營運前檢查清單

## A. 資料來源確認

- 唯一正式資料來源：`中原福德宮_AppSheet_0612`
- V2 暫存表保留，不作正式來源。
- V1_LINE_TEST 保留，不作正式來源。
- 正式啟用前備份已建立。
- 不要刪除備份表、V2 暫存表、V1_LINE_TEST。

## B. AppSheet 檢查

- AppSheet app 可正常打開。
- `members` 可看。
- `shrines` 可看。
- `shrine_visits` 可看。
- `events` 可看。
- `finance_logs` 可看。
- Preview 不報錯。
- 手機版畫面可正常切換。
- 前端使用者可登入。
- 不要在正式使用前隨意 Regenerate schema。
- 不要改資料來源。
- 不要新增 / 刪除 table。

## C. Google Sheets 檢查

- `members` 存在。
- `shrines` 存在。
- `shrine_visits` 存在。
- `announcements` 存在。
- `line_query_logs` 存在。
- `events` 存在。
- `finance_logs` 存在。
- 不清空 `line_query_logs`。
- 不改表頭。
- 不刪 tab。
- 不改 ID 格式。

## D. LINE Bot 檢查

逐一測試：

```text
說明
白沙屯
查友宮 白沙屯
查來訪 集慶福德廟
查來訪 大有福德宮
活動公告
查無資料
查紀錄
查記錄
最近記錄
補資料建議
```

## E. LINE 官方帳號檢查

- Webhook 已啟用。
- 預設自動回覆已關閉。
- LINE Bot 回覆正常。
- 不要變更 Webhook URL。
- 不要重設 Channel Access Token。

## F. 試營運建議

第一批使用者只限：

- 系統管理者
- 前端伙伴
- 1 位廟方內部測試管理者

建議試營運 3～7 天。期間記錄：

- 查不到的資料
- AppSheet 操作問題
- LINE 查詢問題
- 欄位名稱看不懂的地方
