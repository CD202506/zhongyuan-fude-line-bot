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
