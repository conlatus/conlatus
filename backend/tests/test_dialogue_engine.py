import pytest
from unittest.mock import MagicMock, patch

from core.session import session_store
from models.schemas import InterviewConfig
from schemas.dialogue import EvaluationEnvelope, ProbeDecision
from services.dialogue_manager import dialogue_manager
from services.resilient_client import ResilientLLMClient, RetryableLLMError, NonRetryableLLMError


def create_test_session(max_followups=2, safety_ceiling=10):
    config = InterviewConfig(
        id="test-config-1",
        role_title="Senior Distributed Systems Engineer",
        company_name="Acme",
        duration_minutes=30,
        questions=[
            {"id": "q1", "text": "Describe your experience with consensus protocols.", "maps_to": ["distributed_systems"]},
            {"id": "q2", "text": "How do you diagnose memory leaks in production?", "maps_to": ["debugging"]},
        ],
        rubric_criteria={
            "distributed_systems": {"weight": 0.5, "scale": 5, "description": "Consensus knowledge"},
            "debugging": {"weight": 0.5, "scale": 5, "description": "Memory profiling"},
        },
        max_followups=max_followups,
        verdict_threshold=3.0,
    )
    session = session_store.create_session(candidate_id="cand-test", config=config)
    session.max_total_turns = safety_ceiling
    return session


def test_adaptive_deepen_followup():
    """Verifies that a vague answer triggers a DEEPEN probe and increments followup count."""
    session = create_test_session(max_followups=2)
    session.add_turn(role="interviewer", content=session.interview_config.questions[0]["text"])

    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,
        suggested_question="Could you detail how Raft handles split-brain leader elections?",
        criterion_evaluations=[{"criterion": "distributed_systems", "score": 2.5, "evidence": "Mentioned Raft", "reasoning": "Vague"}],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        is_followup, next_q = dialogue_manager.process_turn(session.session_id, "We used Raft.")

    assert is_followup is True
    assert next_q == "Could you detail how Raft handles split-brain leader elections?"
    assert session.current_question_index == 0
    assert session.current_question_followup_count == 1


def test_adaptive_pivot_advancement():
    """Verifies that a comprehensive answer triggers PIVOT and advances to the next base question."""
    session = create_test_session(max_followups=2)
    session.add_turn(role="interviewer", content=session.interview_config.questions[0]["text"])

    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.PIVOT,
        suggested_question=None,
        criterion_evaluations=[{"criterion": "distributed_systems", "score": 4.5, "evidence": "Raft term terms", "reasoning": "Clear"}],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        is_followup, next_q = dialogue_manager.process_turn(
            session.session_id,
            "We configured Raft with randomized election timeouts between 150ms and 300ms to avoid split votes."
        )

    assert is_followup is False
    assert next_q == session.interview_config.questions[1]["text"]
    assert session.current_question_index == 1
    assert session.current_question_followup_count == 0


def test_followup_budget_forced_pivot():
    """Verifies that when followup budget is exhausted, PIVOT is forced even if LLM requested DEEPEN."""
    session = create_test_session(max_followups=2)
    session.current_question_followup_count = 2  # Already hit max_followups
    session.add_turn(role="interviewer", content="Can you elaborate?")

    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,  # LLM tries to deepen again
        suggested_question="Tell me more?",
        criterion_evaluations=[],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        is_followup, next_q = dialogue_manager.process_turn(session.session_id, "Still not sure.")

    # Must force PIVOT
    assert is_followup is False
    assert session.current_question_index == 1
    assert session.current_question_followup_count == 0
    assert next_q == session.interview_config.questions[1]["text"]


def test_safety_ceiling_length_limited():
    """Verifies session terminates with status 'length_limited' when turn ceiling is reached."""
    session = create_test_session(max_followups=2, safety_ceiling=4)
    session.total_turns = 3  # Next turn will hit 4

    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,
        suggested_question="Follow-up question?",
        criterion_evaluations=[],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        dialogue_manager.process_turn(session.session_id, "Another response")

    assert session.total_turns >= 4
    assert session.status == "length_limited"


def test_resilient_client_rate_limit_retry():
    """Verifies ResilientLLMClient retries when receiving a 429 Rate Limit error."""
    client = ResilientLLMClient(api_key="mock_key")
    client.client = MagicMock()

    call_count = 0

    def mock_create(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("Rate limit reached. 429 Too Many Requests")
        mock_resp = MagicMock()
        mock_resp.choices = [MagicMock(message=MagicMock(content='{"status": "ok"}'))]
        return mock_resp

    client.client.chat.completions.create.side_effect = mock_create

    # Should succeed on attempt 2
    result = client.get_json_completion(messages=[{"role": "user", "content": "test"}])
    assert result == {"status": "ok"}
    assert call_count == 2


def test_resilient_client_auth_error_fails_immediately():
    """Verifies 401 authentication errors raise NonRetryableLLMError without retries."""
    client = ResilientLLMClient(api_key="mock_key")
    client.client = MagicMock()

    call_count = 0

    def mock_create(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        raise Exception("401 Unauthorized. Invalid API key.")

    client.client.chat.completions.create.side_effect = mock_create

    with pytest.raises(NonRetryableLLMError):
        client._execute_chat_completion(messages=[{"role": "user", "content": "test"}], model="openai/gpt-oss-120b")

    # Should not retry 401
    assert call_count == 1


def test_candidate_edge_cases():
    """Verifies dialogue manager handles edge cases: empty strings, long strings, and technical jargon."""
    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.PIVOT,
        suggested_question=None,
        criterion_evaluations=[{"criterion": "distributed_systems", "score": 4.0, "evidence": "Handled", "reasoning": "Ok"}],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        # 1. Empty string
        session1 = create_test_session()
        session1.add_turn(role="candidate", content="")
        is_f, _ = dialogue_manager.process_turn(session1.session_id, "")
        assert is_f is False
        assert session1.conversation_history[-2].content == ""

        # 2. 10,000 character response
        session2 = create_test_session()
        huge_text = "A" * 10000
        session2.add_turn(role="candidate", content=huge_text)
        is_f, _ = dialogue_manager.process_turn(session2.session_id, huge_text)
        assert is_f is False
        assert len(session2.conversation_history[-2].content) == 10000

        # 3. Dense technical jargon
        session3 = create_test_session()
        jargon = "BFT Byzantine Fault Tolerance with epoll, io_uring asynchronous vectorized batching and AVX-512 SIMD parsing."
        session3.add_turn(role="candidate", content=jargon)
        is_f, _ = dialogue_manager.process_turn(session3.session_id, jargon)
        assert is_f is False
        assert "AVX-512" in session3.conversation_history[-2].content
