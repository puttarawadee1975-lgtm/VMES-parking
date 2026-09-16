import os
from datetime import datetime, timezone
from database import users_collection, registered_vehicles_collection, db

def seed_u6814509_vehicle():
    email = "u6814509@au.edu"
    now = datetime.now(timezone.utc)
    
    front_url = "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80"
    side_url = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80"
    
    vehicle_doc = {
        "user_email": email,
        "role": "student",
        "plate": "3KH 5678",
        "province": "Bangkok",
        "vehicle_type": "car",
        "brand": "Honda",
        "model": "Civic RS",
        "color": "Black",
        "vehicle": "Honda Civic RS (Black)",
        "vehicle_photo_url": front_url,
        "front_photo_url": front_url,
        "side_photo_url": side_url,
        "registered_at": now
    }
    
    if registered_vehicles_collection is not None:
        res = registered_vehicles_collection.update_one(
            {"user_email": email, "plate": "3KH 5678"},
            {"$set": vehicle_doc},
            upsert=True
        )
        print(f"[SEED] Registered vehicle for {email} in registered_vehicles: matched={res.matched_count}, upserted={res.upserted_id}")
    
    if users_collection is not None:
        user_update = {
            "email": email,
            "name": "Student U6814509",
            "role": "student",
            "driving_score": 100,
            "reset_count": 0,
            "license_plate": "3KH 5678",
            "vehicles": [
                {
                    "plate": "3KH 5678",
                    "province": "Bangkok",
                    "vehicle_type": "car",
                    "brand": "Honda",
                    "model": "Civic RS",
                    "color": "Black",
                    "vehicle": "Honda Civic RS (Black)",
                    "vehicle_photo_url": front_url,
                    "front_photo_url": front_url,
                    "side_photo_url": side_url
                }
            ]
        }
        res_u = users_collection.update_one(
            {"email": email},
            {"$set": user_update},
            upsert=True
        )
        print(f"[SEED] Updated user profile for {email} in users collection: matched={res_u.matched_count}, upserted={res_u.upserted_id}")

if __name__ == "__main__":
    seed_u6814509_vehicle()
