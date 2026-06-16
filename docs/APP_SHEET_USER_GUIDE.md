# AppSheet 使用者簡易守則

這份文件給前端伙伴與廟方資料維護者使用。原則是用 AppSheet 維護資料，不直接改底層設定。

## 使用者角色

- 系統管理者：可處理 AppSheet / Google Sheets / Render / LINE 後台。
- 前端維護者：只使用 AppSheet 維護資料。
- 一般查詢者：主要使用 LINE 查詢。

## 可以做

- 用 AppSheet 查看友宮資料。
- 用 AppSheet 新增 / 編輯友宮資料。
- 用 AppSheet 查看來訪 / 請帖紀錄。
- 用 AppSheet 新增 / 編輯來訪紀錄。
- 用 LINE 查詢友宮。
- 用 LINE 查詢來訪 / 請帖。
- 用 LINE 查公告。

## 不可以做

- 不要改 Google Sheets 表頭。
- 不要新增 / 刪除 Google Sheets tab。
- 不要改 `member_id`、`shrine_id`、`visit_id` 格式。
- 不要改 `line_uid`。
- 不要清空 `line_query_logs`。
- 不要改 AppSheet Data source。
- 不要按 Regenerate schema，除非系統管理者指示。
- 不要改 Render。
- 不要改 LINE Developers Webhook。

## AppSheet 最小操作流程

1. 開啟 AppSheet。
2. 進入友宮資料。
3. 查找資料。
4. 新增資料。
5. 編輯資料。
6. 儲存。
7. 同步。
8. 遇到錯誤先截圖，不要自行重設。

## LINE 查詢範例

```text
白沙屯
查友宮 白沙屯
查來訪 集慶福德廟
查來訪 大有福德宮
活動公告
查無資料
查紀錄
查記錄
補資料建議
```

## 問題回報格式

```text
發生時間：
操作位置：AppSheet / LINE
輸入內容：
看到的錯誤：
截圖：
是否有修改資料：
```
