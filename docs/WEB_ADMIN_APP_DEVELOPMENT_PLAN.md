# 0.8.0A-10 Web 後台前端開發計畫

本文件規劃未來正式 Web 後台前端 `web_admin_app/` 的開發方向。本輪只做文件，不建立資料夾、不寫程式、不部署。

## 1. 文件目的

本文件用來銜接目前 `web_admin_mvp/` prototype 與未來正式 Web 後台前端，避免直接把 prototype 改成正式系統。

## 2. `web_admin_mvp/` 的保留角色

`web_admin_mvp/` 保留作為：

- UX prototype。
- 操作流程參考。
- 模組討論參考。
- 第三方測試與截圖回饋工具。

它不直接硬接正式資料庫，也不承擔正式權限、正式 API、正式登入或正式資料寫入。

## 3. 未來 `web_admin_app/` 的正式角色

未來 `web_admin_app/` 建議作為：

- 正式 Web 後台前端。
- Vercel 部署目標。
- Vite / React / TypeScript 專案。
- 呼叫 Render FastAPI 的操作介面。
- 廟方人員日常操作入口。

本輪不建立 `web_admin_app/`。

`0.8.0A-11` 補充：正式建立 `web_admin_app/` 前，先以 `docs/WEB_ADMIN_APP_SKELETON_SETUP_PLAN.md` 固定 skeleton 建立範圍。

`0.8.0A-12R` 補充：A12 的 Next.js skeleton 嘗試在 Windows 本機 build 驗證中受 Next.js / webpack / EISDIR readlink 問題阻塞，尚未形成可提交前端成果。MVP 前端技術方向調整為 Vite + React + TypeScript；A13 才處理 skeleton 替換。

## 4. 為什麼不要直接把 prototype 改成正式系統

`web_admin_mvp/` 已適合作為流程討論，但不適合作為正式前端基礎，原因：

- 目前使用靜態 mock data。
- 沒有正式登入與權限。
- 沒有 API contract。
- 沒有正式錯誤處理。
- 沒有資料驗證與送出流程。
- 沒有部署與環境設定。

正式前端應另開乾淨架構，吸收 prototype 的 UX 決策，而不是直接接正式資料。

## 5. 建議前端技術

```text
Vite
React
TypeScript
Vercel
```

前端不直接連資料庫。所有資料都透過 Render FastAPI API 存取。

## 6. V2 主模組

已確認的 V2 主模組：

```text
主控台
廟務管理
善信管理
友宮管理
來訪 / 請帖
公告 / 活動
採購管理
公文 / 通知
團隊管理
帳務管理
管理者設定
未來 LINE Bot 整合
```

## 7. 模組邊界

```text
善信管理 = 管人
廟務管理 = 管事
帳務管理 = 管錢
採購管理 = 廟務管理的重要子功能
公文 / 通知 = 文件紀錄，不等於公告 / 活動
公告 / 活動 = 發布內容或活動資料
LINE Bot = 未來整合入口，不再綁定現有 Google Sheets V1
```

## 8. 初期畫面優先順序

建議初期先做：

1. 登入後主控台骨架。
2. 側邊 / 手機導覽骨架。
3. 模組入口。
4. 權限顯示規則草案。
5. 一至兩個代表模組的列表 / 詳情頁樣板。
6. API contract 或 mock API。

暫不處理完整 CRUD。

## 9. 第一個可開發 milestone

```text
Milestone 1：Web Admin Foundation
- 登入後主控台骨架
- 側邊 / 手機導覽骨架
- 模組入口
- 權限顯示規則草案
- 只串 mock API 或規劃 API contract
- 不處理完整 CRUD
```

Milestone 1 的目標是建立正式前端框架與操作邊界，不是一次完成所有模組。

## 10. 模組開發順序建議

初步建議：

1. 主控台與導覽。
2. 權限顯示規則。
3. 友宮管理。
4. 來訪 / 請帖。
5. 公告 / 活動。
6. 團隊管理。
7. 善信管理。
8. 廟務管理。
9. 帳務管理。
10. 採購管理。
11. 公文 / 通知。
12. 管理者設定。
13. 未來 LINE Bot 整合。

實際順序可依廟方 review 與 API readiness 調整。

## 11. 手機與年長使用者友善原則

- 模組入口清楚。
- 文字偏大且對比足夠。
- 左側選單可收合或改為手機導覽。
- 主要 CTA 不重複。
- 表單欄位使用廟方可理解的中文。
- 不用工程術語。
- 錯誤提示要可理解。

## 12. 權限顯示原則

- admin、staff、viewer 是系統權限。
- 廟務職務不是系統權限。
- 無權限功能可顯示鎖定、灰色或隱藏，實際策略需後續決定。
- 前端只做顯示，真正權限需由後端 API 驗證。

## 13. 全站 UX 原則

```text
列表 / 搜尋
→ 查看詳情
→ 詳情頁內編輯 / 停用 / 管理關聯資料
```

原則：

- 列表頁負責瀏覽、搜尋、篩選與查看詳情。
- 詳情頁才提供編輯、停用、刪除與管理關聯資料。
- 新增 CTA 僅保留在明確少數位置，通常在模組頁右上。
- 不在列表與卡片中重複出現相同新增 CTA。
- 管理者設定集中放系統參數、權限、LINE 維運與資料來源。
- 不在列表頁直接大量編輯 / 刪除。

## 14. 未來與 API 串接節奏

建議節奏：

1. 先建立畫面骨架與 route。
2. 定義 API contract。
3. 使用 mock API 開發前端流程。
4. 後端完成對應 route、service、repository。
5. 串接 PostgreSQL。
6. 加上權限與 audit log。
7. 再規劃 LINE Bot 轉接。

## 15. 本輪不做

- 不建立 `web_admin_app/`。
- 不修改 `web_admin_mvp/`。
- 不建立正式 Vite 專案。
- 不新增 package。
- 不部署 Vercel。
- 不接 Render API。
- 不接 PostgreSQL。
- 不 commit。

## 16. A13 更新

`0.8.0A-13` 已建立新的 `web_admin_app/`，作為 Vite + React + TypeScript Visual MVP Baseline。此版本包含可視化主控台、主要模組列表頁、詳情頁、管理者設定、mock data 與 mock permission。

A13 仍未串 Render API、未部署、未建立 PostgreSQL，且未修改 `web_admin_mvp/`、Render、LINE Bot、Google Sheets 或 AppSheet。

下一步建議：`0.8.0A-14 Visual MVP Review and UX Adjustment`。
