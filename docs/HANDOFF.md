# Handoff

## 目前正式狀態

- 目前正式資料來源：`中原福德宮_AppSheet_0612`
- Render：`GOOGLE_SHEET_ID` 已正式指向 V1
- AppSheet：`中原福德宮_AppSheet` 已接 V1，基本檢查通過
- V2 暫存表：保留備份 / 測試，不再作正式來源
- V1_LINE_TEST：保留測試，不刪除
- LINE 官方帳號預設自動回覆：已關閉
- Runtime version：`0.6.0`

## 目前可用 LINE 指令

```text
說明
白沙屯
查友宮 白沙屯
查廟 白沙屯
查來訪 集慶福德廟
查來訪 大有福德宮
請帖 大有
活動公告
查紀錄
查記錄
最近記錄
查無資料
補資料建議
```

## 目前不要做

- 不要刪 V2 暫存表
- 不要刪 V1_LINE_TEST
- 不要清空 `line_query_logs`
- 不要讓前端伙伴修改 tab / 欄位
- 不要把 AppSheet 改接 V2
- 不要更換 Render `GOOGLE_SHEET_ID`，除非有明確 rollback 需求
- 不要手動改 Service Account JSON

## 確認系統正常

1. 開啟 `/health`，確認 `status=ok`。
2. LINE 輸入「白沙屯」，確認收到友宮資料。
3. LINE 輸入「查來訪 集慶福德廟」，確認可查來訪或請帖。
4. LINE 輸入「活動公告」，確認可查公告。
5. LINE 輸入「白沙屯測試」，確認回查無資料。
6. LINE 輸入「查紀錄」與「查記錄」，確認內部查詢紀錄可讀。
7. 檢查正式 V1 的 `line_query_logs` 有新增紀錄。

## 主要檔案

| 檔案 | 用途 |
| --- | --- |
| `main.py` | FastAPI routes 與 LINE webhook 流程 |
| `config.py` | 版本與環境設定 |
| `command_router.py` | LINE 文字指令分流 |
| `line_client.py` | 呼叫 LINE Reply API |
| `sheets_client.py` | Google Sheets 讀寫與 TTL cache |
| `permission_service.py` | members 查找與內部權限判斷 |
| `shrine_search_service.py` | shrines 搜尋 |
| `shrine_visit_service.py` | 友宮來訪 / 請帖查詢 |
| `announcement_service.py` | 公告被動查詢 |
| `query_log_lookup_service.py` | 內部查詢紀錄與補資料建議 |
| `reply_builder.py` | LINE 純文字回覆組合 |
| `log_service.py` | `line_query_logs` 寫入 |

## 下一步建議

- 目前先暫停，等待使用者通知再繼續。
- Web 後台 prototype 已完成至 `0.8.0A-7 Preview UI Residue Cleanup`，並已推送。
- 最新狀態標記：`cc5b867 docs: mark preview residue cleanup complete`。
- `0.8.0A-9` 最新決策：V1 = Google Sheets + Render FastAPI + LINE Bot 保留但凍結；V1 不再新增功能、不再擴充 Google Sheets、不再追隨 Web 後台 V2 prototype 變動。
- Web 後台 V2 不再以現有 Google Sheets 作為資料核心或設計限制，後續以正確廟務流程、資料模型、權限、安全、API 與未來 LINE Bot 整合為主。
- LINE Bot 不取消；現有 LINE Bot 暫不調整，未來待 V2 核心資料模型、權限與 API 邊界穩定後，再規劃轉接 Web 後台 / API / 新資料核心。
- `0.8.0A-10` 最新規劃：正式技術方向為 Vercel 前端 + Render FastAPI 後端 + Render PostgreSQL；本輪只新增技術路線圖與開發計畫文件，未建立 `web_admin_app/`，未修改 `web_admin_mvp/`，未修改 Render 或 LINE Bot。
- `0.8.0A-11` 最新規劃：新增 `docs/WEB_ADMIN_APP_SKELETON_SETUP_PLAN.md`，只規劃未來正式前端 skeleton；A11 未建立 `web_admin_app/`、未建立 Next.js 專案、未安裝 package、未部署。
- 下一階段可考慮 `0.8.0A-12 Create Web Admin App Skeleton`：只建立正式前端 skeleton、基本 layout、dashboard placeholder、模組入口、mock permission 與 README；不串 API、不部署、不碰 V1。
- `0.8.0A-12` Next.js skeleton 嘗試未通過 build；在 Windows 本機環境下持續遇到 Next.js / webpack / EISDIR readlink 問題，尚未 commit、尚未 push、尚未部署。
- `0.8.0A-12R` 最新決策：MVP 前端不再採 Next.js，改採 Vite + React + TypeScript。這是前端 skeleton 技術選型調整，不是整體架構重選；Vercel + Render 架構、Render FastAPI / PostgreSQL / LINE Bot 未來整合方向不變。
- 下一步建議：`0.8.0A-13 Replace Next.js Skeleton with Vite React Skeleton`，清理未提交 Next.js skeleton，建立 Vite + React + TypeScript skeleton，要求 lint / build 通過；不串 API、不部署、不碰 V1。
- 恢復前先確認工作區狀態；未獲明確指令前，開發範圍限制在 `web_admin_mvp/` 與 `docs/`。
- 不要修改正式 Google Sheets、Render、LINE Developers Webhook、正式 LINE Bot runtime、`.env`、`.env.local` 或 secret。
- 不要部署。

