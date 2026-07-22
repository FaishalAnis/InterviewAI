from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from jwt import PyJWTError as JWTError
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Use native bcrypt checkpw first to bypass passlib 1.7.4 + bcrypt 4.x __about__ bug
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    try:
        pw_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")
    except Exception:
        return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "access":
            return None
        return decoded
    except JWTError:
        return None

def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded = jwt.decode(token, settings.REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "refresh":
            return None
        return decoded
    except JWTError:
        return None
