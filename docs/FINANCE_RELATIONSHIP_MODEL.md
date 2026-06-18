# 帳務關聯模型規劃

## 文件目的

本文件補強 Web 後台 V2 的帳務管理關聯模型。帳務流水紀錄不應孤立存在，需能追溯來源與關聯對象。

本輪只是架構補充：

- 不建立完整會計系統。
- 不做正式報稅或審計功能。
- 不做銀行帳戶管理。
- 不寫入正式 Google Sheets。
- 不修改正式 LINE Bot runtime。
- 不修改 Render。
- 不修改 LINE Developers Webhook。
- 不部署。
- 不 commit。

## 命名與短期定位

未來正式模組名稱統一使用：

```text
帳務管理
```

若需描述功能，使用：

- 帳務流水紀錄
- 收支流水帳
- 月報公告草稿

避免使用容易被理解成正式會計平台的命名，以免誤解為報稅、審計或銀行帳務系統。

短期定位為：

```text
廟務流水帳紀錄
收支摘要
月度收支公告草稿
對指定對象的 LINE 群組公告內容輔助
```

短期目標：

- 可查詢。
- 可分類。
- 可彙整。
- 可產生月報草稿。
- 可依公告對象產生不同內容層級。

本階段不存放銀行帳號、帳戶資訊、真實收據號碼或敏感帳務資料。

## 帳務關聯原則

帳務流水紀錄應至少區分：

- 收入 / 支出方向。
- 收支分類。
- 來源摘要。
- 關聯對象。
- 經手人。
- 是否納入月度公告。
- 公告對象。
- 月報期間。
- 備註與建立 / 更新時間。

本階段仍只規劃，不做完整會計結算功能，也不放銀行帳號、帳戶、真實收據號碼或敏感個資。

## 善信相關收入

來源包含：

- 發財金還金
- 平安龜還願
- 香油錢
- 活動收入
- 捐獻

可能關聯：

- 善信
- 發財金紀錄
- 平安龜紀錄
- 還金 / 還願紀錄
- 活動

這些收入可產生帳務流水，並可被納入月度公告摘要。

## 友宮來訪相關支出

來源包含：

- 餐費
- 鮮花
- 香油錢
- 接待費
- 交通或停車安排
- 供品支出

可能關聯：

- 友宮
- 來訪 / 請帖紀錄
- 活動
- 公告

友宮來訪支出應關聯來訪紀錄，避免支出與廟務事件脫節。

## `finance_logs` 資料方向

表名可先沿用 `finance_logs` 作為資料模型討論代稱，但正式 Web 後台模組命名應使用「帳務管理」。

```text
finance_logs
- finance_id
- date
- direction: income / expense
- category
- amount
- summary
- related_type
- related_id
- related_devotee_id
- related_temple_id
- related_visit_id
- related_event_id
- handled_by
- announcement_visibility
- announcement_target_group
- monthly_report_period
- status
- note
- created_at
- updated_at
```

欄位說明：

- `direction`：收入 / 支出。
- `category`：香油錢、發財金還金、平安龜還願、活動收入、餐費、鮮花、供品支出、活動支出、修繕、雜支等。
- `related_type`：關聯對象類型。
- `related_id`：關聯對象 ID。
- `related_devotee_id`：關聯善信 ID，便於從善信紀錄追溯帳務流水。
- `related_temple_id`：關聯友宮 ID，便於從友宮資料追溯接待支出。
- `related_visit_id`：關聯來訪 / 請帖紀錄 ID，避免友宮來訪支出與事件脫節。
- `related_event_id`：關聯活動 ID。
- `handled_by`：經手人，可關聯團隊成員或系統使用者。
- `announcement_visibility`：是否納入月度公告。
- `announcement_target_group`：公告對象。
- `monthly_report_period`：月報期間，例如 `2026-06`。
- `status`：草稿、有效、作廢、沖銷等狀態。

### `related_type`

`related_type` 可包含：

```text
devotee
fortune_money
peace_turtle
repayment
temple_visit
event
announcement
manual
```

## 月度 LINE 群組公告需求

廟方每月會在 LINE 群組公告帳務流水或收支摘要。未來需規劃：

```text
月報公告草稿
```

目的：

- 從流水帳彙整指定月份資料。
- 產生可貼到 LINE 群組的公告草稿。
- 依公告對象決定內容細節。
- 本階段只規劃，不做正式推播。

公告對象至少包含：

```text
團隊成員
管理委員會成員
系統管理者
```

未來可再擴充：

```text
一般善信公開摘要
內部完整版本
```

### 權限原則

