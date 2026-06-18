# 0.8.0A-1 Web 後台 MVP Prototype

這是桃園中原福德宮 Web 後台 MVP 的本機開發預覽。

## 安全說明

- 只使用本機測試資料。
- 不會寫入正式 Google Sheets。
- 不會影響正式 LINE Bot。
- 不會修改 Render 設定。
- 不會修改 LINE Developers Webhook。
- 不包含正式帳號、token、Sheet ID 或 secret。

## 開啟方式

可直接用瀏覽器開啟：

```text
web_admin_mvp/index.html
```

若瀏覽器限制本機檔案載入，也可在 repo 根目錄啟動簡單本機伺服器：

```powershell
python -m http.server 8080
```

再開啟：

```text
http://127.0.0.1:8080/web_admin_mvp/
```

## Prototype 範圍

目前包含：

- 左側選單目前依 V2 架構文件調整為 8 個模組入口：主控台、善信管理、友宮管理、來訪 / 請帖、公告 / 活動、團隊管理、帳務管理、管理者設定。廟務職務與系統權限是團隊管理的下一層內容，不放在左側選單。
- 一般模組主頁以列表、搜尋、篩選與查看詳情為主。
- 詳情頁才提供編輯、停用、作廢與管理關聯資料。
- 關聯資料在詳情頁只顯示數量、最近一筆或摘要，再引導到對應列表 / 詳情。
- 管理者設定集中放置：基礎設定、權限與角色、系統操作紀錄、系統與資料來源。
- 設定類、權限類、LINE 維運類與資料來源類內容不放在一般模組主頁快速卡片。

所有新增、編輯與儲存按鈕都只用於畫面流程示意，不會寫入正式資料。

## 管委會 / 成員測試資料

目前 repo 內沒有找到可確認為「先前已校正過的正式管委會 / 成員名單」文件。使用者後續提供名冊照片後，已將照片可辨識內容轉入本機測試資料。

本 prototype 只在 `mockData.js` 建立照片轉錄測試資料，並標示為：

```text
待校對 / 不代表正式名冊
```

照片中未提供電話，因此成員電話欄位顯示 `未提供`。資料來源標示為 `照片轉錄 / 待校對`，待使用者提供校正版名單後，再替換本機測試資料。

## V2 本機測試資料對應

- Web prototype 內部使用 `temples`、`temple_contacts`、`temple_visits`。
- 使用者畫面仍顯示「友宮」等中文名稱。
- 短期正式 V1 runtime 不改 `shrines` / `shrine_visits`。
- 本機測試資料中示範 `role_types`、`member_role_assignments`、`announcement_links`、`devotees`、`duty_rosters`、`monthly_finance_reports`。
- 帳務測試資料不包含帳戶、銀行、真實收據號碼或敏感資訊。
- LINE 查詢紀錄測試資料不讀寫正式 `line_query_logs`。
- 來訪型態、發布管道、職稱主檔、收支分類、查詢維運與資料來源說明集中在管理者設定，不放在一般操作選單。
- 管理者設定目前只呈現需管理者權限的 prototype 概念，尚未實作登入或權限驗證。
- 權限 prototype 目前採方案 B：`admin` 可操作；`staff` / `viewer` 未來可顯示為灰色鎖定並提示需管理者權限。
- 系統與資料來源區塊記錄 V2 `temples` / V1 `shrines`、V2 `temple_visits` / V1 `shrine_visits` 的相容方向。
