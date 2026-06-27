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
- `0.8.0A-8` Temple Affairs / Procurement / Document Architecture Review 進行中：只文件化廟務管理、採購、公文 / 通知與帳務科目邊界，不修改 prototype、runtime 或正式資料。
- `0.8.0A-9` V1 Freeze and Web Admin + Future LINE Bot Transition Decision 進行中：V1 = Google Sheets + Render FastAPI + LINE Bot 保留但凍結；Web 後台 V2 不再以現有 Google Sheets 作為設計前提，正式進入後台架構與開發階段。
- `0.8.0A-10` Vercel Frontend + Render Backend Web Admin Architecture Roadmap 進行中：只文件化 Vercel + Render + Render PostgreSQL + 未來 LINE Bot 整合方向；本輪未建立正式前端、未修改 prototype、未修改 Render、未部署。
- `0.8.0A-11` Web Admin App Skeleton Planning 進行中：只文件化未來 `web_admin_app/` skeleton 建立前計畫；本輪未建立 `web_admin_app/`、未安裝套件、未修改 prototype、未部署。
- `0.8.0A-12` Create Web Admin App Skeleton 嘗試中止於 build 驗證：Next.js / React / TypeScript skeleton 在 Windows 本機環境下持續遇到 Next.js / webpack / EISDIR readlink 問題，尚未 commit、尚未 push、尚未部署。
- `0.8.0A-12R` Frontend MVP Architecture Adjustment Decision 進行中：MVP 前端技術方向調整為 Vite + React + TypeScript；Vercel + Render 架構不變，Render FastAPI / PostgreSQL / LINE Bot 未來整合方向不變。
- `0.8.0A-13` Build Vite React Web Admin Visual MVP Baseline 進行中：已重新建立 `web_admin_app/` 作為 Vite + React + TypeScript 前端 baseline，包含可視化主控台、主要模組列表 / 詳情頁、管理者設定、mock data 與 mock permission；目前未串 API、未部署、未修改 V1。
- `0.8.0A-14` Visual MVP Review and UX Adjustment 進行中：依 A13R review 修正手機導覽、角色權限展示、詳情頁操作確認、主控台重要待辦與各模組專屬列表 / 詳情欄位；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix1` Role-based UI and CTA Behavior Adjustment 進行中：依人工檢查修正管理者 / 廟方人員 / 檢視者導覽差異、檢視者詳情頁不顯示操作按鈕、CTA 點擊後顯示前端狀態提示；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix2` Permission Notice Placement and CTA Feedback Adjustment 進行中：查看權限提示改為低干擾提示列，CTA 點擊後加入編輯檢視、草稿暫存、送出確認與停用 / 作廢確認流程；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix3` Editable Field Interaction Adjustment 進行中：編輯模式已加入文字、textarea、日期、數字、下拉選單與多選標籤；取消可回復原資料，草稿 / 送出確認保留前端暫存內容；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix4` Add New Record CTA Interaction 進行中：所有模組列表頁新增 CTA 已接上前端新增表單流程，支援草稿、送出確認與取消新增；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix5` List Search Add/Edit Flow and Archive Confirmation Adjustment 進行中：模組主頁已調整為搜尋、狀態篩選與列表；新增流程移至獨立 `/new` 頁面；儲存、送出、停用 / 封存前加入確認小框框；一般前端不提供刪除；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix6` Sidebar Hide Toggle and List Flow Cleanup 進行中：左側選單已可隱藏 / 展開；角色顯示與角色切換統一移至右上方；非管理者大型權限提示改為低干擾提示；列表每筆資料同列顯示「查看詳情」；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix7` Non-admin Settings Guard and Row Detail Button Alignment 進行中：非管理者不可看到或進入管理者設定內容，直接進入 settings 只顯示簡短提示與返回主控台；列表資料列已調整為狀態、主資訊、欄位與「查看詳情」同列呈現；仍未串 API、未部署、未修改 V1。
- `0.8.0A-14-Fix8` Default Hidden Sidebar and Header Module Summary Consolidation 進行中：左側選單預設隱藏，模組名稱 / 邊界 / 說明 / 新增 CTA 已整合到上方主標題區，原獨立模組標題大卡片已移除；搜尋與列表上移；仍未串 API、未部署、未修改 V1。
- `0.8.0A-15` Record Vercel Preview Deployment 進行中：Vercel 前端測試部署已完成，project 為 `zhongyuan-fude-web-admin-test`，測試網址為 `https://zhongyuan-fude-web-admin-test.vercel.app`，部署 commit 為 `7b37733`。目前可進入第三方 UI / UX 測試；正式 V1 / Render / LINE Bot / Google Sheets / AppSheet 未修改。
- `0.8.0A-16` Web Admin Database-backed MVP Transition 進行中：第三方測試回饋指出純前端缺乏實際新增、查詢、編輯、封存的臨場感，因此決策進入 database-backed MVP。A16 先建立 Web Admin API + Render PostgreSQL staging + 前端 API 串接規劃，暫不接 LINE Bot；V1 Google Sheets / LINE Bot / AppSheet 仍凍結不動。
- `0.8.0A-17` Web Admin API Local CRUD Baseline 進行中：`web_admin_api/` 進入本機 CRUD baseline，支援 SQLite local fallback、records 新增 / 查詢 / 詳情 / 編輯 / 封存 / 還原與 audit events；本輪不修改前端、不部署，LINE Bot / V1 / Google Sheets / AppSheet 仍不動。

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
- 廟務管理架構原則：善信管理管人，廟務管理管事，帳務管理管錢；採購歸廟務管理但支出關聯帳務；公文 / 通知先歸廟務管理，且不等於公告 / 活動。
- V1 freeze 決策：現有 Google Sheets + Render FastAPI + LINE Bot V1 保留作為既有成果、內部測試參考與必要備查；除非既有功能故障，否則不再開發、不再擴充、不再追隨 Web 後台 V2 prototype 變動。
- V2 後續方向：Web 後台 V2 不再以現有 Google Sheets 作為資料核心或設計限制，正式進入後台架構與開發階段；後續以正確廟務流程、資料模型、權限、安全、API 與未來 LINE Bot 整合為主。
- LINE Bot 未來定位：LINE Bot 不取消；現有 LINE Bot 暫不調整，未來應在 V2 核心資料模型、權限與 API 邊界穩定後，再規劃轉接 Web 後台 / API / 新資料核心。
- A10 技術架構規劃：正式方向為 Vercel Web 後台前端、Render FastAPI 後端 API、Render PostgreSQL V2 資料核心；`web_admin_mvp/` 只保留為 UX prototype，未來正式前端建議另開 `web_admin_app/`，但本輪未建立。
- A11 skeleton 規劃：未來可進入 `0.8.0A-12 Create Web Admin App Skeleton`，最小範圍只建立 `web_admin_app/`、Next.js / TypeScript skeleton、基本 layout、dashboard placeholder、模組入口、mock permission 與 README；不串 API、不部署、不碰 V1。
- A12 Next.js skeleton 狀態：`web_admin_app/` 曾建立未提交 skeleton，但 build 未通過，不視為可提交前端成果；A12R 決定 MVP 前端改採 Vite + React + TypeScript，A13 才處理 skeleton 替換。

