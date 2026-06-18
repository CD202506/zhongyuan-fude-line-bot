import unittest

from tools.prototype_validators.permissions import (
    can_access_admin_settings,
    can_devotee_read_record,
    is_temple_role_system_permission,
    team_member_is_not_automatically_admin,
)


class PermissionTests(unittest.TestCase):
    def test_admin_can_operate_admin_settings(self):
        self.assertTrue(can_access_admin_settings("admin"))

    def test_staff_and_viewer_cannot_operate_admin_settings(self):
        self.assertFalse(can_access_admin_settings("staff"))
        self.assertFalse(can_access_admin_settings("viewer"))

    def test_devotee_can_only_read_own_authorized_record(self):
        record = {"devotee_id": "devotee-001", "authorized": True}
        self.assertTrue(can_devotee_read_record("devotee-001", record))
        self.assertFalse(can_devotee_read_record("devotee-002", record))
        self.assertFalse(can_devotee_read_record("devotee-001", {"devotee_id": "devotee-001", "authorized": False}))

    def test_team_member_is_not_admin_by_default(self):
        self.assertTrue(team_member_is_not_automatically_admin({"system_permission": "staff"}))
        self.assertTrue(team_member_is_not_automatically_admin({"system_permission": None}))

    def test_temple_role_is_not_system_permission(self):
        self.assertFalse(is_temple_role_system_permission("總幹事"))
        self.assertFalse(is_temple_role_system_permission("主任委員"))
        self.assertTrue(is_temple_role_system_permission("admin"))


if __name__ == "__main__":
    unittest.main()

