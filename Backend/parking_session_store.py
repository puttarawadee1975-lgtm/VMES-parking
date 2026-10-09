"""MongoDB-backed parking-session transitions.

This module does not connect to MongoDB automatically.
Callers must explicitly supply collections and a client.
"""

import re
from datetime import datetime, timezone

from parking_sessions import (
    normalize_plate,
    evaluate_transition,
    occupancy_delta,
    transition_filter,
)


def apply_session_transition(
    client,
    sessions_collection,
    occupancy_collection,
    plate,
    zone,
    gate_type,
):
    """Atomically update a known vehicle session and parking occupancy.

    Requires a unique index on plate_key.
    The caller must establish that the target zone exists.

    Unknown EXIT events do not change occupancy.
    """
    plate_key = normalize_plate(plate)

    if not plate_key:
        raise ValueError("A valid license plate is required")

    if not zone:
        raise ValueError("A parking zone is required")

    now = datetime.now(timezone.utc)

    def transaction_callback(session):
        key = {"plate_key": plate_key}

        existing = sessions_collection.find_one(key, session=session)
        current_state = existing.get("state") if existing else None

        action = evaluate_transition(current_state, gate_type)
        delta = occupancy_delta(action)
        occupancy_zone = (
            existing.get("zone") or zone
            if existing and current_state == "PARKED"
            else zone
        )

        if action in {"ENTER", "EXIT"}:
            next_state = "PARKED" if action == "ENTER" else "EXITED"

            session_filter = transition_filter(plate, current_state)
            result = sessions_collection.update_one(
                session_filter,
                {
                    "$set": {
                        "state": next_state,
                        "zone": occupancy_zone,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "plate_key": plate_key,
                        "created_at": now,
                    },
                },
                upsert=(existing is None),
                session=session,
            )

            if result.matched_count != 1 and result.upserted_id is None:
                raise RuntimeError("Concurrent vehicle-session change detected")

            zone_doc = occupancy_collection.find_one(
                {"zone": {"$regex": f"^{re.escape(occupancy_zone)}($|[^A-Za-z0-9])", "$options": "i"}},
                session=session,
            )

            if zone_doc is None:
                raise ValueError(f"Parking zone not found: {zone}")

            total = int(zone_doc.get("total_slots", 0))
            occupied = int(zone_doc.get("occupied_slots", 0))
            next_occupied = occupied + delta

            if not 0 <= next_occupied <= total:
                raise ValueError(
                    f"Occupancy limit reached for {zone}: "
                    f"{occupied} + ({delta}), capacity {total}"
                )

            result = occupancy_collection.update_one(
                {"_id": zone_doc["_id"]},
                {
                    "$set": {
                        "occupied_slots": next_occupied,
                        "available_slots": total - next_occupied,
                        "occupied": next_occupied,
                        "available": total - next_occupied,
                        "last_updated": now,
                    }
                },
                session=session,
            )

            if result.matched_count != 1:
                raise RuntimeError("Parking occupancy update failed")

        return {"action": action, "zone": occupancy_zone}

    with client.start_session() as session:
        return session.with_transaction(transaction_callback)


def ensure_session_indexes(sessions_collection):
    """Enforce one session document per normalized license plate."""
    return sessions_collection.create_index(
        [("plate_key", 1)],
        unique=True,
        name="unique_plate_session",
    )
