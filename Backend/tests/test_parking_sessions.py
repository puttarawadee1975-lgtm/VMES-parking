import unittest

from Backend.parking_sessions import normalize_plate, evaluate_transition, transition_filter


class TestParkingSessions(unittest.TestCase):

    def test_plate_normalization(self):
        self.assertEqual(normalize_plate("กพ-1687"), "กพ1687")
        self.assertEqual(normalize_plate("กพ 1687"), "กพ1687")
        self.assertEqual(normalize_plate("abc-1234"), "ABC1234")

    def test_first_entry(self):
        self.assertEqual(evaluate_transition(None, "ENTRY"), "ENTER")

    def test_duplicate_entry(self):
        self.assertEqual(evaluate_transition("PARKED", "ENTRY"), "DUPLICATE")

    def test_valid_exit(self):
        self.assertEqual(evaluate_transition("PARKED", "EXIT"), "EXIT")

    def test_duplicate_exit(self):
        self.assertEqual(evaluate_transition("EXITED", "EXIT"), "DUPLICATE")

    def test_reentry(self):
        self.assertEqual(evaluate_transition("EXITED", "ENTRY"), "ENTER")

    def test_unknown_exit(self):
        self.assertEqual(evaluate_transition(None, "EXIT"), "UNKNOWN_EXIT")

    def test_complete_vehicle_lifecycle(self):
        state = None

        events = [
            ("ENTRY", "ENTER", "PARKED"),
            ("ENTRY", "DUPLICATE", "PARKED"),
            ("EXIT", "EXIT", "EXITED"),
            ("EXIT", "DUPLICATE", "EXITED"),
            ("ENTRY", "ENTER", "PARKED"),
        ]

        for direction, expected_action, next_state in events:
            self.assertEqual(
                evaluate_transition(state, direction),
                expected_action
            )
            state = next_state

    def test_transition_filter_new_vehicle(self):
        self.assertEqual(
            transition_filter("กพ-1687", None),
            {"plate_key": "กพ1687", "state": {"$exists": False}}
        )

    def test_transition_filter_existing_vehicle(self):
        self.assertEqual(
            transition_filter("abc-1234", "PARKED"),
            {"plate_key": "ABC1234", "state": "PARKED"}
        )

    def test_transition_filter_empty_plate(self):
        with self.assertRaises(ValueError):
            transition_filter("", None)

    def test_transition_filter_punctuation_only_plate(self):
        with self.assertRaises(ValueError):
            transition_filter("---   ", None)

    def test_invalid_direction(self):
        with self.assertRaises(ValueError):
            evaluate_transition("PARKED", "INVALID")


if __name__ == "__main__":
    unittest.main()
