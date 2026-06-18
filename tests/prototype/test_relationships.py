import unittest

from tools.prototype_validators.relationships import (
    RelationshipValidationError,
    build_announcement_from_temple,
    build_announcement_from_visit,
    build_visit_from_temple,
    validate_announcement_relation,
    validate_dashboard_recent_record,
    validate_devotee_relationship,
    validate_team_module_sections,
    validate_temple,
    validate_temple_name_is_master_record,
    validate_visit_row_semantics,
    validate_visit_type_master_location,
)


class RelationshipTests(unittest.TestCase):
    def setUp(self):
        self.temple_ids = {"temple-001", "temple-002"}
        self.visits = {
            "visit-001": {"visit_id": "visit-001", "temple_id": "temple-001"},
        }

    def test_temple_requires_temple_id(self):
        validate_temple({"temple_id": "temple-001"})
        with self.assertRaises(RelationshipValidationError):
            validate_temple({"name": "白沙屯拱天宮"})

    def test_temple_name_must_not_contain_event_description(self):
        validate_temple_name_is_master_record("白沙屯拱天宮")
        validate_temple_name_is_master_record("集慶福德廟")
        for invalid_name in ["集慶福德廟參訪", "大有福德宮祝壽請帖", "白沙屯拱天宮會香"]:
            with self.assertRaises(RelationshipValidationError):
                validate_temple_name_is_master_record(invalid_name)

    def test_visit_from_temple_carries_temple_id(self):
        self.assertEqual(build_visit_from_temple("temple-001", self.temple_ids), {"temple_id": "temple-001"})

    def test_visit_row_keeps_subject_separate_from_temple_name(self):
        validate_visit_row_semantics({"temple_name": "集慶福德廟", "subject": "集慶福德廟參訪"})
        validate_visit_row_semantics({"temple_name": "白沙屯拱天宮", "subject": "白沙屯拱天宮會香"})
        with self.assertRaises(RelationshipValidationError):
            validate_visit_row_semantics({"temple_name": "集慶福德廟參訪", "subject": "參訪"})
        with self.assertRaises(RelationshipValidationError):
            validate_visit_row_semantics({"temple_name": "集慶福德廟", "subject": ""})

    def test_visit_type_master_list_is_not_general_visit_page_content(self):
        validate_visit_type_master_location("管理者設定 / 標籤主檔", True)
        validate_visit_type_master_location("來訪 / 請帖紀錄列表", False)
        with self.assertRaises(RelationshipValidationError):
            validate_visit_type_master_location("來訪 / 請帖紀錄列表", True)

    def test_announcement_from_temple_carries_temple_id(self):
        self.assertEqual(
            build_announcement_from_temple("temple-002", self.temple_ids),
            {"related_temple_id": "temple-002"},
        )

    def test_announcement_from_visit_carries_visit_and_temple(self):
        self.assertEqual(
            build_announcement_from_visit("visit-001", self.visits),
            {"related_visit_id": "visit-001", "related_temple_id": "temple-001"},
        )

    def test_announcement_can_link_visit_but_not_replace_visit(self):
        validate_announcement_relation({"announcement_id": "ann-001", "related_visit_id": "visit-001"}, self.visits)
        with self.assertRaises(RelationshipValidationError):
            validate_announcement_relation({"announcement_id": "ann-002", "related_visit_id": "visit-missing"}, self.visits)
        with self.assertRaises(RelationshipValidationError):
            validate_announcement_relation({"announcement_id": "ann-003", "record_type": "visit"}, self.visits)

    def test_dashboard_recent_records_are_not_system_logs(self):
        validate_dashboard_recent_record({"title": "白沙屯拱天宮來訪", "type": "來訪 / 請帖"})
        validate_dashboard_recent_record({"title": "團隊值勤提醒", "type": "團隊值勤"})
        for record in [
            {"title": "友宮資料更新", "type": "友宮資料更新"},
            {"title": "活動用品支出示範", "type": "帳務流水"},
            {"title": "LINE 查詢紀錄", "type": "LINE 查詢紀錄"},
            {"title": "查無資料", "type": "查無資料"},
        ]:
            with self.assertRaises(RelationshipValidationError):
                validate_dashboard_recent_record(record)

    def test_team_module_main_page_only_contains_members_and_duty_roster(self):
        validate_team_module_sections(["團隊成員列表", "值勤班表"])
        with self.assertRaises(RelationshipValidationError):
            validate_team_module_sections(["團隊成員列表", "值勤班表", "廟務職務 / 系統權限"])
        with self.assertRaises(RelationshipValidationError):
            validate_team_module_sections(["團隊成員列表"])

    def test_unknown_relationship_id_is_blocked(self):
        with self.assertRaises(RelationshipValidationError):
            build_visit_from_temple("temple-missing", self.temple_ids)
        with self.assertRaises(RelationshipValidationError):
            build_announcement_from_visit("visit-missing", self.visits)

    def test_devotee_records_require_existing_devotee(self):
        validate_devotee_relationship({"devotee_id": "devotee-001"}, {"devotee-001"})
        with self.assertRaises(RelationshipValidationError):
            validate_devotee_relationship({"devotee_id": "devotee-missing"}, {"devotee-001"})


if __name__ == "__main__":
    unittest.main()
