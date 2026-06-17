# 中原福德宮 LINE Bot 目前狀態

## Current status

- Runtime version：`0.6.0`
- 正式資料來源：`中原福德宮_AppSheet_0612`
- Render service：`zhongyuan-fude-line-bot`
- AppSheet app：`中原福德宮_AppSheet`
- 正式切換：已完成
- AppSheet 基本檢查：已通過
- LINE 官方帳號預設自動回覆：已關閉

## Completed milestones

- `0.7.2` 建立 V1_LINE_TEST
- `0.7.3` V1_LINE_TEST LINE 實測通過
- `0.7.5` 程式化補齊正式 V1
- `0.7.6` Render 正式切換到 V1
- `0.7.6A` 回覆文字與指令別名小修完成
- `0.8.0A` Web 後台 MVP 與資料模型 V2 規劃文件完成並 commit：`7131b65`
- `0.8.0A-1` Controlled Web Admin MVP Prototype 進行中，`web_admin_mvp/` 已建立為本機可視化 prototype，尚未 commit、尚未部署。

## Current data source roles

```text
中原福德宮_AppSheet_0612
→ 正式 V1
→ AppSheet 正式來源
→ LINE Bot 正式來源

中原福德宮_AppSheet_0612--暫存檔
→ V2 暫存 / 舊測試
→ 保留，不作正式來源

中原福德宮_AppSheet_0612_V1_LINE_TEST
→ 測試表
→ 保留，不刪除

中原福德宮_AppSheet_0612_正式V1備份_20260615_before_patch
→ 正式 V1 補齊前備份
→ 只供 rollback 參考
```

## Verified LINE commands

```text
說明
白沙屯
查來訪 集慶福德廟
查來訪 大有福德宮
活動公告
白沙屯測試
查無資料
查紀錄
查記錄
最近記錄
補資料建議
```

## Known notes

- AppSheet 介面中的內部 data source 名稱可能與 Google Sheets 實際檔名不同；以 `View data source` 打開的 Google Sheets 為準。
- `line_query_logs` 在 AppSheet 顯示欄位數可能與 Google Sheets 不完全一致，但目前 Preview 無錯誤，主畫面可開，暫不處理。
- `announcements` 尚未加入 AppSheet 管理畫面；目前 LINE Bot 可直接讀 Google Sheets 公告資料。
- `V2 暫存表` 字樣已從 runtime LINE 回覆移除，改為 `廟方資料表`。
- Web 後台 MVP 目前只使用 mock/dev data，不接正式 Google Sheets，不修改正式 LINE Bot runtime，不修改 Render 設定，不修改 LINE Developers Webhook。
- Web 後台 UX 最新決策記錄於 `docs/WEB_ADMIN_UX_REVIEW_NOTES.md`。在使用者通知繼續前，不要繼續改畫面、不要 commit、不要部署。
- Web 後台全站資料管理流程已定為：先瀏覽 / 搜尋 → 查看詳情 → 詳情頁內編輯 / 管理關聯資料。列表頁以查看詳情為主，新增 CTA 僅保留在明確少數位置。

## Next optional steps

```text
0.7.8：AppSheet 公告管理畫面規劃
0.7.9：廟方資料維護流程簡化
0.8.0：LINE 發布公告 / 主動推播規劃
```
