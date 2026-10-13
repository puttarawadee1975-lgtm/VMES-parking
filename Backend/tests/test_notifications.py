import unittest
from unittest.mock import MagicMock, patch
import sys
import types

class TestNotifications(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if "database" in sys.modules:
            sys.modules["database"].registered_vehicles_collection = MagicMock()
            sys.modules["database"].notifications_collection = MagicMock()
            sys.modules["database"].is_db_connected = MagicMock(return_value=True)
        else:
            database = types.ModuleType("database")
            database.registered_vehicles_collection = MagicMock()
            database.notifications_collection = MagicMock()
            database.is_db_connected = MagicMock(return_value=True)
            sys.modules["database"] = database

    def test_get_notifications_empty(self):
        from routers.mobile import get_user_notifications_endpoint
        with patch("database.notifications_collection.find") as mock_find:
            mock_find.return_value.sort.return_value.limit.return_value = []
            results = get_user_notifications_endpoint("nonexistent@au.edu")
            self.assertEqual(results, [])

    def test_get_notifications_results(self):
        from routers.mobile import get_user_notifications_endpoint
        with patch("database.notifications_collection.find") as mock_find:
            mock_find.return_value.sort.return_value.limit.return_value = [
                {
                    "_id": "670ab01234567890abcdef12",
                    "id": "NOTIF-001",
                    "user_email": "u6814509@au.edu",
                    "title": "Safety Alert: Helmet Violation Warning",
                    "message": "Helmet violation detected.",
                    "read": False
                }
            ]
            results = get_user_notifications_endpoint("u6814509@au.edu")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["id"], "NOTIF-001")
            self.assertEqual(results[0]["read"], False)

    def test_mark_notification_read(self):
        from routers.mobile import mark_notification_read
        with patch("database.notifications_collection.update_many") as mock_update:
            mock_update.return_value.modified_count = 1
            res = mark_notification_read({"id": "NOTIF-001"})
            self.assertEqual(res["status"], "success")
            mock_update.assert_called_once()
