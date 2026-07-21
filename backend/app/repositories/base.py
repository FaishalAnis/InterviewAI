from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from bson import ObjectId
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorCollection

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    def _convert_id(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if item and "_id" in item:
            item["id"] = str(item.pop("_id"))
        return item

    async def _get_id_query(self, id: str) -> Dict[str, Any]:
        # Direct string search first
        doc = await self.collection.find_one({"_id": id})
        if doc:
            return {"_id": id}
        # Fallback to ObjectId search
        try:
            return {"_id": ObjectId(id)}
        except Exception:
            return {"_id": id}

    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        query = await self._get_id_query(id)
        doc = await self.collection.find_one(query)
        return self._convert_id(doc)

    async def get_by_field(self, field_name: str, value: Any) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({field_name: value})
        return self._convert_id(doc)

    async def get_multi(
        self, *, skip: int = 0, limit: int = 100, query: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        query = query or {}
        cursor = self.collection.find(query).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._convert_id(doc) for doc in docs]

    async def create(self, obj_in: Dict[str, Any]) -> Dict[str, Any]:
        # Handle string or dict
        if "id" in obj_in and "_id" not in obj_in:
            obj_in["_id"] = obj_in.pop("id")
        result = await self.collection.insert_one(obj_in)
        created_doc = await self.collection.find_one({"_id": result.inserted_id})
        return self._convert_id(created_doc)

    async def update(self, id: str, obj_in: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        query = await self._get_id_query(id)
        await self.collection.update_one(query, {"$set": obj_in})
        updated_doc = await self.collection.find_one(query)
        return self._convert_id(updated_doc)

    async def remove(self, id: str) -> bool:
        query = await self._get_id_query(id)
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0
