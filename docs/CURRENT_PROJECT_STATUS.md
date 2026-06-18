# 桃園中原福德宮 LINE Bot 目前狀態

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
- `0.8.0A-1` Controlled Web Admin MVP Prototype 已完成第一版並推送：`e31e81e prototype: add controlled web admin MVP`。
- `0.8.0A-1` 後續批次 UX 重整進行中：全站主頁列表優先、設定 / 維運集中管理者設定、關聯資料摘要化。本輪尚未 commit、尚未部署。
- `0.8.0A-1` Web 後台 V2 架構文件補強進行中：補充人員層級、善信管理、團隊管理、值勤班表與帳務關聯模型。本輪只修改文件，不修改 prototype 畫面、runtime、資料源或部署設定。
- `0.8.0A-1` 帳務管理定位補強進行中：未來正式模組命名建議使用「帳務管理」，短期定位為廟務流水帳紀錄、收支摘要、月度收支公告草稿與 LINE 群組公告內容輔助，不做完整會計、報稅、審計或銀行帳務功能。
- `0.8.0A-4` Internal UX Cleanup Before Third-party Preview 進行中：整理返回 CTA、管理者設定分類、標籤 / 主檔分組與職務任期歸屬，再交給第三方驗證。
- `0.8.0A-6` Information Architecture Cleanup Before Third-party Preview 已完成並推送：`8334e3e prototype: clarify web admin information architecture`。
- `0.8.0A-7` Preview UI Residue Cleanup 已完成並推送：`86eda54 prototype: clean up preview residue before third-party review`。

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
- Web 後台 MVP 目前只使用本機測試資料，不接正式 Google Sheets，不修改正式 LINE Bot runtime，不修改 Render 設定，不修改 LINE Developers Webhook。
- Web 後台 UX 最新決策記錄於 `docs/WEB_ADMIN_UX_REVIEW_NOTES.md`。本輪批次 UX 重整完成後需先由使用者 review，不要自行 commit、不要部署。
- Web 後台全站資料管理流程已定為：先瀏覽 / 搜尋 → 查看詳情 → 詳情頁內編輯 / 管理關聯資料。列表頁以查看詳情為主，新增 CTA 僅保留在明確少數位置。
- Web 後台一般模組主頁應以列表、搜尋、篩選、查看詳情為主；設定類、權限類、LINE 維運類、資料來源類集中於管理者設定。
- Web 後台 V2 需區分任何人、善信、團隊成員、系統使用者、系統管理者。廟務職務、團隊值勤、系統權限必須分開。
- 後續模組可討論新增善信管理與團隊管理，但目前只做文件規劃，不修改 `web_admin_mvp/` 畫面。
- 每月 LINE 群組公告是帳務管理必要需求；公告對象至少包含團隊成員、管理委員會成員與系統管理者。本階段只規劃月報公告草稿，不做正式推播。
- 最新架構補強需記錄：櫃檯接待窗口、現場表單顯性經手人 / 現場值班欄位、金額輸入清洗、作廢 / 沖銷原則，以及資料來源健康燈號方向。本階段只做文件，不改 prototype、runtime 或正式資料。
- 依 V2 架構文件開始將新模組落到 `web_admin_mvp/` prototype：新增善信管理、團隊管理、帳務管理與月報公告草稿可視畫面，並維持本機測試資料、不接正式 Google Sheets、不修改 runtime、不部署。
- 未獲正式明確指令前，開發範圍限制在 `web_admin_mvp/` 與 `docs/`，不接 Google Sheets、FastAPI runtime 或 Render。
- 第三方驗證前 UX cleanup 原則：次頁、詳情頁、表單頁不可只依賴瀏覽器返回；管理者設定只放系統參數、規則與維運說明，不放具體人員任期資料；標籤 / 主檔管理需分清發布管道、發布狀態、廟務職務、友宮聯絡人職稱、系統權限與帳務分類。
- 第三方驗證前資訊架構 cleanup 原則：主控台顯示近期廟務動態，不顯示系統 log；系統操作紀錄歸管理者設定；友宮名稱不得混入來訪主題；來訪 / 請帖是互動事件，公告 / 活動是發布或活動內容。
- 第三方預覽前 UI residue cleanup 原則：友宮名稱欄只顯示宮廟主檔名稱；來訪 / 請帖主題需獨立欄位；一般來訪列表不顯示來訪型態主檔；團隊管理主頁只保留團隊成員列表與值勤班表。

## Next optional steps

```text
0.7.8：AppSheet 公告管理畫面規劃
0.7.9：廟方資料維護流程簡化
0.8.0：LINE 發布公告 / 主動推播規劃
```
