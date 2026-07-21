import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import get_password_hash
from app.core.config import settings

async def seed_data():
    print("Connecting to database for seeding...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # Purge collections first
    print("Purging existing collections...")
    await db["users"].delete_many({})
    await db["profiles"].delete_many({})
    await db["interviews"].delete_many({})
    await db["reports"].delete_many({})

    # 1. Create candidate user
    print("Seeding users...")
    candidate_id = "60c72b2f9b1d8a25c8e3b2a2"
    hashed_pwd = get_password_hash("CandidatePassword123!")
    candidate = {
        "_id": candidate_id,
        "email": "candidate@interviewai.com",
        "full_name": "Sarah Connor",
        "hashed_password": hashed_pwd,
        "is_active": True,
        "is_superuser": False,
        "role": "user",
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db["users"].insert_one(candidate)

    # 2. Create Candidate profile
    print("Seeding profiles...")
    profile = {
        "user_id": candidate_id,
        "skills": ["Python", "React", "TypeScript", "Docker", "Machine Learning"],
        "experience_years": 4.5,
        "education": ["BS Computer Science", "MS Data Science"],
        "projects": ["DeepFace - Real-time expression model", "FastAPI microservices pipeline"],
        "avatar_url": None,
        "streak": 3,
        "last_interview_date": datetime.utcnow() - timedelta(days=1)
    }
    await db["profiles"].insert_one(profile)

    # 3. Seed sample completed interview
    print("Seeding interviews...")
    interview_id = "60c72b2f9b1d8a25c8e3b2a5"
    interview = {
        "_id": interview_id,
        "user_id": candidate_id,
        "interview_type": "AI/ML Engineer",
        "difficulty": "Medium",
        "mode": "voice",
        "status": "completed",
        "questions": [
            {
                "id": "q1",
                "text": "What is the difference between supervised and unsupervised learning?",
                "category": "technical",
                "difficulty": "Medium",
                "expected_criteria": ["labeled data", "regression", "clustering", "k-means"]
            },
            {
                "id": "q2",
                "text": "Describe a challenging conflict you solved inside your engineering team.",
                "category": "behavioral",
                "difficulty": "Medium",
                "expected_criteria": ["resolution", "collaboration", "active listening"]
            }
        ],
        "responses": [
            {
                "question_id": "q1",
                "question_text": "What is the difference between supervised and unsupervised learning?",
                "answer_text": "Supervised learning models use labeled training data to predict outcomes, whereas unsupervised models look for patterns in unlabeled datasets.",
                "evaluation": {
                    "score": 90.0,
                    "feedback": "Perfect description of the two conceptual classes. Clear distinction on labeling requirements.",
                    "strengths": ["Clear definitions", "Accurate data contrast"],
                    "weaknesses": [],
                    "suggested_answer": "Supervised uses maps of input-output labels; unsupervised computes vectors coordinates directly."
                },
                "webcam_metrics": {
                    "eye_contact_score": 92.0,
                    "smile_frequency_score": 20.0,
                    "posture_score": 85.0,
                    "speaking_speed_wpm": 130.0,
                    "confidence_estimate": 90.0
                },
                "timestamp": datetime.utcnow() - timedelta(hours=2)
            },
            {
                "question_id": "q2",
                "question_text": "Describe a challenging conflict you solved inside your engineering team.",
                "answer_text": "We disagreed on using MongoDB vs SQL. I gathered research, held a meeting, and compared write trade-offs before deciding together.",
                "evaluation": {
                    "score": 80.0,
                    "feedback": "Good context, but could frame more metrics using the STAR framework format.",
                    "strengths": ["Structured decision outline"],
                    "weaknesses": ["Needs more explicit detail on team feedback dynamics"],
                    "suggested_answer": "Clearly specify the Situation, Task, Action, and ultimate Results."
                },
                "webcam_metrics": {
                    "eye_contact_score": 85.0,
                    "smile_frequency_score": 10.0,
                    "posture_score": 90.0,
                    "speaking_speed_wpm": 120.0,
                    "confidence_estimate": 85.0
                },
                "timestamp": datetime.utcnow() - timedelta(hours=2)
            }
        ],
        "current_question_index": 2,
        "created_at": datetime.utcnow() - timedelta(hours=2),
        "completed_at": datetime.utcnow() - timedelta(hours=1)
    }
    await db["interviews"].insert_one(interview)

    # 4. Seed sample completed report
    print("Seeding reports...")
    report = {
        "interview_id": interview_id,
        "user_id": candidate_id,
        "summary": "Sarah displays strong AI/ML foundations. Technical terminology was concise and clear. Communication speed was moderate with good posture. Gaps are present in behavioral STAR formulation.",
        "scores": {
            "overall": 85.0,
            "communication": 83.0,
            "technical": 88.0,
            "problem_solving": 85.0,
            "confidence": 88.0,
            "grammar": 95.0,
            "vocabulary": 90.0,
            "body_language": 85.0,
            "speaking_speed": 82.0,
            "response_quality: ": 85.0,
            "depth_of_knowledge": 86.0
        },
        "strengths": [
            "Accurate differentiation of linear algebra and machine learning concepts.",
            "Solid confidence and gaze tracking values maintained.",
            "Very high grammatical accuracy."
        ],
        "weaknesses": [
            "Behavioral answers should include concrete metrics and target results.",
            "A few hesitations when explaining write trade-offs."
        ],
        "mistakes": [
            "Omitted explaining model validation phases in supervised learning description."
        ],
        "recommended_topics": [
            "STAR alignment for behavioral interviews",
            "Non-verbal interview confidence mechanics"
        ],
        "recommended_resources": [
            "Book: Cracking the Coding Interview by Gayle Laakmann McDowell",
            "Article: 'The STAR Method Explained' on ResumeGenius"
        ],
        "confidence_timeline": [
            {"label": "Q1", "value": 90.0},
            {"label": "Q2", "value": 85.0}
        ],
        "speaking_speed_timeline": [
            {"label": "Q1", "value": 130.0},
            {"label": "Q2", "value": 120.0}
        ],
        "actionable_improvement_plan": [
            "Prepare STAR templates for past conflicts.",
            "Maintain eye level webcam tracking to keep gaze lines flat."
        ],
        "created_at": datetime.utcnow() - timedelta(hours=1)
    }
    await db["reports"].insert_one(report)

    print("Seed script completed successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
