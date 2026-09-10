import uuid
from typing import Dict, Optional
try:
    from models.schemas import InterviewConfig
except ImportError:
    from backend.models.schemas import InterviewConfig

class InterviewStore:
    def __init__(self):
        self._interviews: Dict[str, InterviewConfig] = {}

    def create_interview(self, config: InterviewConfig) -> str:
        self._interviews[config.id] = config
        return config.id

    def get_interview(self, interview_id: str) -> Optional[InterviewConfig]:
        return self._interviews.get(interview_id)

    def clear(self):
        self._interviews.clear()

# Global in-process store instance
interview_store = InterviewStore()
