# 0.8.0A-11 Web Admin App Skeleton Setup Plan

本文件規劃未來正式前端 `web_admin_app/` 的建立方式。本輪只做文件規劃，不建立資料夾、不安裝套件、不部署。

## 1. 文件目的

本文件用來規劃未來正式 Web 後台前端：

```text
web_admin_app/
```

目標是讓下一階段能小步建立正式前端 skeleton，同時避免影響既有 V1、避免污染 `web_admin_mvp/` prototype。

本輪不建立 `web_admin_app/`、不安裝套件、不部署。

## 2. A10 基準回顧

A10 已確立：

```text
Vercel + Render 架構
web_admin_mvp/ 保留為 UX prototype
未來 web_admin_app/ 才是正式前端
V1 Google Sheets + LINE Bot 凍結保留
Render FastAPI / PostgreSQL 為未來 V2 API 與資料核心方向
```

V1 不再作為 V2 的資料模型限制。LINE Bot 不取消，但未來應待 V2 資料模型、權限與 API 邊界穩定後，再重新整合。

## 3. `web_admin_mvp/` 與 `web_admin_app/` 分工

### `web_admin_mvp/`

- UX prototype。
- 流程參考。
- 模組討論參考。
- 第三方測試參考。
- 不直接硬接正式資料庫。
- 本輪不修改。

### `web_admin_app/`

- 未來正式 Web 後台前端。
- 採 Vite / React / TypeScript。
- 未來部署至 Vercel。
- 呼叫 Render FastAPI API。
- 本輪不建立。

## 4. 建議資料夾位置

未來正式前端建議建立於 repo 根目錄：

```text
web_admin_app/
```

理由：

- 與 `web_admin_mvp/` 平行。
- 避免 prototype 與正式前端混在一起。
- 方便後續獨立部署到 Vercel。
- 方便保留 prototype 作為 UX 對照。
- 方便在同一 repo 中保留 V1 runtime、prototype 與正式前端規劃邊界。

## 5. 建議技術選型

未來正式前端建議：

```text
Vite
React
TypeScript
Vercel
Mobile-first responsive layout
API client layer
Mock data / mock API contract first
```

本輪不做：

- 不建立專案。
- 不安裝套件。
- 不選定所有 UI library。
- 不部署。

UI library 可等 skeleton 建立後，依年長使用者可讀性、表單密度、手機導覽與維護成本再決定。

## 6. 初始 skeleton 建議內容

未來 A12 或後續實作時，第一版 `web_admin_app/` skeleton 可包含：

```text
首頁 / 登入後主控台 placeholder
手機優先導覽骨架
桌面側邊欄骨架
模組入口卡片
權限顯示 placeholder
mock user / mock permission
mock API contract placeholder
基礎 layout
基礎 routes
README
```

第一版 skeleton 不做：

- 不做完整 CRUD。
- 不串 Render API。
- 不碰 LINE Bot。
- 不碰 Google Sheets。
- 不取代 `web_admin_mvp/`。

## 7. 初期頁面路由建議

未來可規劃但本輪不建立：

```text
/
或 /dashboard

/devotees
/temple-affairs
/shrines
/visits
/announcements
/events
/procurements
/documents
/team
/ledger
/settings
```

第一階段可以先有頁面 placeholder，不必完成資料操作。

路由命名可在 A12 前再確認中文模組與英文 route 的對應，避免太早固定 API / URL 命名。

## 8. 初期 UX 原則

沿用已確認的 Web 後台 UX 原則：

- 手機優先。
- 廟方年長使用者友善。
- 高對比。
- 少層級。
- 少文字壓迫。
- 列表 → 詳情 → 詳情內編輯。
- 列表頁不直接編輯 / 刪除。
- 新增 CTA 單一入口。
- 管理者設定集中。
- 非管理者功能灰色或隱藏。
- 重要操作需確認。

正式前端 skeleton 階段應先確保導覽、模組入口與權限顯示清楚，再逐步處理表單細節。

## 9. 初期權限原則

前端 placeholder 權限層級：

```text
admin
staff
viewer
```

本階段只是前端顯示規劃。

正式權限必須由後端 API 驗證。前端隱藏按鈕、灰色狀態或不可點擊狀態，只能作為 UX 提示，不能當作真正安全機制。

## 10. API 串接節奏

建議節奏：

```text
Phase 1：mock data / mock API contract
Phase 2：定義 Render API contract
Phase 3：串接 Render FastAPI dev endpoint
Phase 4：導入正式 auth / permission
Phase 5：逐步替換 mock data
```

A11 不做：

- 不串 API。
- 不修改 Render。
- 不建立 PostgreSQL。

## 11. Vercel 部署邊界

未來 `web_admin_app/` 可獨立部署到 Vercel。

部署邊界：

- Vercel 只負責前端。
- Vercel 不直接連 PostgreSQL。
- 正式資料存取一律經 Render API。
- Vercel env 不應存放後端資料庫直連資訊。

A11 不做：

- 不建立 Vercel 專案。
- 不設定 Vercel env。
- 不部署。

## 12. 第一個實作 milestone 建議

下一階段建議：

```text
0.8.0A-13 Replace Next.js Skeleton with Vite React Skeleton
```

A13 建議只做：

```text
清理未提交的 Next.js skeleton
保留 web_admin_app/ 作為正式前端資料夾
建立 Vite + React + TypeScript skeleton
建立基本 layout
建立 dashboard placeholder
建立模組入口 placeholder
建立 mock permission
建立 README
npm run lint / npm run build 必須通過
不串 API
不部署
不碰 V1
```

A13 應仍維持小步前進，不一次導入完整資料模型、登入、後端 API 或正式部署。

## 12.1 A12 建立後狀態

`0.8.0A-12` 曾嘗試建立 Next.js / React / TypeScript skeleton，但 build 未通過：

- Windows 本機環境下持續遇到 Next.js / webpack / EISDIR readlink 問題。
- `npm run lint` 曾通過。
- `npm run build` 未通過。
- 尚未 commit。
- 尚未 push。
- 尚未部署。

`0.8.0A-12R` 決定：MVP 前端改採 Vite + React + TypeScript。Vite skeleton 尚未建立，A13 才會處理。

## 13. 風險與防護

### 風險 1：一開始就把 prototype 硬改成正式系統

防護：`web_admin_mvp/` 與 `web_admin_app/` 分離。

### 風險 2：一開始就串正式 Render / PostgreSQL

防護：先 mock API contract。

### 風險 3：V1 LINE Bot 被提前改壞

防護：V1 route 與 V2 API 分離，A11 / A12 不碰 V1。

### 風險 4：前端權限誤當安全機制

防護：前端只做 UX，正式權限由後端驗證。

### 風險 5：過早部署造成廟方誤用

防護：正式開放前標示開發 / 測試狀態。

## 14. 本輪不做事項

```text
不建立 web_admin_app/
不建立 Vite skeleton
不安裝 package
不修改 prototype
不修改 Render
不修改 LINE Bot
不修改 Google Sheets
不部署
不 commit
不 push
```
# A13 status update

`0.8.0A-13` 已依 A12R 決策建立 `web_admin_app/`，不再使用 Next.js skeleton。新的 baseline 採 Vite + React + TypeScript，並加入可視化 dashboard、模組入口、列表 / 詳情頁、管理者設定、mock user / mock permission 與 mock data。

本階段未串 API、未部署、未建立 `.env`，也未修改 V1 Google Sheets / LINE Bot。`web_admin_mvp/` 仍只作 UX prototype。

下一步建議：`0.8.0A-14 Visual MVP Review and UX Adjustment`。
