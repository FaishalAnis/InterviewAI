from datetime import timedelta
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
    get_password_hash
)
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserResponse, Token, ProfileUpdate
from app.api.deps import get_current_user
from app.core.logger import logger

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate) -> Any:
    user_repo = UserRepository()
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await user_repo.create_user(user_in.dict())
    return user

@router.post("/login", response_model=Token)
async def login(
    email: str = Body(...),
    password: str = Body(...),
    remember_me: bool = Body(False)
) -> Any:
    user_repo = UserRepository()
    user = await user_repo.get_by_email(email)
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    if remember_me:
        # Increase token expiration for remember me
        access_token_expires = timedelta(days=7)

    access_token = create_access_token(user["id"], expires_delta=access_token_expires)
    refresh_token = create_refresh_token(user["id"])
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str = Body(..., embed=True)) -> Any:
    payload = decode_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user information"
        )
        
    user_repo = UserRepository()
    user = await user_repo.get(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not active or not found"
        )
        
    access_token = create_access_token(user["id"])
    new_refresh_token = create_refresh_token(user["id"])
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    return current_user

@router.get("/me/profile")
async def get_me_profile(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_repo = UserRepository()
    profile = await user_repo.get_profile(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/me/profile")
async def update_me_profile(
    profile_in: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_repo = UserRepository()
    profile = await user_repo.update_profile(current_user["id"], profile_in.dict(exclude_unset=True))
    return profile

@router.put("/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_repo = UserRepository()
    if not verify_password(current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    hashed_pwd = get_password_hash(new_password)
    await user_repo.update(current_user["id"], {"hashed_password": hashed_pwd})
    return {"message": "Password changed successfully"}

@router.delete("/delete-account")
async def delete_account(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_repo = UserRepository()
    # Delete profile and user
    await user_repo.profile_collection.delete_one({"user_id": current_user["id"]})
    await user_repo.remove(current_user["id"])
    return {"message": "Account deleted successfully"}

# Dummy password recovery and email verification endpoints
@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)) -> Any:
    logger.info(f"Password reset link requested for email: {email}")
    return {"message": "Password reset code sent if email exists."}

@router.post("/reset-password")
async def reset_password(token: str = Body(...), password: str = Body(...)) -> Any:
    logger.info(f"Password reset completed with verification token.")
    return {"message": "Password has been reset successfully."}

@router.get("/verify-email")
async def verify_email(token: str) -> Any:
    logger.info(f"Email verified with verification token {token}.")
    return {"message": "Email verified successfully."}
