# 0.8.0A-9 V1 Freeze and Web Admin Transition Strategy

本文件記錄 `0.8.0A-9 V1 Freeze and Web Admin + Future LINE Bot Transition Decision`。

本輪只做文件整理，不修改 prototype 程式、不修改正式 Google Sheets、不修改 Render、不修改 LINE Developers Webhook、不修改正式 LINE Bot runtime、不部署。

## 核心決策

現有 V1 = Google Sheets + Render FastAPI + LINE Bot。

V1 已完成基本串接驗證，保留作為既有成果、內部測試參考與必要備查，但不再作為 Web 後台 V2 的設計前提。

自本決策起：

- V1 凍結。
- V1 不再新增功能。
- V1 不再因 Web 後台 V2 的新模組調整 Google Sheets。
- V1 不再追隨 Web 後台 prototype 改版。
- 現有 Google Sheets 不再作為 V2 的資料核心。
- 現有 Google Sheets 不再作為 V2 架構設計限制。
- V2 正式進入 Web 後台架構與開發階段。

若現有 V1 功能發生故障，可另開明確維護任務處理。維護任務應限於恢復既有功能，不應趁機新增 V2 需求或擴張正式 Google Sheets 結構。

## V1 定位

V1 代表：

- Google Sheets 正式主檔。
- Render FastAPI runtime。
- LINE Developers Webhook。
- LINE Bot 查詢與記錄流程。

V1 目前定位：

- 既有成果。
- 內部測試參考。
- 必要備查。
- 現有功能故障時的維護對象。

V1 不再承擔：

- Web 後台 V2 新功能開發。
- 善信管理、廟務管理、採購、公文 / 通知、正式帳務、權限等新模組承載。
- 為符合 V2 prototype 而調整 Google Sheets。
- 為 V2 新資料模型改名、拆表、補欄位或調整 tab。

## Google Sheets 定位

現有 Google Sheets 不再作為 Web 後台 V2 的設計核心。

後續不再要求：

- V2 新模組同步到現有 Google Sheets。
- V2 欄位必須能塞入現有 tab。
- V2 架構必須因 Google Sheets 限制而縮小。
- 善信、正式帳務、採購、公文 / 通知、權限等需求直接塞回現有 Google Sheets。

現有 Google Sheets：

- 不修改。
- 不擴張。
- 不作為 V2 最終資料核心。
- 不作為未來正式 Web 後台資料模型的主要限制。

## Web 後台 V2 定位

V2 正式進入 Web 後台架構與開發階段。

V2 應以以下前提設計：

- 正確廟務流程。
- 正確資料模型。
- 權限與角色邊界。
- 安全與個資保護。
- 可維護 API。
- 未來 LINE Bot 整合。

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

## LINE Bot 未來定位

LINE Bot 不取消。

現有 LINE Bot 暫不跟隨 V2 變動。後續除非 V1 現有功能故障，否則不修改現有 LINE Bot runtime、Render 設定或 LINE Developers Webhook。

未來 LINE Bot 應改為串接：

- Web 後台穩定後的 API。
- 新資料核心。
- V2 權限與資料邊界。

未來 LINE Bot 可查詢或使用哪些資料，應由 V2 權限與 API 邊界決定。

敏感資料預設不開放 LINE 查詢，例如：

- 帳務完整流水。
- 善信個資。
- 公文 / 通知。
- 權限與管理者設定。

未來 LINE Bot 轉接時間點，應在 V2 核心資料模型、權限與 API 邊界穩定後，再另開階段規劃。

## 後續開發原則

1. 後續不再以 Google Sheets 是否能承擔作為 V2 設計限制。
2. 後續不再同步調整 V1 Google Sheets。
3. 後續不再調整現有 LINE Bot，除非是 V1 故障維護。
4. Web 後台開發應先完成資訊架構、資料模型、操作流程、權限與測試。
5. 未來 LINE Bot 整合應作為 Web 後台架構的一部分預留，而不是現在直接串接。
6. 若未來需要資料庫、API、正式登入、權限控管，應另開階段規劃。
7. V1/V2 對照文件只作為 legacy reference，不作為 V2 設計限制。

## 不做的事

本階段不做：

- 不修改正式 Google Sheets。
- 不修改 Render。
- 不修改 LINE Developers Webhook。
- 不修改正式 LINE Bot runtime。
- 不新增正式寫入 Google Sheets 程式。
- 不接正式資料。
- 不部署。
- 不 commit。
