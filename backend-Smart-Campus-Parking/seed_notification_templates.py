import os
from database import notification_templates_collection

DEFAULT_TEMPLATES = [
    {
        "type": "vmes_parking_30min_warning",
        "name": "30-Minute Grace Period Warning",
        "title": "VMES Car Parking Limit: 30 Mins Max",
        "message": "Student car parking at VMES is permitted for up to 30 minutes before 16:30 on weekdays. Exceeding 30 minutes for cars will result in a 10-point safety deduction. Motorcycles park free & unlimited anytime.",
        "category": "Parking Alert",
        "description": "Sent once per day when a student car enters or saves a spot at VMES building during weekday peak hours."
    },
    {
        "type": "vmes_overtime_penalty",
        "name": "Car Overtime Penalty (-10 Points)",
        "title": "VMES Car Parking Overtime (-10 Points)",
        "message": "Exceeded the 30-minute weekday car parking limit at VMES Building before 16:30. 10 safety driving points have been deducted.",
        "category": "Safety Alert",
        "scoreDeducted": 10,
        "description": "Sent when student car stays parked for more than 30 minutes before 16:30 on weekdays."
    },
    {
        "type": "helmet_violation",
        "name": "No Helmet Violation (-10 Points)",
        "title": "No Helmet Detected (-10 Points)",
        "message": "AI CCTV detected driving without a helmet at {gate_name} for plate {plate}. 10 safety points deducted.",
        "category": "Safety Alert",
        "scoreDeducted": 10,
        "description": "Sent 24/7 whenever CCTV AI detects a motorcycle driver without a helmet."
    }
]

def seed_templates():
    if notification_templates_collection is None:
        print("[SEED ERROR] Database connection unavailable.")
        return

    for tpl in DEFAULT_TEMPLATES:
        notification_templates_collection.update_one(
            {"type": tpl["type"]},
            {"$set": tpl},
            upsert=True
        )
        print(f"[SEED TEMPLATE] Successfully upserted template for '{tpl['type']}' in MongoDB Atlas")

if __name__ == "__main__":
    seed_templates()
