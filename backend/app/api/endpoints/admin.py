from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.api.deps import get_current_active_admin
from app.repositories.user import UserRepository
from app.core.database import get_interviews_collection, get_reports_collection
from app.core.logger import logger

router = APIRouter()

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_active_admin)
) -> Any:
    user_repo = UserRepository()
    users = await user_repo.get_multi(skip=skip, limit=limit)
    # Strip passwords
    for user in users:
        user.pop("hashed_password", None)
    return users

@router.put("/users/{id}/ban")
async def toggle_ban_user(
    id: str,
    ban: bool = Body(..., embed=True),
    admin: dict = Depends(get_current_active_admin)
) -> Any:
    user_repo = UserRepository()
    user = await user_repo.get(id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated = await user_repo.update(id, {"is_active": not ban})
    status_str = "banned" if ban else "activated"
    logger.info(f"Admin action: User {id} has been {status_str}.")
    return {"message": f"User status updated to {status_str}.", "user_id": id, "active": not ban}

@router.get("/analytics")
async def get_system_analytics(
    admin: dict = Depends(get_current_active_admin)
) -> Any:
    user_repo = UserRepository()
    
    # Calculate counts
    user_cursor = user_repo.collection.find({})
    user_count = await user_repo.collection.count_documents({})
    
    interview_col = get_interviews_collection()
    interview_count = await interview_col.count_documents({})
    
    report_col = get_reports_collection()
    reports_count = await report_col.count_documents({})
    
    # Simple simulated API log metrics
    api_usage_metrics = [
        {"timestamp": "09:00", "requests": 120},
        {"timestamp": "10:00", "requests": 250},
        {"timestamp": "11:00", "requests": 310},
        {"timestamp": "12:00", "requests": 400},
        {"timestamp": "13:00", "requests": 380},
        {"timestamp": "14:00", "requests": 420},
        {"timestamp": "15:00", "requests": 490}
    ]
    
    return {
        "metrics": {
            "total_users": user_count,
            "total_interviews": interview_count,
            "total_reports": reports_count,
            "api_health": "healthy",
            "active_ws_connections": 4
        },
        "usage_chart": api_usage_metrics
    }
