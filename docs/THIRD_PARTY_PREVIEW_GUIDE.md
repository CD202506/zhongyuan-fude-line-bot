# Third-party Preview Guide

本文件給專案維護者使用，用來準備第三方 UX 預覽包。

## 定位

`web_admin_mvp/` 是桃園中原福德宮 Web 後台預覽版，只用於畫面流程、操作邏輯與第三方 UX 回饋。

這不是正式部署，不取代 Vercel、Render 或正式 LINE Bot。

## 打包方式

只壓縮：

```text
web_admin_mvp/
```

不要包含：

- `.env`
- `.env.local`
- Git 隱藏資料夾
- 正式 Google Sheets 匯出資料
- 正式 LINE Bot 設定
- token、secret、正式 Sheet ID
- 真實個資、電話、帳務資料

## 打包前檢查

在 repo 根目錄執行：

```powershell
python -m unittest discover tests/prototype
node --check web_admin_mvp\app.js
node --check web_admin_mvp\mockData.js
git status --short
```

## 打包內容清單

預覽包至少應包含：

- `web_admin_mvp/index.html`
- `web_admin_mvp/styles.css`
- `web_admin_mvp/app.js`
- `web_admin_mvp/mockData.js`
- `web_admin_mvp/README.md`
- `web_admin_mvp/README_FOR_TESTERS.md`

## 發送前安全檢查

發送給第三方前，請確認：

- 未包含 `.env` 或 `.env.local`。
- 未包含正式資料來源。
- 未包含 Git 隱藏資料夾。
- 未包含正式 Google Sheets ID、LINE UID、token、secret。
- 未包含真實電話、個資、銀行帳號、帳戶或真實收據號碼。
- 畫面明確標示預覽模式、不連正式表單、不正式發送、不寫入正式資料、資料皆為測試資料。

## 第三方開不起來時

若第三方回報只看到文字版、畫面破版或無法互動，通常是沒有完整解壓縮或用手機檔案 App 預覽。

請提醒對方：

1. 先完整解壓縮整個 `web_admin_mvp/` 資料夾。
2. 確認 `index.html`、`styles.css`、`app.js`、`mockData.js` 在同一資料夾。
3. 用 Chrome / Edge / Safari 開啟 `index.html`。

## 安全邊界

第三方預覽包不得：

- 連正式 Google Sheets。
- 寫入任何 Google Sheets。
- 修改 Render。
- 修改 LINE Developers Webhook。
- 修改正式 LINE Bot runtime。
- 正式發送 LINE / Facebook / VOOM。
- 作為正式營運系統使用。
