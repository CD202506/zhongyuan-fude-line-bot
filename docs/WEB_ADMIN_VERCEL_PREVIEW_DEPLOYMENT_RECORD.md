# Web Admin Vercel Preview Deployment Record

## 1. 部署目的

本次部署為 Web 後台 UI / UX 第三方測試版本。

- 不是正式上線。
- 不連接正式資料。
- 不寫入資料庫。
- 不影響 LINE Bot。
- 不影響 Render。
- 不影響 Google Sheets / AppSheet。

## 2. 部署資訊

- Vercel project：`zhongyuan-fude-web-admin-test`
- 測試網址：`https://zhongyuan-fude-web-admin-test.vercel.app`
- Repository：`CD202506/zhongyuan-fude-line-bot`
- Branch：`main`
- Commit：`7b37733 feat: prepare web admin visual ux for testing`
- Root Directory：`web_admin_app`
- Framework：`Vite`
- Install Command：`npm install`
- Build Command：`npm run build`
- Output Directory：`dist`
- Environment Variables：None / 未設定

## 3. 已部署範圍

- `web_admin_app/`
- Vite + React + TypeScript 前端
- A14 UI / UX 測試版
- 角色切換
- 側欄預設隱藏 / 展開
- 模組主頁搜尋 / 狀態篩選 / 列表
- 每筆資料同列查看詳情
- 新增流程
- 詳情編輯流程
- 儲存 / 送出 / 停用 / 封存確認 dialog
- 停用 / 封存保留紀錄概念

## 4. 未部署 / 未串接範圍

- 未串 Render API
- 未串 PostgreSQL
- 未串 LINE Bot
- 未串 Google Sheets
- 未串 AppSheet
- 未建立正式登入
- 未建立正式權限
- 未寫入任何正式資料
- 未修改 V1 runtime

## 5. 第三方測試重點

- 手機與桌機版是否好操作
- 左側選單隱藏 / 展開是否清楚
- 角色切換是否容易理解
- 非管理者是否看不到管理者設定
- 檢視者是否看不到新增 / 編輯 / 停用 / 封存 CTA
- 搜尋與列表是否清楚
- 每筆資料的查看詳情位置是否合理
- 新增流程是否清楚
- 編輯流程是否清楚
- 確認 dialog 是否足夠防呆
- 停用 / 封存文字是否容易理解
- 廟方年長使用者是否看得懂

## 6. 測試回饋格式

```text
測試者：
使用裝置：
測試角色：
測試頁面：
發現問題：
建議修改：
是否影響使用：
截圖：
```
