from typing import Optional, Dict, Any, List
from bson import ObjectId
from datetime import datetime
from app.repositories.base import BaseRepository
from app.core.database import get_interviews_collection

class InterviewRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_interviews_collection())

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._convert_id(doc) for doc in docs]

    async def add_response(self, interview_id: str, response: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Append response to responses array, increment current_question_index
        try:
            query = {"_id": ObjectId(interview_id)}
        except Exception:
            query = {"_id": interview_id}
            
        await self.collection.update_one(
            query,
            {
                "$push": {"responses": response},
                "$inc": {"current_question_index": 1}
            }
        )
        return await self.get(interview_id)

    async def complete_interview(self, interview_id: str, tab_switches: Optional[int] = None) -> Optional[Dict[str, Any]]:
        try:
            query = {"_id": ObjectId(interview_id)}
        except Exception:
            query = {"_id": interview_id}
            
        update_doc = {
            "status": "completed",
            "completed_at": datetime.utcnow()
        }
        if tab_switches is not None:
            update_doc["tab_switch_violations"] = tab_switches

        await self.collection.update_one(
            query,
            {
                "$set": update_doc
            }
        )
        return await self.get(interview_id)
