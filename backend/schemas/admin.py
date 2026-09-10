import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CandidateListItem(BaseModel):
    id: uuid.UUID
    candidate_name: str
    candidate_email: str
    role_title: str
    company_name: str
    status: str  # completed, in_progress, created
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    human_decision: Optional[str] = None
    token: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class CandidateDetailResponse(BaseModel):
    id: uuid.UUID
    candidate_name: str
    candidate_email: str
    role_title: str
    company_name: str
    status: str
    token: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    # Report details
    report_id: Optional[uuid.UUID] = None
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    summary: Optional[str] = None
    rubric_breakdown: Optional[Dict[str, Any]] = None
    synthesis_details: Optional[Dict[str, Any]] = None
    human_decision: Optional[str] = None
    human_notes: Optional[str] = None

    # Transcript turns
    transcripts: List[Dict[str, Any]] = Field(default_factory=list)


class CandidateDecisionRequest(BaseModel):
    decision: str = Field(..., description="'hired', 'rejected', 'next_round', 'under_review'")
    notes: Optional[str] = None


class DashboardAlert(BaseModel):
    id: str
    type: str  # "warning", "info", "success", "alert"
    title: str
    message: str
    timestamp: str


class AdminOverviewResponse(BaseModel):
    total_interviews: int
    completed_interviews: int
    in_progress_interviews: int
    pending_interviews: int
    average_score: float
    pass_rate: float
    recent_candidates: List[CandidateListItem]
    alerts: List[DashboardAlert]


class AdminSettingsPayload(BaseModel):
    model_provider: str = "groq"
    model_name: str = "openai/gpt-oss-120b"
    default_duration: int = 30
    rubric_threshold: float = 3.0
    company_name: str = "Conlatus AI"
    company_logo: Optional[str] = None
    recruiter_email: Optional[str] = "recruiter@conlatus.ai"
    email_notifications: bool = True
    alert_on_finish: bool = True
    groq_api_key_configured: bool = True
    anthropic_api_key_configured: bool = False
    openai_api_key_configured: bool = False