- 團隊成員可接收必要的月度公告或摘要。
- 管理委員會成員可查看較完整流水帳摘要。
- 系統管理者可查看完整紀錄與設定公告範圍。
- 善信本人只可查詢與自己相關的授權紀錄，不可查看完整內部帳務流水。
- 公開公告與內部公告內容應分開。

## 月報草稿資料方向

未來可有：

```text
monthly_finance_reports
- report_id
- period
- title
- target_group
- summary_text
- line_message_body
- include_income
- include_expense
- include_related_notes
- status: draft / reviewed / posted
- created_by
- reviewed_by
- posted_at
- note
```

狀態原則：

- `draft`：草稿。
- `reviewed`：已確認。
- `posted`：已手動公告或未來由系統公告。

本階段不做正式 LINE 推播，只做月報公告草稿規劃。

## 關聯範例

### 發財金還金

```text
direction: income
category: 發財金還金
related_type: repayment
related_id: repayment_id
handled_by: member_id 或 system_user_id
announcement_visibility: true
announcement_target_group: 管理委員會成員
monthly_report_period: 2026-06
```

可再追溯到：

- 善信
- 發財金年度紀錄
- 還金紀錄

### 平安龜還願

```text
direction: income
category: 平安龜還願
related_type: peace_turtle
related_id: peace_turtle_record_id
announcement_visibility: true
announcement_target_group: 團隊成員
monthly_report_period: 2026-06
```

可再追溯到：

- 善信
- 平安龜年度紀錄
- 還願紀錄

### 友宮來訪接待費

```text
direction: expense
category: 接待費
related_type: temple_visit
related_id: visit_id
announcement_visibility: true
announcement_target_group: 管理委員會成員
monthly_report_period: 2026-06
```

可再追溯到：

- 友宮
- 來訪 / 請帖紀錄
- 活動或公告

## 帳務公告與模組關聯

### 善信管理

以下收入可產生帳務流水，並可被納入月度公告摘要：

- 發財金還金
- 平安龜還願
- 香油錢
- 捐獻
- 活動收入

這些收入應關聯善信管理中的善信、發財金紀錄、平安龜紀錄或還金 / 還願紀錄。

### 友宮 / 來訪

以下支出可產生帳務流水，並關聯來訪紀錄：

- 友宮來訪餐費
- 鮮花
- 香油錢
- 接待支出
- 交通 / 停車安排
- 供品支出

### 團隊管理

帳務公告需可關聯：

- 經手人
- 值勤人員
- 月報公告對象
- LINE 群組通知對象

帳務公告至少要能依「團隊成員」作為公告對象之一。

## 現場表單經手人防呆

宮廟現場可能使用公用電腦，不能只依賴登入 session 判斷經手人。未來所有現場行政表單都應有顯性欄位：

```text
經手人 / 現場值班：[請選擇姓名]
```

適用表單包含：

- 來訪登記
- 帳務登錄
- 還金 / 求金
- 平安龜登記
- 香油錢登記

規則：

- 可從當日值勤班表預設。
- 使用者可手動切換。
- 不應只用 hidden input 或 session user_id。
- 這是現場防呆與稽核需求。

## 金額輸入清洗規劃

未來金額輸入需在前端或 adapter 送出前轉換為乾淨數值。需處理：

- 全形數字，例如 `１０００`
- 千分位逗號，例如 `1,000`
- 中文或單位，例如 `600元`
- 空白
- 非數字符號

本階段只記錄，不實作正式資料寫入。

## 作廢 / 沖銷原則

帳務流水不應以「直接把原金額乘以 -1」作為主要策略。較安全原則：

- 原始流水紀錄不可直接刪除。
- 作廢時保留原紀錄。
- 設定 `status = void` / 作廢。
- 若需要抵銷，可另建一筆沖銷紀錄。
- 月報與查詢時排除作廢紀錄或顯示沖銷關係。
- 在正式 V1 / V2 過渡期，不得讓作廢紀錄被錯誤納入加總。

## 與 Web 後台流程的關係

帳務管理未來仍應遵守：

```text
先瀏覽 / 搜尋
→ 查看詳情
→ 詳情頁內編輯 / 作廢 / 管理關聯資料
```

帳務列表頁不直接編輯或刪除。帳務詳情頁才提供：

- 編輯帳務流水紀錄
- 儲存草稿
- 標記作廢
- 補備註
- 類別檢視
- 查看關聯善信 / 友宮 / 活動 / 來訪紀錄
- 產生月報公告草稿

## 本階段不做

- 不做完整會計系統。
- 不做正式報稅或審計功能。
- 不做銀行帳戶管理。
- 不做資料庫 migration。
- 不寫入正式 Google Sheets。
- 不新增正式收據或帳戶資料。
- 不接正式 LINE Bot runtime。
- 不做正式 LINE 推播。
