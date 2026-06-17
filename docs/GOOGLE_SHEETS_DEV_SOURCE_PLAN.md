# 0.8.0A Google Sheets 開發資料源規劃

## 目的

本文件定義 Web 後台 MVP 與資料模型 V2 討論期間的 Google Sheets 開發資料源使用原則。

本階段只做新增文件、Web 後台規劃、開發資料源規劃、mock/dev adapter 規劃，不修改 production runtime code，不部署 Render。

## 正式資料源

正式主檔：

```text
中原福德宮_AppSheet_0612
```

正式主檔目前供 LINE Bot V1 使用，不得任意修改。

嚴格禁止：

- 修改正式主檔 tab。
- 修改正式主檔欄位。
- 修改正式主檔表頭。
- 修改正式主檔資料結構。
- 清空、重建或改寫正式 `line_query_logs`。
- 將正式 runtime 的 `shrines` / `shrine_visits` 直接改名為 `temples` / `temple_visits`。

## Web 後台 MVP 開發資料源

本階段開發基礎：

```text
中原福德宮_AppSheet_0612_正式啟用前備份_20260616
```

第一版 Web 後台 MVP 只允許使用：

- `中原福德宮_AppSheet_0612_正式啟用前備份_20260616`
- 本機 mock data
- 本機 dev adapter

第一版不接正式 LINE Bot、不改正式 Google Sheets、不改 Render、不改 LINE Developers Webhook。

## AppSheet 定位

AppSheet 保留備援，但不再作為正式前端方向。

短期原則：

- AppSheet 不再作為新功能設計的主要前端。
- 不以 AppSheet 欄位限制直接決定 Web 後台 V2 模型。
- 若 AppSheet 仍需維持可用，應避免改動正式主檔結構。

## Dev adapter 原則

Web 後台可先使用 dev adapter 隔離資料來源。

建議 adapter 責任：

- 對 UI 暴露 V2 語意命名，例如 `temples`、`temple_contacts`、`temple_visits`。
- 對開發資料源保留現有 tab 或欄位對應。
- 明確標示目前資料來源是 dev source，不是正式主檔。
- 阻擋或避免任何正式 Sheet ID 被寫入。
- 將來可切換到 mock、本機 fixture 或測試 Google Sheets。

相容說明：

| Web 後台 / V2 | 現有 V1 語意 | adapter 說明 |
| --- | --- | --- |
| `temples` | `shrines` | 友宮主資料命名演進，不代表正式 tab 已改名。 |
| `temple_visits` | `shrine_visits` | 來訪 / 請帖紀錄命名演進，不代表正式 tab 已改名。 |
| `temple_contacts` | 友宮聯絡欄位或新表 | 第一版用來驗證拆表是否符合廟方管理流程。 |

## Mock data 原則

若第一版先採 mock data，應符合以下原則：

- 使用接近真實廟務語意的資料。
- 避免混入正式 LINE user ID 或敏感個資。
- 保留友宮、聯絡人、來訪紀錄、公告、成員權限的關聯。
- mock 資料需清楚標示不可視為正式資料。

建議 mock 範圍：

- 友宮 5 到 10 筆。
- 每個友宮 0 到 3 位聯絡人。
- 近期來訪 / 請帖 10 到 20 筆。
- 公告草稿與已準備公告各數筆。
- 成員、廟務職務與系統權限樣本。

## 寫入策略

第一版 MVP 可先只讀或寫入 dev source / mock。

建議分級：

| 等級 | 說明 | 是否允許 |
| --- | --- | --- |
| UI only | 只做畫面，不保存 | 允許 |
| Mock write | 寫入本機 mock 或瀏覽器狀態 | 允許 |
| Dev Sheet write | 寫入開發資料源 | 可評估後允許 |
| Production Sheet write | 寫入正式主檔 | 不允許 |

## 權限與設定安全

不得修改：

- Render `GOOGLE_SHEET_ID`
- LINE Developers Webhook
- 正式 LINE Bot runtime 行為
- 正式 Google Sheets 主檔結構

若未來需要讀取開發 Google Sheets，應另行確認：

- 開發 Sheet ID 不等於正式 Sheet ID。
- Service Account 權限只授權必要範圍。
- 本機設定與正式 Render env 分離。
- 文件不提交敏感憑證。

## 截圖回饋階段

第一版 Web 後台 MVP 的回饋方式以截圖與操作流程為主。

使用者下一階段會以「廟方實際管理者」視角，整體檢視：

- 主控台是否看得懂。
- 友宮資料維護是否自然。
- 聯絡人拆分是否合理。
- 來訪 / 請帖紀錄是否符合廟務工作。
- 公告與來訪關聯是否有用。
- 成員職務與系統權限是否容易理解。

本階段不以逐欄位微調為主要目標。

## 進入下一階段前檢查

- [ ] 確認所有 Web 後台畫面只使用 dev source 或 mock。
- [ ] 確認正式主檔 `中原福德宮_AppSheet_0612` 未被修改。
- [ ] 確認 Render `GOOGLE_SHEET_ID` 未被修改。
- [ ] 確認 LINE Developers Webhook 未被修改。
- [ ] 確認 production runtime code 未被修改。
- [ ] 確認沒有清空、重建或改寫正式 `line_query_logs`。
- [ ] 確認 AppSheet 保留備援定位，但不再作為正式前端方向。
