# 0.8.0A-12R Frontend MVP Architecture Adjustment Decision

本文件記錄 `0.8.0A-12R` 的前端 MVP 技術調整決策。本輪只做文件修訂與決策紀錄，不修改程式碼、不部署、不 commit、不 push。

## 1. 文件目的

本文件用來正式記錄 Web 後台 MVP 前端技術選型調整：

```text
MVP Web 後台前端不再採 Next.js。
MVP Web 後台前端改採 Vite + React + TypeScript。
```

這是前端 skeleton 技術選型調整，不是整體架構重選。

## 2. 背景

A10 已文件化 Vercel + Render 架構。

A11 已規劃 `web_admin_app/` skeleton。

A12 嘗試以 Next.js / React / TypeScript 建立 skeleton，但在 Windows 本機環境下，Next.js build 持續因 webpack / readlink / EISDIR 問題阻塞。

已知狀態：

- `npm run lint` 曾通過。
- `npm run build` 未通過。
- Next.js skeleton 尚未 commit。
- Next.js skeleton 尚未 push。
- Next.js skeleton 尚未部署。

不得寫成 Next.js 已完成，也不得寫成正式前端已完成。

## 3. 決策

正式決策：

```text
MVP 前端改採 Vite + React + TypeScript。
不再以 Next.js 作為 MVP skeleton 技術基礎。
```

Vite skeleton 尚未建立。A13 才會處理 skeleton 替換。

## 4. 保留不變的架構

以下架構不變：

- Vercel：前端部署。
- Render：FastAPI 後端 API。
- Render PostgreSQL：未來 V2 資料核心。
- Render FastAPI：未來 LINE Bot webhook / API 整合。
- Google Sheets V1：凍結保留。
- `web_admin_mvp/`：保留為 UX prototype。

Vercel + Render 架構仍然成立。

Render FastAPI / PostgreSQL / LINE Bot 未來整合方向不變。

## 5. 為什麼改用 Vite

MVP 後台目前不需要：

- SSR。
- Server Components。
- App Router。

Vite + React 足以支援：

- 登入後後台。
- 模組入口。
- 列表。
- 詳情。
- 表單。
- API 串接。
- 權限顯示。

調整理由：

- Vite build 較輕，適合先完成 MVP。
- 降低 Windows 本機 build 工具鏈風險。
- 降低未來維護複雜度。
- 仍可部署到 Vercel。
- 仍可呼叫 Render FastAPI。

## 6. 對未來開發的影響

此決策會影響：

- 前端路由。
- 專案結構。
- skeleton 建立方式。
- local build 工具鏈。

此決策不影響：

- Render API。
- PostgreSQL 資料模型。
- LINE Bot 未來整合。
- V1 凍結策略。
- Vercel 作為前端部署平台。

未來不使用 Next.js App Router。前端可使用 React Router 或等效前端路由方案。

## 7. 與 PHP / Python 重構的關係

本次不是決定永遠不能改 PHP / Python。

本次目標是先完成可驗證、可交接、可重構的 MVP。

MVP 完成後，可依維護人力與廟方實際使用情況，再評估是否重構為：

- PHP / Laravel。
- Python / Django。
- FastAPI templates。
- 或保留 Vite + FastAPI。

未來若重構，應以資料模型、API contract、權限規則與 UX 流程為依據，分階段處理。不建議一次性整套砍掉重寫。

## 8. 下一階段建議

下一階段建議：

```text
0.8.0A-13 Replace Next.js Skeleton with Vite React Skeleton
```

A13 建議範圍：

```text
清理未提交的 Next.js skeleton
建立 Vite + React + TypeScript skeleton
保留 web_admin_app/ 作為正式前端資料夾
建立 dashboard placeholder
建立模組入口 placeholder
建立 mock permission
建立 README
npm run lint / npm run build 必須通過
不串 API
不部署
不碰 V1
```

## 9. 本輪不做事項

本輪不做：

- 不修改程式碼。
- 不建立 Vite skeleton。
- 不刪除 Next.js skeleton。
- 不部署。
- 不 commit。
- 不 push。
- 不修改 Render。
- 不修改 LINE Bot。
- 不修改 Google Sheets。
- 不修改 `web_admin_mvp/`。
