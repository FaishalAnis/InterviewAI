from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
from app.repositories.report import ReportRepository
from app.repositories.interview import InterviewRepository
from app.services.pdf_generator import generate_pdf_report

router = APIRouter()

@router.get("/user", response_model=List[Any])
async def get_user_reports(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
) -> Any:
    report_repo = ReportRepository()
    reports = await report_repo.get_by_user(current_user["id"], skip=skip, limit=limit)
    return reports

@router.get("/{interview_id}")
async def get_report(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
) -> Any:
    report_repo = ReportRepository()
    report = await report_repo.get_by_interview(interview_id)
    if not report:
        # Fallback: Attempt synchronous on-demand compilation if interview is completed
        interview_repo = InterviewRepository()
        interview = await interview_repo.get(interview_id)
        if interview and interview["user_id"] == current_user["id"]:
            from app.workers.tasks import async_generate_report
            from app.core.logger import logger
            try:
                logger.info(f"Report not found for interview {interview_id}. Generating on-demand...")
                success = await async_generate_report(interview_id)
                if success:
                    report = await report_repo.get_by_interview(interview_id)
            except Exception as e:
                logger.error(f"On-demand report generation failed: {e}")

    if not report or report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found for this interview."
        )
    return report

@router.get("/{interview_id}/pdf")
async def get_report_pdf(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
) -> Any:
    report_repo = ReportRepository()
    report = await report_repo.get_by_interview(interview_id)
    if not report:
        interview_repo = InterviewRepository()
        interview = await interview_repo.get(interview_id)
        if interview and interview["user_id"] == current_user["id"]:
            from app.workers.tasks import async_generate_report
            from app.core.logger import logger
            try:
                logger.info(f"Report PDF requested but report not found for {interview_id}. Generating on-demand...")
                success = await async_generate_report(interview_id)
                if success:
                    report = await report_repo.get_by_interview(interview_id)
            except Exception as e:
                logger.error(f"On-demand PDF report generation failed: {e}")

    if not report or report["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found for this interview."
        )

    interview_repo = InterviewRepository()
    interview = await interview_repo.get(interview_id)
    interview_type = interview.get("interview_type", "General") if interview else "General"

    pdf_buffer = generate_pdf_report(report, interview_type)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=InterviewAI_Report_{interview_id}.pdf"
        }
    )
