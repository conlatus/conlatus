from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ProbeDecision(str, Enum):
    DEEPEN = "DEEPEN"
    CLARIFY = "CLARIFY"
    PIVOT = "PIVOT"
    CONCLUDE = "CONCLUDE"


class EvaluationEnvelope(BaseModel):
    decision: ProbeDecision = Field(
        ...,
        description="The action the interviewer should take: DEEPEN, CLARIFY, PIVOT, or CONCLUDE."
    )
    suggested_question: Optional[str] = Field(
        None,
        description="The follow-up question text if the decision is DEEPEN or CLARIFY. Null if PIVOT or CONCLUDE."
    )
    criterion_evaluations: List[Dict[str, Any]] = Field(
        ...,
        description="List of criterion evaluations: [{'criterion': 'technical_depth', 'score': 4.0, 'evidence': '...', 'reasoning': '...'}]"
    )
    raw_llm_response: Optional[str] = Field(
        None,
        description="Raw JSON text response for this turn."
    )


class TurnState(BaseModel):
    """Represents the internal state of the dialogue manager during a turn."""
    time_elapsed_minutes: float = 0.0
    current_question_followups: int = 0
    total_turns: int = 0
