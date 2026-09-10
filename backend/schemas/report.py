from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class CriterionScore(BaseModel):
    score: float
    weight: float
    weighted_score: float
    evidence_count: int


class HumanDecisionRequest(BaseModel):
    human_decision: str = Field(..., description="E.g., 'hired', 'rejected', 'next_round'")
    human_notes: Optional[str] = Field(None)


class ReportSynthesisDetails(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    growth_areas: List[str] = Field(default_factory=list)
    communication: str = ""
    flags: List[str] = Field(default_factory=list)


class ReportResponse(BaseModel):
    id: uuid.UUID
    interview_id: uuid.UUID
    overall_score: float
    recommendation: str
    summary: Optional[str] = None
    
    rubric_breakdown: Dict[str, CriterionScore] = Field(default_factory=dict)
    synthesis_details: Optional[ReportSynthesisDetails] = None
    
    human_decision: Optional[str] = None
    human_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
