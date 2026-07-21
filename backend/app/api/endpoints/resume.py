from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from app.api.deps import get_current_user
from app.services.storage_service import storage_service

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Uploads a resume PDF, parses text nodes, extracts skills, experience details, projects,
    and returns a structured JSON payload for frontend review.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF format resumes are supported."
        )

    try:
        file_bytes = await file.read()
        parsed_data = await storage_service.parse_resume_pdf(file_bytes)
        
        # Save raw resume upload copy if Cloudinary exists
        resume_url = await storage_service.upload_file(
            file_bytes,
            file_name=f"resume_{current_user['id']}.pdf",
            folder="resumes"
        )
        parsed_data["resume_url"] = resume_url
        
        return parsed_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume parsing system failed: {str(e)}"
        )
