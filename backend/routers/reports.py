import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from api.deps import get_current_admin, get_db
from models.report import Report
from schemas.report import ReportResponse, HumanDecisionRequest
from services.report_generator import report_generator
from models.interview import Interview

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/{interview_id}", response_model=ReportResponse)
async def get_report(
    interview_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_admin),
):
    """
    Retrieve the post-interview report.
    If the interview is completed but the report doesn't exist, generate it lazily.
    """
    result = await db.execute(select(Report).where(Report.interview_id == interview_id))
    report = result.scalar_one_or_none()
    
    if not report:
        interview_res = await db.execute(select(Interview).where(Interview.id == interview_id))
        interview = interview_res.scalar_one_or_none()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
            
        if interview.status not in ("completed", "length_limited"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Interview is still {interview.status}. Cannot generate report yet."
            )
            
        # Lazy generation
        logger.info(f"Report not found for completed interview {interview_id}. Generating lazily...")
        report = await report_generator.generate_report(interview_id=interview_id, db_session=db)
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate report."
            )

    return report


@router.post("/{interview_id}/decision", response_model=ReportResponse)
async def submit_human_decision(
    interview_id: uuid.UUID,
    payload: HumanDecisionRequest,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_admin),
):
    """
    Records the hiring manager's final verdict.
    """
    result = await db.execute(select(Report).where(Report.interview_id == interview_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Report not found. Ensure interview is complete first."
        )

    report.human_decision = payload.human_decision
    report.human_notes = payload.human_notes

    await db.commit()
    await db.refresh(report)

    return report
