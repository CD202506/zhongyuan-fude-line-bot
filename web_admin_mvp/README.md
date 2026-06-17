# 0.8.0A-1 Web 後台 MVP Prototype

這是中原福德宮 Web 後台 MVP 的本機開發預覽。

## 安全說明

- 只使用本機 mock/dev data。
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

- 左側選單只保留 7 個模組入口：主控台、友宮管理、來訪 / 請帖、公告 / 活動、成員 / 職務、財務管理、管理者設定。
- 細項操作放在各模組頁面內，以 CTA、卡片與區塊呈現。
- 管理者設定集中放置：基礎設定、權限與角色、LINE / 查詢維運、系統與資料來源。

所有新增、編輯與儲存按鈕都只用於畫面流程示意，不會寫入正式資料。

## 管委會 / 成員測試資料

目前 repo 內沒有找到可確認為「先前已校正過的正式管委會 / 成員名單」文件。使用者後續提供名冊照片後，已將照片可辨識內容轉入 mock/dev data。

本 prototype 只在 `mockData.js` 建立照片轉錄測試資料，並標示為：

```text
開發測試資料 / 不代表正式名冊
```

照片中未提供電話，因此成員電話欄位顯示 `未提供`。資料來源標示為 `照片轉錄 / 待校對`，待使用者提供校正版名單後，再替換 mock/dev data。

## V2 mock data 對應

- Web prototype 內部使用 `temples`、`temple_contacts`、`temple_visits`。
- 使用者畫面仍顯示「友宮」等中文名稱。
- 短期正式 V1 runtime 不改 `shrines` / `shrine_visits`。
- mock data 中示範 `role_types`、`member_role_assignments`、`announcement_links`。
- 財務 mock data 不包含帳戶、銀行、真實收據號碼或敏感資訊。
- LINE 查詢紀錄 mock data 不讀寫正式 `line_query_logs`。
- 來訪型態、發布管道、職稱主檔、收支分類、查詢維運與資料來源說明集中在管理者設定，不放在一般操作選單。
- 管理者設定目前只呈現需管理者權限的 prototype 概念，尚未實作登入或權限驗證。
- 權限 prototype 目前採方案 B：`admin` 可操作；`staff` / `viewer` 未來可顯示為灰色鎖定並提示需管理者權限。