- `0.7.8`：AppSheet 公告管理畫面規劃
- `0.7.9`：廟方資料維護流程簡化
- `0.8.0`：LINE 發布公告 / 主動推播規劃

## 交付文件

- [目前專案狀態](CURRENT_PROJECT_STATUS.md)
- [試營運前檢查清單](PRE_LAUNCH_CHECKLIST.md)
- [AppSheet 使用者簡易守則](APP_SHEET_USER_GUIDE.md)
- [回復與維護](ROLLBACK_AND_MAINTENANCE.md)
# 0.8.0A-13 handoff update

- `web_admin_app/` 已重新建立為 Vite + React + TypeScript Visual MVP Baseline。
- `web_admin_mvp/` 仍保留為 UX prototype、流程參考與第三方測試參考，本輪未修改。
- A13 前端目前只使用 mock data / mock permission，未串 Render API，未建立 PostgreSQL，未部署。
- 本輪未修改 Render、LINE Bot、Google Sheets、AppSheet 或 `.env`。
- 下一步建議：`0.8.0A-14 Visual MVP Review and UX Adjustment`。

# 0.8.0A-14 handoff update

- `web_admin_app/` 已進行第一輪 Visual MVP UX adjustment。
- 重點包含：手機分組導覽、角色切換、staff / viewer 不可操作狀態、詳情頁操作確認、主控台重要待辦、各模組專屬列表 / 詳情欄位。
- 本輪未修改 `web_admin_mvp/`，未修改 Render / LINE Bot / Google Sheets / AppSheet，未串 API，未部署。
- 詳細紀錄見 `docs/WEB_ADMIN_A14_VISUAL_UX_ADJUSTMENT_NOTES.md`。

# 0.8.0A-14-Fix1 handoff update

- 已修正角色導覽：只有管理者顯示「管理者設定」入口。
- 已修正詳情頁操作：檢視者只看到查看權限提示，不顯示操作確認按鈕；廟方人員高風險操作顯示需管理者確認。
- 已加入 CTA 前端提示：編輯、儲存草稿、送出確認、停用 / 作廢點擊後會顯示狀態訊息。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix2 handoff update

- 已將檢視者「查看權限」提示改為資料摘要上方的低干擾提示列，不再顯示右側操作卡片。

# 0.8.0A-19 handoff update

- A19 進入 Render Web Admin API 部署前準備。
- 本輪準備新的 `zhongyuan-fude-web-admin-api` service 草案，不修改既有 LINE Bot service。
- `web_admin_api/` 保留本機 SQLite fallback，新增 migration runner 草案供未來 PostgreSQL staging 使用。
- PostgreSQL staging 尚未建立，Render 尚未部署，Vercel 尚未改 env。
- V1 / Google Sheets / AppSheet / LINE Bot 仍凍結不動。

