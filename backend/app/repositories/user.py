from typing import Optional, Dict, Any
from app.repositories.base import BaseRepository
from app.core.database import get_users_collection, get_profiles_collection
from app.core.security import get_password_hash
from datetime import datetime
from bson import ObjectId

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_users_collection())
        self.profile_collection = get_profiles_collection()

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.get_by_field("email", email)

    async def create_user(self, user_in: Dict[str, Any]) -> Dict[str, Any]:
        user_data = user_in.copy()
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        user_data["is_verified"] = False
        
        created = await self.create(user_data)
        
        # Create user profile automatically
        profile_data = {
            "user_id": created["id"],
            "skills": [],
            "experience_years": 0.0,
            "education": [],
            "projects": [],
            "avatar_url": None,
            "streak": 0,
            "last_interview_date": None
        }
        await self.profile_collection.insert_one(profile_data)
        
        return created

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        profile = await self.profile_collection.find_one({"user_id": user_id})
        if profile and "_id" in profile:
            profile["id"] = str(profile.pop("_id"))
        return profile

    async def update_profile(self, user_id: str, profile_in: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        await self.profile_collection.update_one(
            {"user_id": user_id},
            {"$set": profile_in}
        )
        return await self.get_profile(user_id)

    async def update_streak(self, user_id: str) -> None:
        profile = await self.get_profile(user_id)
        if not profile:
            return
        
        now = datetime.utcnow()
        last_date = profile.get("last_interview_date")
        streak = profile.get("streak", 0)
        
        if last_date:
            # calculate difference in days
            diff = (now.date() - last_date.date()).days
            if diff == 1:
                streak += 1
            elif diff > 1:
                streak = 1
        else:
            streak = 1
            
        await self.profile_collection.update_one(
            {"user_id": user_id},
            {"$set": {"streak": streak, "last_interview_date": now}}
        )
