from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_users_collection
from app.core.security import get_password_hash
from app.core.logger import logger
from app.core.socketio import socket_app

# Middlewares
from app.middlewares.rate_limit import RateLimitMiddleware
from app.middlewares.security import SecurityHeadersMiddleware

# API Endpoints
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.interview import router as interview_router
from app.api.endpoints.coding import router as coding_router
from app.api.endpoints.report import router as report_router
from app.api.endpoints.resume import router as resume_router
from app.api.endpoints.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_to_mongo()
    await create_seed_admin()
    yield
    # Shutdown actions
    await close_mongo_connection()

async def create_seed_admin():
    # Seeds the initial superuser if not exists
    try:
        col = get_users_collection()
        admin_user = await col.find_one({"email": settings.FIRST_SUPERUSER_EMAIL})
        if not admin_user:
            logger.info("Creating seed superuser...")
            hashed_pw = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            superuser = {
                "email": settings.FIRST_SUPERUSER_EMAIL,
                "full_name": "Admin Superuser",
                "hashed_password": hashed_pw,
                "is_active": True,
                "is_superuser": True,
                "is_verified": True,
                "role": "admin"
            }
            await col.insert_one(superuser)
            logger.info("Seed superuser created successfully.")
    except Exception as e:
        logger.error(f"Failed to create seed superuser: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready AI Mock Interview Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply rate limiting & security headers
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Register routes
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(interview_router, prefix=f"{settings.API_V1_STR}/interview", tags=["interview"])
app.include_router(coding_router, prefix=f"{settings.API_V1_STR}/coding", tags=["coding"])
app.include_router(report_router, prefix=f"{settings.API_V1_STR}/report", tags=["report"])
app.include_router(resume_router, prefix=f"{settings.API_V1_STR}/resume", tags=["resume"])
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])

@app.get("/health", tags=["system"])
async def health_check():
    return JSONResponse(status_code=200, content={"status": "healthy"})

# Mount Socket.io ASGI app
app.mount("/", socket_app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
