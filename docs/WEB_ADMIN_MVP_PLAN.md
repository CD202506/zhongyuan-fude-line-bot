# 0.8.0A Web 後台 MVP 規劃

## 階段定位

`0.8.0A` 的目標是規劃並準備第一版自製 Web 後台 MVP，重點放在廟方管理者可理解的資料檢視、編輯流程與截圖回饋。

第一版 Web 後台 MVP 只做可視化畫面與操作流程驗證，不正式上線。

## 正式狀態

- LINE Bot V1 已穩定運作。
- 正式 Render service：`zhongyuan-fude-line-bot`
- 正式資料來源：Google Sheets `中原福德宮_AppSheet_0612`
- 正式主檔目前仍供 LINE Bot 使用，不得任意修改。
- AppSheet 保留備援，但不再作為正式前端方向。
- 下一階段前端方向改為自製 Web 後台。

## 本階段安全邊界

本階段不做任何正式 runtime 切換或正式資料結構調整。

- 不接正式 LINE Bot。
- 不改正式 Google Sheets `中原福德宮_AppSheet_0612`。
- 不改正式主檔 tab、欄位、表頭或資料結構。
- 不改 Render `GOOGLE_SHEET_ID`。
- 不改 LINE Developers Webhook。
- 不改正式 LINE Bot runtime 行為。
- 不清空、重建或改寫正式 `line_query_logs`。
- 不直接把正式 runtime 的 `shrines` / `shrine_visits` 改名為 `temples` / `temple_visits`。
- 不部署 Render。

## 開發資料源

第一版 Web 後台 MVP 階段只允許使用以下資料來源：

- Google Sheets 開發基礎：`中原福德宮_AppSheet_0612_正式啟用前備份_20260616`
- 本機 mock data
- 本機 dev adapter

正式主檔 `中原福德宮_AppSheet_0612` 不作為 Web 後台 MVP 的讀寫目標。

## MVP 目標

第一版 MVP 用來回答以下問題：

- 廟方實際管理者是否看得懂主控台與資料分類。
- 友宮資料、聯絡人、來訪 / 請帖、公告是否能用自然流程維護。
- 新增、編輯與檢視流程是否符合實際廟務工作。
- 資料模型 V2 的命名與關聯是否適合 Web 後台。
- 哪些欄位需要保留、合併、拆分或延後處理。

使用者下一階段會以「廟方實際管理者」視角，用截圖與操作回饋整體 MVP，而不是逐欄位微調。

## 第一版建議畫面

- 首頁 / 主控台
- 友宮資料列表
- 友宮資料詳情
- 新增 / 編輯友宮
- 友宮聯絡人管理
- 來訪 / 請帖紀錄列表
- 新增 / 編輯來訪紀錄
- 公告列表
- 新增 / 編輯公告
- 成員 / 職務 / 權限檢視

## 第一版先不做

- 完整財務管理
- 完整會員登入系統
- 複雜 dashboard
- 自動推播
- 正式公告發送
- 資料庫 migration
- 大規模 LINE Bot 改寫
- 正式 LINE Bot 改接 V2 資料模型

## 技術方向

第一版可採用 mock-first 或 dev-adapter-first：

- `mock-first`：先用固定 JSON / fixture 完成畫面與流程，適合快速做截圖回饋。
- `dev-adapter-first`：以 adapter 包裝開發 Google Sheets，讓畫面提早接近真實資料。

不論採哪一種，Web 後台內部命名可先使用 V2 的 `temple` 語意，但 adapter 層必須保留 V1 相容說明，避免誤導正式 runtime 立即改名。

## 驗收方式

本階段驗收不以正式上線為目標，而以截圖、操作錄影或本機畫面回饋為主。

- 能清楚看見主要畫面與資料分類。
- 能示範新增 / 編輯流程，但資料可寫入 mock 或開發資料源。
- 能標示哪些操作未正式啟用。
- 能明確區分 Web 後台 MVP 與現行 LINE Bot 正式服務。

## 後續銜接

完成第一版畫面回饋後，再決定：

- 哪些欄位進入 V2 模型。
- 哪些功能才需要正式權限與登入。
- 是否需要資料庫，或繼續以 Google Sheets 作為短期後台資料源。
- 何時另案規劃正式 LINE Bot 與 V2 adapter 串接。
