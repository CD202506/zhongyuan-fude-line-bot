# V1 / V2 Legacy Data Mapping Reference

本文件是 `0.8.0A-9 V1 Freeze and Web Admin + Future LINE Bot Transition Decision` 之後的歷史對照參考。

它不是 V2 設計限制，不代表 V2 新模組必須同步到現有 Google Sheets，也不代表要把 V2 欄位塞回 V1 tab。

## 文件用途

本文件只用於：

- 理解既有 V1 成果。
- 理解現有 LINE Bot 曾依賴哪些 Google Sheets tab。
- 未來若需要資料遷移時，協助辨識舊資料來源。
- 未來若重新串接 LINE Bot，協助理解舊 runtime 與資料命名。
- 協助規劃 adapter / migration，但不要求 V2 受 V1 結構限制。

本文件不應用於：

- 要求 V2 新模組同步到現有 Google Sheets。
- 要求 V2 欄位必須符合 V1 tab。
- 要求 V2 prototype 因 V1 tab 不存在而縮小。
- 直接修改正式 Google Sheets。
- 直接把善信、正式帳務、採購、公文 / 通知、權限等 V2 需求塞回現有 Google Sheets。

## 已知 V1 / 現有資料表

```text
shrines
members
shrine_visits
announcements
line_query_logs
events
finance_logs
```

這些名稱只描述既有 V1 狀態。正式 tab 不在本階段改名、不擴張、不為 V2 需求調整。

## V2 模組

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

V2 模組以正確廟務流程、資料模型、權限、安全、API 與未來 LINE Bot 整合為設計前提，不以現有 V1 tab 是否存在作為限制。

## V1 / V2 命名對照

| V1 / 現有命名 | V2 / Web 後台命名 | Legacy reference 說明 |
| --- | --- | --- |
| `shrines` | `temples` / 友宮主檔 | V1 友宮資料來源。V2 可使用 temple 語意，但不改 V1 tab。 |
| `shrine_visits` | `temple_visits` / 來訪請帖 | V1 來訪與請帖資料來源。V2 可重新設計互動事件模型。 |
| `finance_logs` | `ledger_entries` / 帳務流水 | V1 可能已有簡單紀錄概念。V2 帳務不以 V1 結構為限制。 |
| `announcements` | `announcements` / 公告 | V1 公告資料來源。V2 可保留 announcement 語意並加上權限與關聯。 |
| `events` | `events` / 活動 | V1 活動資料來源。V2 需清楚區分活動與公告。 |
| `members` | `members` / `team_members` / permissions / role assignments | V1 members 混合多種人員語意。V2 需拆分團隊、廟務職務、系統權限。 |
| `line_query_logs` | query logs / 系統操作紀錄 | V1 LINE 查詢紀錄。V2 系統操作紀錄與 LINE 查詢需重新定義權限。 |

## Legacy 對照表

| V2 模組 | V1 是否有歷史對應 | 現有 V1 tab | V1 既有能力 | V2 新方向 | 對 V2 設計的約束 | 是否影響現有 LINE Bot | 備註 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 主控台 | 間接 | 多 tab 彙整 | 可從既有資料彙整數字 | 近期廟務動態、模組入口、管理者資訊 | 無 | 否 | 主控台不是資料主檔。 |
| 友宮管理 | 有 | `shrines` | 友宮搜尋、基本資料 | 友宮主檔、聯絡人、地圖、關聯紀錄 | 無 | 是 | V2 可重新設計，不直接改 V1。 |
| 來訪 / 請帖 | 有 | `shrine_visits` | 來訪 / 請帖查詢 | 互動事件、時間段、關聯公告與帳務 | 無 | 是 | 來訪 / 請帖是事件，不是公告。 |
| 公告 / 活動 | 有 | `announcements`, `events` | 公告與活動資料 | 發布草稿、活動資料、關聯來訪 | 無 | 部分 | 公告不等於活動。 |
| LINE Bot 查詢 / 記錄 | 有 | `line_query_logs` | 查詢、查無資料、補資料建議 | 系統操作紀錄、維運與查詢權限 | 無 | 是 | 未來需由 V2 API 與權限重新定義。 |
| 團隊管理 | 部分 | `members` | 成員概念 | 團隊成員、值勤班表、現場值班 | 無 | 可能 | 團隊成員不一定是系統使用者。 |
| 管理者設定 | 部分 | `members` 或零散設定 | 權限概念可能混在 members | 權限規則、標籤主檔、資料來源狀態 | 無 | 可能 | V2 權限不應受 V1 members 限制。 |
| 善信管理 | 無明確對應 | 無明確正式 tab | 未確認有完整善信主檔 | 善信個資、發財金、平安龜、授權查詢 | 無 | 否 | 不應直接塞回現有 Google Sheets。 |
| 廟務管理 | 無完整對應 | 可能分散 | 未形成日常廟務事項主檔 | 添油香、光明燈、太歲、還金 / 還願 | 無 | 否 | 需以 V2 流程重新設計。 |
| 採購管理 | 無 | 無明確正式 tab | 無正式採購流程 | 品項、數量、用途、供應商、經手人 | 無 | 否 | 支出可關聯帳務，但不等於帳務本身。 |
| 公文 / 通知 | 無 | 無明確正式 tab | 無正式公文紀錄 | 來文、發文、友宮函文、會議通知、附件 | 無 | 否 | 文件紀錄不等於公告 / 活動。 |
| 帳務管理 | 部分 | `finance_logs` | 可能有簡單流水概念 | 帳務流水、作廢 / 沖銷、科目、月報草稿 | 無 | 否 | 不是正式會計、報稅、審計或銀行帳務系統。 |

## 舊資料可參考範圍

V1 legacy reference 可協助理解：

- 友宮主檔資料。
- 既有簡單來訪 / 請帖。
- 既有公告與活動。
- LINE 查詢紀錄。
- 舊 members 欄位如何曾被使用。

但這些只作為舊資料理解，不代表 V2 必須維持相同欄位或流程。

## 不得塞回現有 Google Sheets 的 V2 需求

以下 V2 需求不得在沒有新階段規劃與人工確認前直接塞回現有 Google Sheets：

- 善信個資。
- 發財金 / 平安龜完整年度紀錄。
- 正式帳務流水。
- 採購流程。
- 公文 / 通知與附件。
- 權限控管。
- 異動紀錄。
- 作廢 / 沖銷。
- 重複送出防護。
- 未來 API 權限模型。

## 未來使用情境

若未來要重新串接 LINE Bot 或遷移舊資料，才重新使用本文件作為參考：

1. 盤點 V1 既有 tab 與欄位。
2. 決定哪些舊資料要匯入新資料核心。
3. 設計 migration / adapter。
4. 由 V2 API 與權限邊界決定 LINE Bot 可查詢範圍。
5. 另開明確任務處理正式資料遷移或 LINE Bot 轉接。

## 安全邊界

本文件不觸發任何正式資料修改：

- 不修改正式 Google Sheets。
- 不修改 Render。
- 不修改 LINE Developers Webhook。
- 不修改正式 LINE Bot runtime。
- 不新增正式寫入 Google Sheets 程式。
- 不部署。
