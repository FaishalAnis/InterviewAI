import asyncio
from app.core.celery import celery_app
from app.services.ai_service import ai_service
from app.repositories.interview import InterviewRepository
from app.repositories.report import ReportRepository
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.logger import logger
from datetime import datetime

def run_async(coro):
    """
    Helper to run asynchronous coroutines inside synchronous Celery worker processes.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

@celery_app.task(name="generate_report_task")
def generate_report_task(interview_id: str):
    logger.info(f"[Celery] Received task to generate report for interview: {interview_id}")
    return run_async(async_generate_report(interview_id))

async def async_generate_report(interview_id: str):
    # Ensure database connection is active in the celery process context
    from app.core.database import db_instance
    is_worker_db_session = False
    if db_instance.client is None:
        await connect_to_mongo()
        is_worker_db_session = True
    
    try:
        interview_repo = InterviewRepository()
        report_repo = ReportRepository()
        
        # 1. Fetch interview details
        interview = await interview_repo.get(interview_id)
        if not interview:
            logger.error(f"Interview {interview_id} not found in database.")
            return False

        # 2. Invoke AI service to compile summary, score breakdown, and improvement lists
        report_data = await ai_service.generate_final_report(interview)
        
        # 3. Formulate confidence and speaking speed timelines based on responses
        confidence_timeline = []
        speaking_speed_timeline = []
        
        for idx, resp in enumerate(interview.get("responses", [])):
            q_label = f"Q{idx+1}"
            has_ans = bool(resp.get("answer_text", "").strip())
            
            # Confidence score
            webcam = resp.get("webcam_metrics") or {}
            conf_val = webcam.get("confidence_estimate")
            if conf_val is None:
                conf_val = 75.0 if has_ans else 0.0
            confidence_timeline.append({"label": q_label, "value": max(0.0, float(conf_val))})
            
            # Speaking speed
            speed_val = webcam.get("speaking_speed_wpm")
            if speed_val is None:
                speed_val = 130.0 if has_ans else 0.0
            speaking_speed_timeline.append({"label": q_label, "value": max(0.0, float(speed_val))})
            
        report_data["confidence_timeline"] = confidence_timeline
        report_data["speaking_speed_timeline"] = speaking_speed_timeline
        report_data["interview_id"] = interview_id
        report_data["user_id"] = interview["user_id"]
        report_data["tab_switch_violations"] = interview.get("tab_switch_violations", 0)
        report_data["created_at"] = datetime.utcnow()

        # Map question detailed critique into report fields
        question_evals = []
        for idx, resp in enumerate(interview.get("responses", [])):
            eval_data = resp.get("evaluation") or {}
            score_val = eval_data.get("score")
            if score_val is None:
                score_val = 75.0
            question_evals.append({
                "question_id": resp.get("question_id"),
                "question_text": resp.get("question_text"),
                "user_answer": resp.get("answer_text"),
                "score": float(score_val),
                "feedback": eval_data.get("feedback") or "No feedback provided.",
                "strengths": eval_data.get("strengths") or [],
                "weaknesses": eval_data.get("weaknesses") or [],
                "suggested_answer": eval_data.get("suggested_answer") or "No suggested answer."
            })
            
        report_data["question_evaluations"] = question_evals
        
        # 4. Check if report already exists, then update or create
        existing_report = await report_repo.get_by_interview(interview_id)
        if existing_report:
            await report_repo.update(existing_report["id"], report_data)
            logger.info(f"Updated existing report for interview: {interview_id}")
        else:
            await report_repo.create(report_data)
            logger.info(f"Created new report for interview: {interview_id}")
            
        return True
    except Exception as e:
        logger.error(f"Error during report compilation task: {e}")
        return False
    finally:
        if is_worker_db_session:
            await close_mongo_connection()
