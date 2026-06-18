import unittest

from tools.prototype_validators.relationships import (
    RelationshipValidationError,
    duty_candidates_from_rosters,
    validate_duty_roster,
)


class DutyRosterTests(unittest.TestCase):
    def test_duty_person_must_be_team_member(self):
        roster = {"team_member_id": "team-001", "duty_start_date": "2026-06-18", "duty_end_date": "2026-06-18"}
        validate_duty_roster(roster, {"team-001"})
        with self.assertRaises(RelationshipValidationError):
            validate_duty_roster({**roster, "team_member_id": "member-001"}, {"team-001"})

    def test_end_date_must_not_be_before_start_date(self):
        with self.assertRaises(RelationshipValidationError):
            validate_duty_roster(
                {"team_member_id": "team-001", "duty_start_date": "2026-06-20", "duty_end_date": "2026-06-19"},
                {"team-001"},
            )

    def test_duty_candidates_come_from_rosters(self):
        rosters = [
            {"team_member_id": "team-001", "duty_start_date": "2026-06-18", "duty_end_date": "2026-06-18"},
            {"team_member_id": "team-002", "duty_start_date": "2026-06-19", "duty_end_date": "2026-06-19"},
        ]
        self.assertEqual(duty_candidates_from_rosters(rosters, {"team-001", "team-002"}), {"team-001", "team-002"})


if __name__ == "__main__":
    unittest.main()

