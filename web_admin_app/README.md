# 中原福德宮 Web 後台 A13 Visual MVP Baseline

## 專案定位

`web_admin_app/` 是中原福德宮 Web 後台 V2 的正式前端技術基礎。A13 版本用來建立可視化 UI / UX baseline，作為後續 A14 review、API contract 與正式串接前的討論基準。

本版不是正式上線版。

## A13 Visual MVP Baseline

本版已建立：

- Vite + React + TypeScript 前端。
- React Router 前端路由。
- 主控台、主要模組列表頁、詳情頁、管理者設定頁。
- mock user / mock permission。
- mock data。
- 手機優先、高對比、少層級、卡片式資訊呈現。

## 為什麼採 Vite + React + TypeScript

A12R 已決定 MVP 前端改採 Vite + React + TypeScript，避免繼續使用 Next.js skeleton。未來部署方向仍可朝 Vercel，後端仍規劃 Render FastAPI，資料庫方向為 Render PostgreSQL。

## 與 `web_admin_mvp/` 的差異

`web_admin_mvp/` 保留為 UX prototype、流程參考、模組討論參考與第三方測試參考。

`web_admin_app/` 是重新建立的正式前端 baseline，不直接複製 prototype 程式碼，也不修改 `web_admin_mvp/`。

## 目前資料狀態

- 目前只使用前端 mock data。
- 目前不串 Render API。
- 目前不建立 PostgreSQL。
- 目前不部署。
- 目前不碰 V1 Google Sheets / LINE Bot。
- 目前不建立 `.env`。

畫面中的新增、編輯、停用、作廢與管理按鈕都是 placeholder，不會寫入資料庫。

## 本機啟動

```powershell
cd web_admin_app
npm install
npm run dev
```

## Build

```powershell
cd web_admin_app
npm run lint
npm run build
```

## Mock Permission

目前 mock role 包含：

- `admin`
- `staff`
- `viewer`

目前只是前端顯示 placeholder。正式權限必須由 Render API 後端驗證。前端隱藏或灰色按鈕不能當作真正安全機制。

## 路由

目前使用 HashRouter，方便本機開發與重新整理測試，不需要後端 fallback。

主要路由：

- `/dashboard`
- `/devotees`
- `/devotees/:id`
- `/temple-affairs`
- `/temple-affairs/:id`
- `/shrines`
- `/shrines/:id`
- `/visits`
- `/visits/:id`
- `/announcements`
- `/announcements/:id`
- `/events`
- `/events/:id`
- `/procurements`
- `/procurements/:id`
- `/documents`
- `/documents/:id`
- `/team`
- `/team/:id`
- `/ledger`
- `/ledger/:id`
- `/settings`

## 後續 A14 建議

建議下一步進入：

```text
0.8.0A-14 Visual MVP Review and UX Adjustment
```

A14 可先做畫面 review、手機截圖、模組命名修正、資訊密度調整，再進入 API contract 或 mock API 層。