# 0.8.0A-20 handoff update

- A20 進入 PostgreSQL runtime CRUD support。
- `web_admin_api/` 已新增 repository 層，SQLite fallback 保留，PostgreSQL records / audit CRUD runtime code 已加入。
- PostgreSQL staging 尚未建立，實際 PostgreSQL 連線驗證留到 A21。
- Render 尚未部署，Vercel 尚未改 env，V1 / Google Sheets / AppSheet / LINE Bot 仍不動。

# 0.8.0A-22 handoff update

- 新的 Render Web Admin API service 已部署完成：`zhongyuan-fude-web-admin-api`。
- API URL：`https://zhongyuan-fude-web-admin-api.onrender.com`。
- `/api/health` 與 `/api/modules` 已測試成功，Render API 已可使用 PostgreSQL staging。
- Vercel 前端測試站尚未切 API mode；下一步是 A23：將前端測試站指向 Render Web Admin API。
- 本階段暫停，等待使用者通知後再繼續；既有 LINE Bot / Google Sheets / AppSheet / V1 runtime 未修改。

# 0.8.0A-23 handoff update

- A23 Vercel API mode deployment 已完成並經使用者確認 OK。
- 固定測試網址：`https://zhongyuan-fude-web-admin-test.vercel.app`。
- 前端已呼叫 Render Web Admin API：`https://zhongyuan-fude-web-admin-api.onrender.com`。
- PostgreSQL staging 已作為 Web Admin 測試資料庫；production browser submit、CRUD、封存與還原流程均已通過。
- Render CORS 已放行 Vercel production origin，OPTIONS preflight 已通過。
- 新增自動 smoke test 腳本：`web_admin_app/scripts/a23_remote_api_smoke_test.js`、`web_admin_app/scripts/a23_production_browser_submit_test.js`。
- 既有 LINE Bot / Google Sheets / AppSheet / V1 runtime 未修改。
- 下一階段建議進入 A24：針對第三方實測與廟方試用前的資料模型、權限與操作流程做整理，不急著接 LINE Bot。

# 0.8.0A-24 handoff update

- 依第三方測試回饋重整 Web 後台 IA、左側選單與使用者可見文字。
- 角色顯示改為管理者、廟方人員、善信；原「檢視者」不再出現在畫面文字中。
- 左側選單移除「廟務文件」分類：採購管理歸日常作業，公文 / 通知歸對外發布。
- 管理者設定中的權限語意改為先選團隊成員，再授予初審、覆核、核准等模組權限標記；本階段不強制卡關。
- 本輪未修改 Web Admin API、DB schema、Render / Vercel env、LINE Bot、Google Sheets、AppSheet 或 V1 runtime。

# 0.8.0A-26 handoff update

- A23～A26 已完成，最新 commit：`44a7ee3 feat: add identity-aware access preparation`。
- 固定 Web Admin 測試網址：`https://zhongyuan-fude-web-admin-test.vercel.app`。
- Render Web Admin API：`https://zhongyuan-fude-web-admin-api.onrender.com`。
- PostgreSQL staging 目前作為 Web Admin 測試資料庫；新增、查詢、詳情、編輯、封存與還原已通過 production 測試。
- A24 已依第三方回饋重整角色、左側選單、Dashboard、UX / IA；角色語意為管理者、廟方人員、善信。
- A25 已修正欄位語意、流程文字、封存 / 作廢語意、工程測試資料顯示與 sidebar RWD。
- A26 已將右上角角色切換改為「測試角色切換」，並建立前端 identity-aware mock model，預留團隊成員、善信、LINE 綁定、模組權限與初審 / 覆核 / 核准標記。
- LINE 綁定目前只做前端示意；尚未做真實登入、LINE Login、LIFF 或 OAuth，未接正式 LINE Bot。
- 自動驗證腳本：`web_admin_app/scripts/a23_remote_api_smoke_test.js`、`web_admin_app/scripts/a23_production_browser_submit_test.js`、`web_admin_app/scripts/a24_role_ux_audit.js`、`web_admin_app/scripts/a25_field_workflow_audit.js`、`web_admin_app/scripts/a25_display_layout_audit.js`、`web_admin_app/scripts/a26_identity_access_audit.js`。
- 已確認未修改：既有 LINE Bot runtime / webhook、Google Sheets、AppSheet、DB schema、Render / Vercel env；未新增 DELETE，未放正式個資或真實 LINE userId。
- 暫停點：使用者要求補齊文件後先暫停，等待後續通知再進入 A27。
- A27 建議方向：LINE 帳號綁定流程設計與測試環境串接評估。開始前需先確認採 LINE Login、LIFF 或既有 LINE Bot userId 綁定；是否新增 users / identities / line_bindings / permissions schema；是否建立 staging 專用 LINE channel 或避免動正式 LINE Bot；是否先整理匿名 / 準正式測試資料。

