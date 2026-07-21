from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.logger import logger

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    logger.info("Connected to MongoDB successfully.")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
    logger.info("MongoDB connection closed.")

def get_db():
    return db_instance.db

# Collection Helper Accessors
def get_users_collection():
    return db_instance.db["users"]

def get_profiles_collection():
    return db_instance.db["profiles"]

def get_interviews_collection():
    return db_instance.db["interviews"]

def get_questions_collection():
    return db_instance.db["questions"]

def get_responses_collection():
    return db_instance.db["responses"]

def get_reports_collection():
    return db_instance.db["reports"]

def get_resumes_collection():
    return db_instance.db["resumes"]

def get_job_descriptions_collection():
    return db_instance.db["job_descriptions"]

def get_analytics_collection():
    return db_instance.db["analytics"]

def get_notifications_collection():
    return db_instance.db["notifications"]

def get_sessions_collection():
    return db_instance.db["sessions"]

def get_tokens_collection():
    return db_instance.db["tokens"]

def get_audit_logs_collection():
    return db_instance.db["audit_logs"]
