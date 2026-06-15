# Test Checklist

測試前記錄目前 commit、版本、測試 LINE 帳號與 members 原始值。測試後還原臨時
權限設定，並確認沒有將敏感資訊寫入截圖或文件。

## 1. `/health`

- [ ] 本機啟動 `python -m uvicorn main:app --reload`
- [ ] 開啟 `http://127.0.0.1:8000/health`
- [ ] HTTP status 為 200
- [ ] `status` 為 `ok`
- [ ] `service` 為 `zhongyuan-fude-line-bot`
- [ ] `version` 為 `0.2.3`

## 2. `/debug/sheets` 預設關閉

- [ ] 未設定 `ENABLE_DEBUG_ENDPOINT=true`
- [ ] 開啟 `http://127.0.0.1:8000/debug/sheets`
- [ ] 回應為 disabled/404
- [ ] 回應不包含 Sheet records、完整 `line_uid`、token、JSON 或 private key

## 3. LINE 輸入「白沙屯」

- [ ] 使用已知測試帳號傳送「白沙屯」
- [ ] 收到一則文字回覆
- [ ] 廟名與主祀神明符合 V2 `shrines`
- [ ] 沒有重複回覆

## 4. LINE 輸入「白沙屯測試」

- [ ] 收到查無資料訊息
- [ ] 沒有誤匹配「白沙屯」
- [ ] `line_query_logs.result_status` 為 `not_found`

## 5. `can_view_internal_shrine = yes`

- [ ] 測試 member 的 `line_uid` 與 LINE user ID 完整相符
- [ ] `active=yes`
- [ ] `can_view_internal_shrine=yes`
- [ ] 等待 cache TTL 或重啟測試服務
- [ ] 輸入「白沙屯」後收到內部版

## 6. `can_view_internal_shrine = no`

- [ ] 將同一測試 member 設為 `can_view_internal_shrine=no`
- [ ] 等待 cache TTL 或重啟測試服務
- [ ] 輸入「白沙屯」後只收到公開版
- [ ] 測試後還原 members 原始值

## 7. `line_query_logs`

- [ ] 每次文字查詢新增一列
- [ ] `query_text` 正確
- [ ] matched record 欄位符合查詢結果
- [ ] `reply_type` 與 `reply_mode` 正確
- [ ] `reply_token_used=yes`
- [ ] `source_type=user_message`
- [ ] `scenario_version=Python_Render_V0.2.3`
- [ ] 欄位依 header 對齊，沒有錯位

## 8. Render Logs

- [ ] 部署啟動無 import/syntax error
- [ ] LINE webhook event 可收到
- [ ] LINE reply status/response 有合理紀錄
- [ ] 沒有輸出 token、private key 或完整 Service Account JSON
- [ ] query log 寫入失敗時，LINE 回覆仍只嘗試一次
