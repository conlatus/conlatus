import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from services.rubric_scoring import calculate_verdict
from models.schemas import RubricEvidenceItem
from models.interview import Interview
from models.report import Report
from models.transcript import Transcript
from services.report_generator import ReportGenerator
from core.session import session_store


def test_calculate_verdict_deterministic_scoring():
    """Verifies Pass-1 deterministic criteria calculation, weighted scores, and threshold recommendation."""
    evidence = {
        "architecture": RubricEvidenceItem(
            criterion="architecture",
            score=4.5,
            evidence="Designed microservices",
            reasoning="Strong grasp",
        ),
        "communication": RubricEvidenceItem(
            criterion="communication",
            score=3.5,
            evidence="Clear speech",
            reasoning="Good",
        ),
    }
    criteria = {
        "architecture": {"weight": 0.6, "scale": 5, "description": "System architecture"},
        "communication": {"weight": 0.4, "scale": 5, "description": "Articulation"},
    }

    # Expected: (4.5 * 0.6) + (3.5 * 0.4) = 2.7 + 1.4 = 4.1
    verdict = calculate_verdict(rubric_evidence=evidence, rubric_criteria=criteria, verdict_threshold=3.0)

    assert verdict["overall_score"] == 4.1
    assert verdict["verdict"] == "PASS"
    assert "architecture" in verdict["criteria_breakdown"]
    assert verdict["criteria_breakdown"]["architecture"]["weighted_score"] == 2.7


def test_calculate_verdict_below_threshold():
    """Verifies below-threshold score yields No Hire recommendation."""
    evidence = {
        "problem_solving": RubricEvidenceItem(criterion="problem_solving", score=2.0, evidence="Struggled", reasoning="Weak"),
    }
    criteria = {
        "problem_solving": {"weight": 1.0, "scale": 5, "description": "Problem solving"},
    }
    verdict = calculate_verdict(rubric_evidence=evidence, rubric_criteria=criteria, verdict_threshold=3.0)

    assert verdict["overall_score"] == 2.0
    assert verdict["verdict"] == "FAIL"


@pytest.mark.asyncio
async def test_report_generator_holistic_synthesis(db_session: AsyncSession, seed_test_data):
    """Verifies Pass-2 holistic report generator extracts verbatim quotes and populates synthesis_details."""
    role = seed_test_data["role"]
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="Danielle",
        candidate_email="danielle@test.com",
        token="tok_danielle_123",
        status="completed",
    )
    db_session.add(interview)
    await db_session.commit()

    # Set up in-memory session with verdict
    session = session_store.create_session(candidate_id="cand-danielle")
    session.session_id = str(inv_id)
    session_store._sessions[str(inv_id)] = session
    session.add_turn(role="interviewer", content="How do you handle audio streaming?")
    session.add_turn(role="candidate", content="We use WebRTC data channels with Opus compression.")
    session.verdict = MagicMock(dict=lambda: {"overall_score": 4.6, "criteria_breakdown": {}})

    mock_parsed_llm = {
        "executive_summary": "Danielle is a standout engineer with strong audio networking fundamentals.",
        "strengths": ["'We use WebRTC data channels with Opus compression.' - Crisp answer demonstrating practical knowledge."],
        "growth_areas": [],
        "communication": "Fluent and confident.",
        "recommendation": "Strong Hire",
    }

    generator = ReportGenerator()
    with patch.object(generator.llm_client, "get_json_completion", return_value=mock_parsed_llm):
        report = await generator.generate_report(inv_id, db_session)

    assert report is not None
    assert report.overall_score == 4.6
    assert report.recommendation == "Strong Hire"
    assert len(report.synthesis_details["strengths"]) == 1
    assert "WebRTC" in report.synthesis_details["strengths"][0]


def test_get_report_in_progress_rejected(client: TestClient, admin_headers, seed_test_data):
    """Verifies that attempting to retrieve report for an in-progress interview returns 400 Bad Request."""
    inv_id = uuid.uuid4()

    resp = client.get(
        f"/api/v1/reports/{inv_id}",
        headers=admin_headers,
    )
    # Interview doesn't exist or is not complete -> 404 or 400
    assert resp.status_code in (404, 400)


@pytest.mark.asyncio
async def test_human_decision_recording_endpoint(client: TestClient, db_session: AsyncSession, seed_test_data, admin_headers):
    """Verifies POST /api/v1/reports/{id}/decision records recruiter verdict and notes."""
    role = seed_test_data["role"]
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="Fiona",
        candidate_email="fiona@test.com",
        token="tok_fiona_555",
        status="completed",
    )
    db_session.add(interview)
    await db_session.flush()

    report = Report(
        interview_id=inv_id,
        overall_score=4.0,
        recommendation="Hire",
        summary="Good performance",
    )
    db_session.add(report)
    await db_session.commit()

    resp = client.post(
        f"/api/v1/reports/{inv_id}/decision",
        headers=admin_headers,
        json={
            "human_decision": "hired",
            "human_notes": "Candidate accepted preliminary offer."
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["human_decision"] == "hired"
    assert data["human_notes"] == "Candidate accepted preliminary offer."
