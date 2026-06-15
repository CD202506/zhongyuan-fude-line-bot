# Deployment Guide

## 本機開發流程

```powershell
git status
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m py_compile main.py config.py line_client.py sheets_client.py permission_service.py shrine_search_service.py reply_builder.py log_service.py
python -m uvicorn main:app --reload
```

瀏覽 `http://127.0.0.1:8000/health`。需要測試 Sheets 或 LINE 時，以本機環境變數
提供測試憑證，不要寫入程式或提交 `.env`。

## Git commit / push

1. `git status`
2. 檢查 `git diff`，確認沒有憑證或無關修改。
3. 執行編譯與人工測試。
4. `git add <confirmed-files>`
5. `git commit -m "<message>"`
6. 再次確認 `git status` 與 `git log --oneline -5`。
7. 取得人工確認後才執行 `git push`。

不要 squash 已要求保留的階段 commit，也不要 force push `main`。

## Render 自動部署

當 Render Web Service 連接 GitHub branch 並啟用 auto-deploy 時：

1. push 經確認的 commit。
2. Render 偵測新 commit 並執行 build。
3. Build Command 安裝 `requirements.txt`。
4. Start Command 啟動 `uvicorn main:app --host 0.0.0.0 --port $PORT`。
5. 部署成功後檢查 `/health`、Render Logs、LINE Verify 與人工測試。

不要在未確認時變更 auto-deploy branch、service name、region 或 commands。

## 手動部署

若 auto-deploy 關閉，可在 Render Dashboard 選擇部署最新 commit，或選擇指定 commit
重新部署。部署前先確認 GitHub 上的 commit hash、branch 與環境變數均正確。

手動部署不是跳過 Git 流程的方式；程式修改仍應先 commit 並 push 到受控 branch。

## `/health` 驗證

```text
GET https://<service-host>/health
```

預期：

```json
{
  "status": "ok",
  "service": "zhongyuan-fude-line-bot",
  "version": "0.2.3"
}
```

若版本不符，確認 Render 部署的 commit 與 branch，並檢查是否仍在舊 instance。

## LINE Verify

1. LINE Developers Console → Messaging API。
2. Webhook URL 設為 `https://<service-host>/webhook`。
3. 執行 Verify。
4. Verify 成功後確認 Use webhook 已啟用。
5. 實際傳送「白沙屯」與「白沙屯測試」。

Verify 只確認 endpoint 可接收請求，不等於 Sheets、權限與回覆內容全部正確。

## Rollback

優先使用 Render 的指定 commit redeploy，回到最近已驗證版本。若必須在 Git 建立
rollback，使用 `git revert <bad-commit>` 建立可追蹤的新 commit，不要改寫或
force push 已發布歷史。

Rollback 後必須重新驗證：

- `/health` 版本
- LINE Verify
- 公開/內部/查無三種查詢
- `line_query_logs`
- Render Logs

若事件涉及憑證外洩，rollback 不足以解決問題，還必須輪替相關 token/key。
