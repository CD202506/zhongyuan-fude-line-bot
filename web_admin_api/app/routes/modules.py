from fastapi import APIRouter

from ..schemas import ModuleResponse

router = APIRouter(tags=["modules"])

MODULES = [
    ModuleResponse(key="temple-affairs", title="廟務管理", description="管事：例行工作、祭典準備、關聯任務與內部提醒。"),
    ModuleResponse(key="devotees", title="善信管理", description="管人：善信基本資料、授權狀態與年度服務紀錄。"),
    ModuleResponse(key="shrines", title="友宮管理", description="友宮主檔、聯絡窗口、關係狀態與互訪紀錄摘要。"),
    ModuleResponse(key="visits", title="來訪 / 請帖", description="互動事件：來訪、進香、請帖、回覆與待確認事項。"),
    ModuleResponse(key="announcements", title="公告", description="發布內容：公告草稿、發布狀態與發布管道。"),
    ModuleResponse(key="events", title="活動", description="活動資料：活動日期、籌備狀態、參與對象與公告關聯。"),
    ModuleResponse(key="procurements", title="採購管理", description="廟務重要子功能：請購、估價、驗收與帳務關聯摘要。"),
    ModuleResponse(key="documents", title="公文 / 通知", description="文件紀錄：來文、發文、內部通知與待追蹤事項。"),
    ModuleResponse(key="team", title="團隊管理", description="團隊成員、職務任期、值勤安排與系統角色摘要。"),
    ModuleResponse(key="ledger", title="帳務管理", description="管錢：流水草稿、分類、月報公告草稿與關聯支出。"),
]


@router.get("/modules", response_model=list[ModuleResponse])
def list_modules() -> list[ModuleResponse]:
    return MODULES
