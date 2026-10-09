"""Pure decision helpers for parking-session transitions.

This module does not connect to MongoDB or change parking occupancy.
"""

def normalize_plate(plate: str) -> str:
    """Normalize spacing and punctuation without removing Thai characters."""
    return "".join(char.upper() for char in (plate or "") if char.isalnum())


def evaluate_transition(current_state: str | None, gate_type: str) -> str:
    """Return the action for a vehicle's next gate event.

    States:
      None      = vehicle has no recorded session
      PARKED    = vehicle has an active parking session
      EXITED    = vehicle previously exited

    Actions:
      ENTER     = start a new parking session
      EXIT      = close an active parking session
      DUPLICATE = ignore a repeated event
      UNKNOWN_EXIT = exit received without a known active session
    """
    direction = (gate_type or "").strip().upper()

    if direction not in {"ENTRY", "EXIT"}:
        raise ValueError(f"Unsupported gate direction: {gate_type!r}")

    if current_state not in {None, "PARKED", "EXITED"}:
        raise ValueError(f"Unsupported session state: {current_state!r}")

    if direction == "ENTRY":
        return "DUPLICATE" if current_state == "PARKED" else "ENTER"

    if current_state == "PARKED":
        return "EXIT"

    return "UNKNOWN_EXIT" if current_state is None else "DUPLICATE"


def transition_filter(plate: str, current_state: str | None) -> dict:
    """Build a conditional MongoDB filter for a vehicle's current state."""
    normalized = normalize_plate(plate)

    if not normalized:
        raise ValueError("A non-empty license plate is required")

    if current_state is None:
        return {"plate_key": normalized, "state": {"$exists": False}}

    if current_state not in {"PARKED", "EXITED"}:
        raise ValueError(f"Unsupported session state: {current_state!r}")

    return {"plate_key": normalized, "state": current_state}


def occupancy_delta(action: str) -> int:
    """Return the occupancy change associated with a session action."""
    changes = {
        "ENTER": 1,
        "EXIT": -1,
        "DUPLICATE": 0,
        "UNKNOWN_EXIT": 0,
    }

    if action not in changes:
        raise ValueError(f"Unsupported session action: {action!r}")

    return changes[action]