# 0.8.0A-26.5 handoff update

- A26.5 已完成並推送，最新 commit：`2271be2 feat: refine web admin domain field model`。
- 本階段將 Web Admin 前端語意收斂為資料主檔、內部作業、內容發布、權限治理。
- 新增 `web_admin_app/src/lib/domainModel.ts`，集中定義 module domain type、類別、標籤、承辦人員、發布管道、可見對象與狀態語意。
- 資料主檔已避免濫用內部作業欄位：團隊管理、善信管理、友宮管理不再像任務單。
- 內容發布已從公告 / 活動個別 CRUD 語意，整理為來源資料、發布類別、發布管道、可見對象、公開內容與內部備註。
- 管理者設定已補強類別管理、標籤管理、承辦與權限、發布管道管理、可見權限。
- 新增 `web_admin_app/scripts/a265_domain_model_audit.js`，並維持 A23～A26 既有 smoke test / audit 通過。
- 本階段未修改 Web Admin API、DB schema、Render / Vercel env、LINE Bot runtime / webhook、Google Sheets、AppSheet 或 `web_admin_mvp/`。
- 尚未做真實登入、LINE Login、LIFF、OAuth、正式發布到 LINE / VOOM / Facebook，也未新增 DELETE。
- 暫停點：目前停在 A26.5 完成後，等待使用者通知再進入 A27。
- A27 前需先確認：採 LINE Login、LIFF 或既有 LINE Bot userId 綁定；是否新增 users / identities / line_bindings / permissions schema；是否建立 staging 專用 LINE channel 或避免動正式 LINE Bot；是否先整理匿名 / 準正式測試資料。
- 已改善 CTA 點擊後的流程回饋：編輯檢視、草稿暫存、送出確認、停用 / 作廢確認都有明顯狀態區塊。
- 管理者停用 / 作廢採二段確認；廟方人員高風險操作顯示需管理者確認。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix3 handoff update

- 已將詳情頁編輯模式改為可操作欄位，不再只是外觀變化。
- 已加入 input、textarea、date、number、select 與多選標籤互動。
- 取消編輯會回復原資料；儲存草稿與送出確認會保留前端暫存內容並顯示摘要。
- 檢視者仍不顯示操作 CTA，無法進入編輯模式。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix4 handoff update

- 已補上所有模組列表頁新增 CTA 的前端互動。
- 點擊新增會展開對應模組的新增表單，欄位依模組不同而不同。
- 新增流程支援儲存草稿、送出確認、取消新增。
- 檢視者不顯示可點擊新增 CTA。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix5 handoff update

- 已重新定義模組主頁：標題區、搜尋框、狀態篩選與列表分層呈現。
- 新增 CTA 已改為獨立新增流程，路由為各模組 `/new`，不再於列表同層展開大型表單。
- 編輯流程維持列表 → 詳情 → 詳情內編輯，列表頁不直接編輯、停用或封存。
- 儲存草稿、送出確認、停用 / 封存前都需先經過頁面內確認小框框。
- 一般前端不提供刪除，只提供停用 / 封存並保留紀錄。
- 檢視者預設只能看到未停用 / 未封存資料，且不顯示新增或操作 CTA。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix6 handoff update

