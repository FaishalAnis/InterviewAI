from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.repositories.base import BaseRepository
from app.core.database import get_reports_collection

class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_reports_collection())

    async def get_by_interview(self, interview_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"interview_id": interview_id})
        return self._convert_id(doc)

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._convert_id(doc) for doc in docs]
