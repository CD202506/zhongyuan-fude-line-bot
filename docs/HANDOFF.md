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
