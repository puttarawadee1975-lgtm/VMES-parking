import asyncio
import importlib
import sys
import types
import unittest
from unittest.mock import MagicMock, patch


class TestDetectionEndpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Prevent production database initialization before importing detection.
        database = types.ModuleType("database")

        for name in (
            "detection_logs_collection",
            "users_collection",
            "parking_status_collection",
            "parking_sessions_collection",
            "registered_vehicles_collection",
            "saved_spots_collection",
        ):
            setattr(database, name, MagicMock(name=name))

        database.get_mongo_client = MagicMock(return_value=MagicMock())
        database.is_db_connected = MagicMock(return_value=True)

        store = types.ModuleType("store")
        store.update_in_memory_parking_status = MagicMock()

        storage = types.ModuleType("storage")
        storage.SnapshotStorageError = type(
            "SnapshotStorageError", (Exception,), {}
        )
        storage.save_base64_snapshot = MagicMock(return_value=None)
        storage.resolve_snapshot_url = MagicMock(return_value=None)

        cls.original_modules = {
            name: sys.modules.get(name)
            for name in ("database", "store", "storage", "detection")
        }

        sys.modules["database"] = database
        sys.modules["store"] = store
        sys.modules["storage"] = storage
        sys.modules.pop("detection", None)

        cls.detection = importlib.import_module("detection")
        cls.database = database
        cls.store = store

    @classmethod
    def tearDownClass(cls):
        for name, original in cls.original_modules.items():
            if original is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = original

    def setUp(self):
        self.database.detection_logs_collection.reset_mock()
        self.database.detection_logs_collection.insert_one.return_value.inserted_id = (
            "mock_id"
        )
        self.store.update_in_memory_parking_status.reset_mock()

    def test_endpoint_exists(self):
        routes = [
            route.path
            for route in self.detection.router.routes
        ]
        self.assertIn("/detections", routes)

    def test_response_schema_has_session_action(self):
        from schemas import DetectionLogResponse

        self.assertIn(
            "parking_session_action",
            DetectionLogResponse.model_fields,
        )

    def test_session_transition_is_imported(self):
        self.assertTrue(
            callable(self.detection.apply_session_transition)
        )


    def _run_detection(self, action, gate_type="ENTRY"):
        from schemas import DetectionLogCreate

        payload = DetectionLogCreate(
            license_plate="TEST-1234",
            vehicle_type="car",
            camera_id="01" if gate_type == "ENTRY" else "02",
            gate_type=gate_type,
            zone="Zone A",
        )

        with patch.object(
            self.detection,
            "apply_session_transition",
            return_value={"action": action, "zone": "Zone A"},
        ):
            return asyncio.run(
                self.detection.ingest_detection_event(payload)
            )

    def test_accepted_entry(self):
        response = self._run_detection("ENTER")
        self.assertEqual(response.parking_session_action, "ENTER")
        self.store.update_in_memory_parking_status.assert_called_once()

    def test_duplicate_entry(self):
        response = self._run_detection("DUPLICATE")
        self.assertEqual(response.parking_session_action, "DUPLICATE")
        self.store.update_in_memory_parking_status.assert_not_called()

    def test_accepted_exit(self):
        response = self._run_detection("EXIT", gate_type="EXIT")
        self.assertEqual(response.parking_session_action, "EXIT")
        self.store.update_in_memory_parking_status.assert_called_once()

    def test_unknown_exit(self):
        response = self._run_detection("UNKNOWN_EXIT", gate_type="EXIT")
        self.assertEqual(response.parking_session_action, "UNKNOWN_EXIT")
        self.store.update_in_memory_parking_status.assert_not_called()

    def test_transaction_failure(self):
        from schemas import DetectionLogCreate

        payload = DetectionLogCreate(
            license_plate="TEST-1234",
            vehicle_type="car",
            camera_id="01",
            zone="Zone A",
        )

        with patch.object(
            self.detection,
            "apply_session_transition",
            side_effect=RuntimeError("Simulated transaction failure"),
        ):
            with self.assertRaises(RuntimeError):
                asyncio.run(
                    self.detection.ingest_detection_event(payload)
                )


if __name__ == "__main__":
    unittest.main()
