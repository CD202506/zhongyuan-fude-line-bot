# Current Status

## 目前版本

`0.2.3`

## 已完成

- FastAPI `/health` 與 LINE `/webhook`
- V2 `shrines` 友宮文字查詢
- alias 與廟名搜尋
- `members` 身分及公開/內部權限分流
- 查無資料回覆
- LINE Reply API 單次 reply token 流程
- `line_query_logs` header-based 寫入與 metadata
- log 寫入失敗不阻擋 LINE 回覆
- `shrines` / `members` TTL cache
- 預設關閉且可用 token 保護的 `/debug/sheets`
- 模組化程式結構
- 維護、部署、環境變數與人工測試文件

## 尚未完成

- `announcements`
- `shrine_visits`
- 圖片訊息
- Flex Message
- Facebook 同步
- 公告發布
- 正式 Google Sheets 表結構改版
- 自動化整合測試與監控告警

## 下一步建議

1. 先由人工依 `TEST_CHECKLIST.md` 驗證 `0.2.3`。
2. 確認 commit 後再 push，觀察 Render 自動部署。
3. 部署後保留一段穩定觀察期，檢查 LINE reply 與 query logs。
4. 下一個功能階段開始前，先決定 V2 資料結構是否固定及何時回整 V1。
5. 若增加新功能，維持小版本、獨立 commit、可 rollback 的交付方式。

## 暫停點

目前停在「LINE 友宮查詢 MVP 已完成，維護與交接文件已建立」。在人工確認及 push
前，不進行 Render 設定、憑證、Google Sheets 結構或新功能修改。
