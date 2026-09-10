import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

try:
    from main import app
    import rubric_config
    from core.session import session_store
    from schemas.dialogue import EvaluationEnvelope, ProbeDecision
except ImportError:
    from backend.main import app
    import backend.rubric_config as rubric_config
    from backend.core.session import session_store
    from backend.schemas.dialogue import EvaluationEnvelope, ProbeDecision

client = TestClient(app)


def test_happy_path(candidate_headers):
    """Start session -> answer all questions completely -> expect completion signal & rubric evidence for all criteria."""
    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-happy"}, headers=candidate_headers)
    assert start_resp.status_code == 200
    session_id = start_resp.json()["session_id"]

    detailed_answers = [
        "REST uses HTTP methods across endpoints, while GraphQL provides a single endpoint allowing clients to query specific fields.",
        "To debug a slow API endpoint, I profile SQL queries using EXPLAIN ANALYZE, inspect APM traces for latency spikes, and check system metrics.",
        "Database indexes use B-trees to speed up select queries from O(N) to O(log N), but add overhead to write operations and take storage space.",
        "A rate limiter can be implemented in Redis using token bucket or sliding window algorithms to throttle excess client requests.",
    ]

    def mock_eval_side_effect(current_question, *args, **kwargs):
        mapped = current_question.get("maps_to", [])
        evals = [
            {"criterion": c, "score": 4.5, "evidence": "Solid architecture knowledge", "reasoning": "Clear explanation"}
            for c in mapped
        ]
        return EvaluationEnvelope(
            decision=ProbeDecision.PIVOT,
            suggested_question=None,
            criterion_evaluations=evals,
            raw_llm_response="{}",
        )

    with patch("core.llm.llm_evaluator.evaluate_response", side_effect=mock_eval_side_effect):
        for idx, answer in enumerate(detailed_answers):
            msg_resp = client.post(
                f"/interview/{session_id}/message",
                json={"message": answer},
                headers=candidate_headers,
            )
            assert msg_resp.status_code == 200
            data = msg_resp.json()

            if idx < len(detailed_answers) - 1:
                assert data["status"] == "in_progress"
                assert data["is_followup"] is False
                assert data["next_question"] == rubric_config.QUESTIONS[idx + 1]["text"]
            else:
                assert data["status"] == "completed"
                assert data["next_question"] is None
                assert data["verdict"] is not None
                assert data["verdict"]["verdict"] in ("PASS", "FAIL", "INCOMPLETE")

    status_resp = client.get(f"/interview/{session_id}/status", headers=candidate_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "completed"

    for crit in rubric_config.RUBRIC_CRITERIA:
        assert crit in status_data["rubric_evidence"]


def test_followup_path(candidate_headers):
    """Answer one question vaguely -> expect a follow-up question, not advancement to the next base question."""
    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-vague"}, headers=candidate_headers)
    assert start_resp.status_code == 200
    session_id = start_resp.json()["session_id"]

    mock_envelope = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,
        suggested_question="Could you elaborate on HTTP vs GraphQL?",
        criterion_evaluations=[{"criterion": "technical_depth", "score": 2.0, "evidence": "vague", "reasoning": "needs depth"}],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_envelope):
        resp = client.post(
            f"/interview/{session_id}/message",
            json={"message": "vague answer text"},
            headers=candidate_headers,
        )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "in_progress"
    assert data["is_followup"] is True
    assert data["next_question"] == "Could you elaborate on HTTP vs GraphQL?"


def test_followup_budget_enforcement(candidate_headers):
    """Answer vaguely repeatedly -> expect loop to move on after MAX_FOLLOWUPS_PER_QUESTION."""
    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-budget"}, headers=candidate_headers)
    assert start_resp.status_code == 200
    session_id = start_resp.json()["session_id"]

    mock_deepen = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,
        suggested_question="Can you elaborate?",
        criterion_evaluations=[],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_deepen):
        # 1st vague answer -> follow-up 1
        resp1 = client.post(
            f"/interview/{session_id}/message",
            json={"message": "vague answer 1"},
            headers=candidate_headers,
        )
        assert resp1.json()["is_followup"] is True

        # 2nd vague answer -> follow-up 2
        resp2 = client.post(
            f"/interview/{session_id}/message",
            json={"message": "vague answer 2"},
            headers=candidate_headers,
        )
        assert resp2.json()["is_followup"] is True

        # 3rd vague answer -> budget exhausted! Advances to next base question (Q2)
        resp3 = client.post(
            f"/interview/{session_id}/message",
            json={"message": "vague answer 3"},
            headers=candidate_headers,
        )
        d3 = resp3.json()
        assert d3["is_followup"] is False
        assert d3["next_question"] == rubric_config.QUESTIONS[1]["text"]


def test_runtime_safety_ceiling(candidate_headers):
    """Simulate a session reaching max_total_turns -> expect early termination with length_limited status."""
    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-safety"}, headers=candidate_headers)
    assert start_resp.status_code == 200
    session_id = start_resp.json()["session_id"]

    session = session_store.get_session(session_id)
    session.max_total_turns = 2

    mock_deepen = EvaluationEnvelope(
        decision=ProbeDecision.DEEPEN,
        suggested_question="Can you elaborate?",
        criterion_evaluations=[],
        raw_llm_response="{}",
    )

    with patch("core.llm.llm_evaluator.evaluate_response", return_value=mock_deepen):
        resp = client.post(
            f"/interview/{session_id}/message",
            json={"message": "vague response"},
            headers=candidate_headers,
        )
        data = resp.json()
        assert data["status"] in ("length_limited", "completed")


def test_config_validation_too_few_questions():
    """Config validation rejection — fewer than MIN_QUESTIONS."""
    too_few = [{"id": "q1", "text": "Q1", "maps_to": ["technical_depth"]}]
    with pytest.raises(ValueError) as exc_info:
        rubric_config.validate_rubric_config(questions=too_few, min_questions=3)
    assert "MIN_QUESTIONS" in str(exc_info.value)


def test_config_validation_bad_weights():
    """Config validation rejection — weights do not sum to 1.0."""
    bad_criteria = {
        "technical_depth": {"weight": 0.5, "scale": 5},
        "problem_solving": {"weight": 0.8, "scale": 5},
    }
    with pytest.raises(ValueError) as exc_info:
        rubric_config.validate_rubric_config(criteria=bad_criteria)
    assert "Sum of rubric weights" in str(exc_info.value)


def test_config_validation_orphaned_criterion():
    """Config validation rejection — question maps to non-existent criterion."""
    orphaned_questions = [
        {"id": "q1", "text": "Q1", "maps_to": ["unknown_crit"]},
        {"id": "q2", "text": "Q2", "maps_to": ["technical_depth"]},
        {"id": "q3", "text": "Q3", "maps_to": ["problem_solving"]},
    ]
    with pytest.raises(ValueError) as exc_info:
        rubric_config.validate_rubric_config(questions=orphaned_questions)
    assert "unknown criterion 'unknown_crit'" in str(exc_info.value)
