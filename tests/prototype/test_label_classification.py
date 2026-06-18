import unittest

from tools.prototype_validators.labels import (
    ACCOUNTING_CATEGORIES,
    CONTACT_ROLES,
    PUBLISH_CHANNELS,
    PUBLISH_STATUSES,
    SYSTEM_PERMISSIONS,
    TEMPLE_ROLES,
    groups_are_disjoint,
    is_staffing_content_admin_setting,
)


class LabelClassificationTests(unittest.TestCase):
    def test_publish_channels_are_not_publish_statuses(self):
        self.assertTrue(groups_are_disjoint(PUBLISH_CHANNELS, PUBLISH_STATUSES))
        self.assertIn("LINE", PUBLISH_CHANNELS)
        self.assertIn("不正式發送", PUBLISH_STATUSES)

    def test_system_permissions_are_not_temple_roles(self):
        self.assertTrue(groups_are_disjoint(SYSTEM_PERMISSIONS, TEMPLE_ROLES))
        self.assertIn("admin", SYSTEM_PERMISSIONS)
        self.assertIn("總幹事", TEMPLE_ROLES)

    def test_contact_roles_are_separate_from_system_permissions(self):
        self.assertTrue(groups_are_disjoint(CONTACT_ROLES, SYSTEM_PERMISSIONS))
        self.assertIn("聯絡窗口", CONTACT_ROLES)
        self.assertIn("viewer", SYSTEM_PERMISSIONS)

    def test_accounting_categories_are_not_publish_channels(self):
        self.assertTrue(groups_are_disjoint(ACCOUNTING_CATEGORIES, PUBLISH_CHANNELS))
        self.assertIn("發財金還金", ACCOUNTING_CATEGORIES)

    def test_specific_term_data_is_not_admin_setting_content(self):
        self.assertTrue(is_staffing_content_admin_setting("職務任期"))
        self.assertTrue(is_staffing_content_admin_setting("具體人員任期"))
        self.assertFalse(is_staffing_content_admin_setting("發布管道設定"))


if __name__ == "__main__":
    unittest.main()
