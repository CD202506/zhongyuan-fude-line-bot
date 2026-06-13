# zhongyuan-fude-line-bot

中原福德宮 LINE Bot V2 暫存測試專案。

## 目前目標

第一版只做：

1. `/health` 健康檢查
2. `/webhook` 接收 LINE Webhook
3. 讓 LINE Developers Verify 通過

## 本機啟動

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload