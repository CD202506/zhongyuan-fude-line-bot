"""Classification checks for Web Admin prototype label groups."""

from __future__ import annotations


PUBLISH_CHANNELS = {"LINE", "Facebook", "VOOM", "宮廟公告欄"}
PUBLISH_STATUSES = {"草稿", "預覽", "不正式發送", "已發布"}
TEMPLE_ROLES = {"主任委員", "總幹事", "值年爐主", "值年副爐主", "委員", "監事"}
CONTACT_ROLES = {"主委", "總務", "聯絡窗口", "秘書"}
SYSTEM_PERMISSIONS = {"admin", "staff", "viewer"}
ACCOUNTING_CATEGORIES = {"香油錢", "發財金還金", "平安龜還願", "餐費", "供品", "其他"}


def groups_are_disjoint(*groups: set[str]) -> bool:
    seen: set[str] = set()
    for group in groups:
        if seen.intersection(group):
            return False
        seen.update(group)
    return True


def is_staffing_content_admin_setting(label: str) -> bool:
    return label in {"職務任期", "具體人員任期", "值勤班表"}
