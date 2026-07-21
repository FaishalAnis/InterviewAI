import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from app.api.deps import get_current_user
from app.repositories.interview import InterviewRepository
from app.repositories.user import UserRepository
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.services.ai_service import ai_service
from app.services.whisper_service import whisper_service
from app.services.video_analysis import webcam_analyzer
from app.services.storage_service import storage_service
from app.workers.tasks import generate_report_task
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
async def create_interview(
    interview_in: InterviewCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    # 1. Generate interview questions using AI service
    try:
        questions = await ai_service.generate_questions(
            interview_type=interview_in.interview_type,
            difficulty=interview_in.difficulty,
            resume_text=None,  # Resume parsing linked separately
            job_description=interview_in.job_description_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )

    # 2. Setup interview model document
    interview_doc = {
        "user_id": current_user["id"],
        "interview_type": interview_in.interview_type,
        "difficulty": interview_in.difficulty,
        "mode": interview_in.mode,
        "status": "started",
        "questions": questions,
        "responses": [],
        "current_question_index": 0,
        "created_at": datetime.utcnow()
    }
    
    interview_repo = InterviewRepository()
    created = await interview_repo.create(interview_doc)
    return created

@router.get("/history", response_model=List[Dict[str, Any]])
async def get_interview_history(
    skip: int = 0,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    interview_repo = InterviewRepository()
    interviews = await interview_repo.get_by_user(current_user["id"], skip=skip, limit=limit)
    return interviews

@router.get("/{id}", response_model=Dict[str, Any])
async def get_interview(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    interview_repo = InterviewRepository()
    interview = await interview_repo.get(id)
    if not interview or interview["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
    return interview

@router.post("/{id}/response")
async def submit_response(
    id: str,
    question_id: str = Form(...),
    answer_text: Optional[str] = Form(None),
    webcam_metrics_json: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    interview_repo = InterviewRepository()
    interview = await interview_repo.get(id)
    
    if not interview or interview["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )

    # Resolve question details
    questions = interview.get("questions", [])
    current_idx = interview.get("current_question_index", 0)
    
    if current_idx >= len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview already finished all questions."
        )

    target_question = questions[current_idx]
    if target_question["id"] != question_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mismatched active question ID."
        )

    # 1. Audio Processing & Transcription if file uploaded
    audio_url = None
    transcribed_text = answer_text or ""
    if audio_file:
        audio_bytes = await audio_file.read()
        # Save transcription
        transcribed_text = await whisper_service.transcribe_audio_bytes(
            audio_bytes,
            file_extension=audio_file.filename.split(".")[-1] if audio_file.filename else "webm"
        )
        # Upload audio to Cloudinary
        audio_url = await storage_service.upload_file(
            audio_bytes, 
            file_name=f"audio_q_{question_id}_{id}.webm", 
            folder="recordings"
        )

    if not transcribed_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No response provided. Submit audio file or plain answer text."
        )

    # 2. Evaluation
    evaluation = await ai_service.evaluate_response(target_question["text"], transcribed_text)

    # 3. Webcam calculations
    webcam_metrics = {}
    if webcam_metrics_json:
        try:
            raw_metrics = json.loads(webcam_metrics_json)
            webcam_metrics = await webcam_analyzer.analyze_frame_telemetry(raw_metrics)
        except Exception:
            webcam_metrics = webcam_analyzer.generate_default_metrics()
    else:
        webcam_metrics = webcam_analyzer.generate_default_metrics()

    # Create response document
    response_item = {
        "question_id": question_id,
        "question_text": target_question["text"],
        "answer_text": transcribed_text,
        "audio_url": audio_url,
        "evaluation": evaluation,
        "webcam_metrics": webcam_metrics,
        "timestamp": datetime.utcnow()
    }

    # Append response and move forward
    updated_interview = await interview_repo.add_response(id, response_item)
    
    # 4. Generate follow-up or next action
    follow_up_question = None
    # For conversational feel, 30% chance to generate a follow up if it's behavioral or technical, and we have more questions left
    if target_question["category"] != "coding" and current_idx < len(questions) - 1 and len(transcribed_text.split()) > 10:
        # Generate follow-up question
        follow_up_question = await ai_service.generate_follow_up_question(target_question["text"], transcribed_text)

    return {
        "interview": updated_interview,
        "evaluation": evaluation,
        "webcam_metrics": webcam_metrics,
        "follow_up_question": follow_up_question
    }

@router.post("/{id}/complete")
async def complete_interview(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    interview_repo = InterviewRepository()
    interview = await interview_repo.get(id)
    if not interview or interview["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )
        
    # Mark completed in DB
    completed = await interview_repo.complete_interview(id)
    
    # Update Streak
    user_repo = UserRepository()
    await user_repo.update_streak(current_user["id"])

    # Trigger Celery Worker background task for evaluation and PDF report generation
    # If Celery isn't running, generate_report_task can also be imported and run synchronously,
    # we will trigger Celery task (or local async task if Redis fails)
    try:
        generate_report_task.delay(id)
    except Exception:
        # Fallback to run synchronously to support local development if Redis/Celery aren't running
        await generate_report_task(id)
        
    return {
        "message": "Interview completed successfully. Report generation triggered.",
        "interview": completed
    }

@router.delete("/{id}")
async def delete_interview(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    interview_repo = InterviewRepository()
    interview = await interview_repo.get(id)
    if not interview or interview["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )
    await interview_repo.remove(id)
    return {"message": "Interview deleted successfully."}