## Pause point

- 目前暫停在 `0.8.0A-7 Preview UI Residue Cleanup` 已完成並推送後。
- 最新狀態標記 commit：`cc5b867 docs: mark preview residue cleanup complete`。
- 下一次繼續前，請先確認工作區是否乾淨，再依使用者最新指示決定是否進入第三方 ZIP 預覽包打包 / 檢查。
- 未獲正式明確指令前，仍限制在 `web_admin_mvp/` 與 `docs/`，不要接 Google Sheets、FastAPI runtime 或 Render。
- A10 目前只完成文件規劃；不要誤認為已建立 `web_admin_app/`、已啟用 PostgreSQL、已部署 Vercel 或已改 LINE Bot。
- A11 目前只完成 skeleton setup 文件規劃；不要誤認為已建立 `web_admin_app/` 或已安裝 Next.js package。
- A13 建議改為 `0.8.0A-13 Replace Next.js Skeleton with Vite React Skeleton`：清理未提交 Next.js skeleton，保留 `web_admin_app/` 作為正式前端資料夾，建立 Vite + React + TypeScript skeleton，並要求 lint / build 通過；不串 API、不部署、不碰 V1。
- A13 目前已建立 Vite + React + TypeScript Visual MVP Baseline；`web_admin_mvp/` 仍保留為 UX prototype。下一步建議 `0.8.0A-14 Visual MVP Review and UX Adjustment`，先 review 畫面、UX 與資訊密度，再討論 API contract。
- 不要修改正式 Google Sheets、Render、LINE Developers Webhook、正式 LINE Bot runtime、`.env`、`.env.local` 或 secret。
- 不要部署。

## Next optional steps

```text
0.7.8：AppSheet 公告管理畫面規劃
0.7.9：廟方資料維護流程簡化
0.8.0：LINE 發布公告 / 主動推播規劃
```