- 左側選單已加入隱藏 / 展開控制；隱藏後主內容會取得更多寬度，並可用「展開選單」按鈕恢復。
- 左側選單不再顯示目前角色與角色切換。
- 目前角色與角色切換已統一移到右上方，並維持管理者、廟方人員、檢視者權限差異。
- 非管理者大型權限提示卡片已移除或改為低干擾提示列。
- 模組列表每筆資料同列右側顯示自己的「查看詳情」按鈕。
- 新增流程仍維持獨立 `/new` 頁面，不與列表同層展開。
- 儲存、送出、停用 / 封存前仍使用頁面內確認 dialog；前端仍不提供刪除。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix7 handoff update

- 管理者仍可看到並進入「管理者設定」。
- 廟方人員與檢視者不顯示「管理者設定」選單。
- 非管理者直接進入 `#/settings` 時，不顯示設定卡片或灰色管理按鈕，只顯示簡短提示與「返回主控台」。
- 模組列表資料列已調整為橫向列：左側狀態、中間標題與摘要、右側欄位、最右側「查看詳情」。
- 手機版仍維持每筆資料在同一張卡片內，詳情入口在卡片右下。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-14-Fix8 handoff update

- 左側選單預設為隱藏，主內容預設使用完整寬度。
- 上方保留「展開選單」按鈕；展開後可再用「隱藏選單」收回。
- 模組主頁的模組名稱、模組邊界、模組說明與新增 CTA 已整合到上方主標題區。
- 原本獨立模組標題大卡片已移除，搜尋與列表區塊上移。
- 角色顯示與角色切換仍位於右上方。
- 新增、編輯、查看詳情、停用 / 封存確認流程維持不變。
- 本輪仍未串 API、未部署、未修改 V1、未修改 `web_admin_mvp/`。

# 0.8.0A-15 handoff update

- Vercel 前端測試部署已完成。
- Vercel project：`zhongyuan-fude-web-admin-test`
- 測試網址：`https://zhongyuan-fude-web-admin-test.vercel.app`
- 部署 commit：`7b37733 feat: prepare web admin visual ux for testing`
- 部署範圍只包含 `web_admin_app/`，Root Directory 為 `web_admin_app`，Framework 為 Vite，Output Directory 為 `dist`。
- 目前可進入第三方 UI / UX 測試。
- 正式 V1 / Render / LINE Bot / Google Sheets / AppSheet 未修改。
- 本階段仍未串 API、未建立 PostgreSQL、未建立正式登入、未寫入正式資料。
- 部署紀錄見 `docs/WEB_ADMIN_VERCEL_PREVIEW_DEPLOYMENT_RECORD.md`。

# 0.8.0A-16 handoff update

- A14 UI / UX 測試版已部署，第三方測試回饋指出純前端資料缺乏臨場感。
- 使用者決策：下一階段進入 database-backed MVP，不再只做純前端 mock 測試。
- A16 先排除 LINE Bot 串接，不修改既有 LINE Bot runtime。
- V1 Google Sheets / LINE Bot / AppSheet 仍凍結不動，不同步 Web 後台測試資料。
- 新增 database-backed MVP 規劃文件、schema draft、API contract draft、frontend API integration plan。
- 新增 `web_admin_api/` FastAPI skeleton 與 migration 草案，作為未來 Render Web Admin API service 基礎。
- 下一步是建立 Web Admin API + Render PostgreSQL staging + 前端 API 串接；測試資料不可使用正式廟方敏感資料。
- 本輪未部署、未建立實際資料庫、未新增 `.env`、未讀取或輸出 secret。

# 0.8.0A-17 handoff update

- `web_admin_api/` 已進入本機 CRUD baseline。
- 若未設定 `DATABASE_URL`，API 使用 `web_admin_api/local_dev.sqlite3` 作為 SQLite fallback。
- 已新增本機初始化腳本與 smoke test。
- Records endpoint 支援新增、列表查詢、詳情、更新、封存、還原與 audit events。
- 本輪不修改 `web_admin_app/`，不部署 Render / Vercel。
- LINE Bot / V1 / Google Sheets / AppSheet 仍不動，前端仍不提供 DELETE。
