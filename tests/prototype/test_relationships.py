import unittest

from tools.prototype_validators.relationships import (
    RelationshipValidationError,
    build_announcement_from_temple,
    build_announcement_from_visit,
    build_visit_from_temple,
    validate_devotee_relationship,
    validate_temple,
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

    def test_visit_from_temple_carries_temple_id(self):
        self.assertEqual(build_visit_from_temple("temple-001", self.temple_ids), {"temple_id": "temple-001"})

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

