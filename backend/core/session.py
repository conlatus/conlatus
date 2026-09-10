import datetime
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

try:
    from models.schemas import RubricEvidenceItem, Turn, VerdictResult, InterviewConfig
    import rubric_config
except ImportError:
    from backend.models.schemas import RubricEvidenceItem, Turn, VerdictResult, InterviewConfig
    import backend.rubric_config as rubric_config


class SessionState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str = "candidate-1"
    role_title: str = rubric_config.ROLE_TITLE
    status: str = "in_progress"  # 'in_progress', 'completed', 'length_limited'

    current_question_index: int = 0
    current_question_followup_count: int = 0
    total_turns: int = 0
    max_total_turns: int = Field(
        default_factory=lambda: getattr(rubric_config, "SAFETY_CEILING", 30)
    )

    conversation_history: List[Turn] = Field(default_factory=list)
    rubric_evidence: Dict[str, RubricEvidenceItem] = Field(default_factory=dict)
    verdict: Optional[VerdictResult] = None
    last_raw_llm_response: Optional[str] = None
    interview_config: Optional[InterviewConfig] = None


    def add_turn(self, role: str, content: str) -> Turn:
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        turn = Turn(role=role, content=content, timestamp=now_str)
        self.conversation_history.append(turn)
        self.total_turns += 1
        return turn


class SessionStore:
    """In-memory session store for MVP Step 1."""

    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(self, candidate_id: str = "candidate-1", config: Optional[InterviewConfig] = None) -> SessionState:
        # If no dynamic config is provided, we fall back to global rubric_config (for tests/legacy)
        if not config:
            rubric_config.validate_rubric_config()
            session = SessionState(candidate_id=candidate_id)
        else:
            session = SessionState(
                candidate_id=candidate_id,
                role_title=config.role_title,
                interview_config=config
            )
            
        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def clear(self):
        self._sessions.clear()


# Global in-process store instance
session_store = SessionStore()
