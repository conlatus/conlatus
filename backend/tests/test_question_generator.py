import json
import pytest
from unittest.mock import MagicMock, patch

from schemas.question_generation import TopicGenerationRequest, CurriculumPlanSchema
from services.question_generator import QuestionGenerator
from core.llm import LLMMissingApiKeyError, LLMRateLimitError


@pytest.fixture
def sample_generation_request():
    return TopicGenerationRequest(
        role_title="Senior Distributed Systems Architect",
        topics=["Raft Consensus", "Zero-Copy I/O", "Dynamic Sharding"],
        seniority_level="Senior",
        job_description="Architecting high-throughput messaging brokers processing 5M events/sec.",
    )


def test_generate_curriculum_success(sample_generation_request):
    """Verifies curriculum generation outputs valid questions adhering to CurriculumPlanSchema."""
    generator = QuestionGenerator(api_key="mock_key")
    generator.client = MagicMock()

    mock_curriculum_json = {
        "questions": [
            {
                "id": "q1",
                "text": "How do you handle split-brain partitions in Raft when a network partition isolates the leader with a minority of nodes?",
                "competency_tag": "Distributed Consensus",
                "difficulty": 5,
                "expected_signals": "Mentions term increments, failure to reach quorum on log entries, and leader step-down.",
                "rubric_criteria": {
                    "consensus_correctness": {
                        "weight": 0.5,
                        "scale": 5,
                        "description": "Understanding quorum mechanics and term transitions."
                    },
                    "partition_tolerance": {
                        "weight": 0.5,
                        "scale": 5,
                        "description": "Handling split votes and uncommitted logs."
                    }
                }
            },
            {
                "id": "q2",
                "text": "Explain how you would implement zero-copy buffer transfers between Linux socket buffers and disk storage.",
                "competency_tag": "Systems Optimization",
                "difficulty": 4,
                "expected_signals": "Mentions sendfile, splice syscalls, and page cache interaction.",
                "rubric_criteria": {
                    "kernel_io": {
                        "weight": 1.0,
                        "scale": 5,
                        "description": "Knowledge of user vs kernel memory copies."
                    }
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock(message=MagicMock(content=json.dumps(mock_curriculum_json)))]
    generator.client.chat.completions.create.return_value = mock_resp

    with patch("services.web_research.web_researcher.fetch_contemporary_scenarios", return_value="Contemporary context"):
        curriculum = generator.generate_curriculum(sample_generation_request)

    assert isinstance(curriculum, CurriculumPlanSchema)
    assert len(curriculum.questions) == 2
    assert curriculum.questions[0].id == "q1"
    assert curriculum.questions[0].difficulty == 5
    assert "consensus_correctness" in curriculum.questions[0].rubric_criteria
    assert curriculum.questions[1].competency_tag == "Systems Optimization"


def test_missing_api_key_raises_error(sample_generation_request):
    """Verifies that QuestionGenerator raises LLMMissingApiKeyError if no API key is provided."""
    generator = QuestionGenerator(api_key="")
    generator.api_key = None
    generator.client = None

    with pytest.raises(LLMMissingApiKeyError):
        generator.generate_curriculum(sample_generation_request)


def test_rate_limit_error_handling(sample_generation_request):
    """Verifies that 429 rate limit exceptions from Groq are wrapped in LLMRateLimitError."""
    generator = QuestionGenerator(api_key="mock_key")
    generator.client = MagicMock()
    generator.client.chat.completions.create.side_effect = Exception("Rate limit exceeded: status 429")

    with patch("services.web_research.web_researcher.fetch_contemporary_scenarios", return_value=""):
        with pytest.raises(LLMRateLimitError):
            generator.generate_curriculum(sample_generation_request)
