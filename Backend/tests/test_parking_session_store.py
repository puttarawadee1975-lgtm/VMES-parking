import re
import unittest
from unittest.mock import MagicMock

from Backend.parking_session_store import apply_session_transition


class TestParkingSessionStore(unittest.TestCase):

    def setUp(self):
        self.client = MagicMock()
        mongo_session = self.client.start_session.return_value.__enter__.return_value
        mongo_session.with_transaction.side_effect = (
            lambda callback: callback(mongo_session)
        )
        self.sessions = MagicMock()
        self.occupancy = MagicMock()

        self.sessions.find_one.return_value = None
        self.sessions.update_one.return_value.matched_count = 0
        self.sessions.update_one.return_value.upserted_id = "new-session"

        self.occupancy.find_one.return_value = {
            "_id": "zone-a-id",
            "zone": "Zone A (Building 1 - Car)",
            "total_slots": 10,
            "occupied_slots": 7,
        }
        self.occupancy.update_one.return_value.matched_count = 1

    def test_first_entry(self):
        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone A", "ENTRY"
        )
        self.assertEqual(action["action"], "ENTER")
        self.occupancy.update_one.assert_called_once()

    def test_duplicate_entry(self):
        self.sessions.find_one.return_value = {"state": "PARKED"}

        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone A", "ENTRY"
        )

        self.assertEqual(action["action"], "DUPLICATE")
        self.occupancy.update_one.assert_not_called()

    def test_unknown_exit(self):
        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone A", "EXIT"
        )

        self.assertEqual(action["action"], "UNKNOWN_EXIT")
        self.occupancy.update_one.assert_not_called()

    def test_valid_exit(self):
        self.sessions.find_one.return_value = {"state": "PARKED"}
        self.sessions.update_one.return_value.matched_count = 1
        self.sessions.update_one.return_value.upserted_id = None

        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone A", "EXIT"
        )

        self.assertEqual(action["action"], "EXIT")
        self.occupancy.update_one.assert_called_once()
        update = self.occupancy.update_one.call_args.args[1]["$set"]
        self.assertEqual(update["occupied_slots"], 6)
        self.assertEqual(update["available_slots"], 4)

    def test_reentry_after_exit(self):
        self.sessions.find_one.return_value = {"state": "EXITED"}
        self.sessions.update_one.return_value.matched_count = 1
        self.sessions.update_one.return_value.upserted_id = None

        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone A", "ENTRY"
        )

        self.assertEqual(action["action"], "ENTER")
        self.occupancy.update_one.assert_called_once()
        update = self.occupancy.update_one.call_args.args[1]["$set"]
        self.assertEqual(update["occupied_slots"], 8)
        self.assertEqual(update["available_slots"], 2)

    def test_occupancy_update_failure(self):
        self.occupancy.update_one.return_value.matched_count = 0

        with self.assertRaises(RuntimeError):
            apply_session_transition(
                self.client, self.sessions, self.occupancy,
                "กพ-1687", "Zone A", "ENTRY"
            )

    def test_transaction_exception_propagates(self):
        self.occupancy.update_one.side_effect = RuntimeError(
            "Simulated MongoDB write failure"
        )

        with self.assertRaisesRegex(
            RuntimeError, "Simulated MongoDB write failure"
        ):
            apply_session_transition(
                self.client, self.sessions, self.occupancy,
                "กพ-1687", "Zone A", "ENTRY"
            )

        self.client.start_session.assert_called_once()

    def test_exit_uses_original_entry_zone(self):
        self.sessions.find_one.return_value = {
            "state": "PARKED",
            "zone": "Zone A",
        }
        self.sessions.update_one.return_value.matched_count = 1
        self.sessions.update_one.return_value.upserted_id = None

        action = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone C", "EXIT"
        )

        self.assertEqual(action["action"], "EXIT")
        self.assertEqual(action["zone"], "Zone A")

        zone_filter = self.occupancy.find_one.call_args.args[0]
        self.assertIn(re.escape("Zone A"), zone_filter["zone"]["$regex"])
        self.assertNotIn(re.escape("Zone C"), zone_filter["zone"]["$regex"])

        update = self.occupancy.update_one.call_args.args[1]["$set"]
        self.assertEqual(update["occupied_slots"], 6)
        self.assertEqual(update["available_slots"], 4)

    def test_reentry_into_different_zone(self):
        self.sessions.find_one.return_value = {
            "state": "EXITED",
            "zone": "Zone A",
        }
        self.sessions.update_one.return_value.matched_count = 1
        self.sessions.update_one.return_value.upserted_id = None

        result = apply_session_transition(
            self.client, self.sessions, self.occupancy,
            "กพ-1687", "Zone C", "ENTRY"
        )

        self.assertEqual(result["action"], "ENTER")
        self.assertEqual(result["zone"], "Zone C")

        session_update = self.sessions.update_one.call_args.args[1]["$set"]
        self.assertEqual(session_update["state"], "PARKED")
        self.assertEqual(session_update["zone"], "Zone C")

        zone_filter = self.occupancy.find_one.call_args.args[0]
        self.assertIn(re.escape("Zone C"), zone_filter["zone"]["$regex"])

    def test_full_capacity_rejected(self):
        self.occupancy.find_one.return_value["occupied_slots"] = 10

        with self.assertRaises(ValueError):
            apply_session_transition(
                self.client, self.sessions, self.occupancy,
                "กพ-1687", "Zone A", "ENTRY"
            )


if __name__ == "__main__":
    unittest.main()
