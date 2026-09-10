from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class TopicGenerationRequest(BaseModel):
    role_title: str = Field(..., example="Senior Distributed Systems Engineer")
    topics: List[str] = Field(..., example=["Kafka partition rebalancing", "Raft consensus"])
    seniority_level: str = Field(..., example="Senior")
    job_description: Optional[str] = Field(None, example="We are looking for someone to scale our data pipeline...")


class GeneratedQuestionSchema(BaseModel):
    id: str = Field(..., description="Unique ID for the question (e.g., q1, q2)")
    text: str = Field(..., description="Scenario-based question prompt with concrete context.")
    competency_tag: str = Field(..., description="Target skill (e.g., 'Fault Tolerance', 'Concurrency')")
    difficulty: int = Field(..., description="1 to 5 scale", ge=1, le=5)
    expected_signals: str = Field(..., description="Key indicators of a strong answer vs red flags.")
    rubric_criteria: Dict[str, Any] = Field(
        ...,
        description="Specific grading facets for this question. E.g., {'system_design': {'weight': 0.5, 'scale': 5, 'description': '...'}}"
    )
    notes: Optional[str] = Field(None, description="Optional notes or hints for the interviewer")


class CurriculumPlanSchema(BaseModel):
    questions: List[GeneratedQuestionSchema] = Field(..., description="List of generated questions for the interview curriculum")
