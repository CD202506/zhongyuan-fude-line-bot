# 0.8.0A-9 V1 Freeze and Web Admin + Future LINE Bot Transition Decision

本文件正式記錄 `0.8.0A-9` 的方向修正：現有 V1 保留但凍結，專案正式轉入 Web 後台 V2 架構與開發階段。

本輪只做文件整理，不修改 prototype 程式、不修改正式 Google Sheets、不修改 Render、不修改 LINE Developers Webhook、不修改正式 LINE Bot runtime、不部署、不 commit。

## 1. V1 定位

V1 = Google Sheets + Render FastAPI + LINE Bot。

V1 已完成基本串接驗證，包含：

- Google Sheets 正式主檔。
- Render FastAPI runtime。
- LINE Developers Webhook。
- LINE Bot 查詢、來訪、公告、查紀錄與補資料建議等既有功能。

自本決策起：

- V1 保留。
- V1 凍結。
- V1 不再作為後續主開發方向。
- V1 不再新增功能。
- V1 不再因 Web 後台 V2 的新模組而調整 Google Sheets。
- V1 不再追隨 V2 prototype 改版。
- V1 只保留作為既有成果、內部測試參考、必要備查。

若現有 V1 功能發生故障，可另開明確維護任務處理。該維護任務應只處理既有功能故障，不應加入 V2 新需求。

## 2. Google Sheets 定位

現有 Google Sheets 不再作為 Web 後台 V2 的設計核心。

後續不再：

- 要求 V2 新模組同步到現有 Google Sheets。
- 為了符合 Google Sheets 限制而縮小 V2 架構。
- 為 V2 新需求調整正式主檔 tab、欄位、表頭或資料結構。
- 把新增善信、廟務管理、採購、公文 / 通知、正式帳務、權限等需求直接塞回現有 Google Sheets。

現有 Google Sheets：

- 不修改。
- 不擴張。
- 不作為 V2 最終資料核心。
- 不作為 V2 架構設計限制。

## 3. Web 後台 V2 定位

V2 正式進入 Web 後台架構與開發階段。

V2 應以以下內容作為設計前提：

- 正確廟務流程。
- 正確資料模型。
- 權限與角色。
- 安全與個資保護。
- API 邊界。
- 未來 LINE Bot 整合。
- 可維護性與測試。

V2 模組包含但不限於：

- 主控台。
- 廟務管理。
- 善信管理。
- 友宮管理。
- 來訪 / 請帖。
- 公告 / 活動。
- 採購管理。
- 公文 / 通知。
- 團隊管理。
- 帳務管理。
- 管理者設定。
- 未來 LINE Bot 整合。

V2 不再只是 Google Sheets 的前端。V2 是未來正式後台的藍圖與主開發方向。

## 4. LINE Bot 未來定位

LINE Bot 不取消。

現有 LINE Bot 暫不跟隨 V2 變動。後續除非是 V1 故障維護，否則不修改現有 LINE Bot runtime、Render 設定或 LINE Developers Webhook。

未來 LINE Bot 應改為串接：

- Web 後台穩定後的 API。
- 新資料核心。
- V2 權限與資料邊界。

未來 LINE Bot 可查詢或使用的資料，應由 V2 權限與 API 邊界決定。

以下敏感資料預設不開放 LINE 查詢，需另行權限設計：

- 帳務完整流水。
- 善信個資。
- 公文 / 通知。
- 權限與管理者設定。
- 內部維運資訊。

未來 LINE Bot 轉接時間點，應在 V2 核心資料模型、權限與 API 邊界穩定後，再重新規劃。

## 5. 後續開發原則

- 後續不再以 Google Sheets 是否能承擔作為 V2 設計限制。
- 後續不再同步調整 V1 Google Sheets。
- 後續不再調整現有 LINE Bot，除非是 V1 故障維護。
- Web 後台開發應先完成資訊架構、資料模型、操作流程、權限與測試。
- 未來 LINE Bot 整合應作為 Web 後台架構的一部分預留，而不是現在直接串接。
- 若未來需要資料庫、API、正式登入、權限控管，應另開階段規劃。

## 6. 相關文件

- `docs/DATA_BACKEND_EVOLUTION_STRATEGY.md`
- `docs/V1_V2_DATA_MAPPING_PLAN.md`
- `docs/WEB_ADMIN_TECHNICAL_ARCHITECTURE_ROADMAP.md`
- `docs/WEB_ADMIN_APP_DEVELOPMENT_PLAN.md`
- `docs/RENDER_API_AND_LINEBOT_FUTURE_INTEGRATION_PLAN.md`
- `docs/DATA_MODEL_V2_DISCUSSION.md`
- `docs/TEMPLE_AFFAIRS_MANAGEMENT_ARCHITECTURE.md`
- `docs/WEB_ADMIN_SCREEN_FLOW.md`
- `docs/CURRENT_PROJECT_STATUS.md`
