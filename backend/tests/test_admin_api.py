import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.interview import Interview
from models.report import Report
from models.transcript import Transcript


@pytest.mark.asyncio
async def test_admin_overview_endpoint(client: TestClient, db_session: AsyncSession, seed_test_data, admin_headers):
    """Verifies GET /admin/overview aggregates interview KPIs and alerts correctly."""
    role = seed_test_data["role"]
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="George",
        candidate_email="george@test.com",
        token="tok_george_789",
        status="completed",
    )
    report = Report(
        interview_id=inv_id,
        overall_score=4.4,
        recommendation="Strong Hire",
        summary="Outstanding candidate",
    )
    db_session.add_all([interview, report])
    await db_session.commit()

    resp = client.get("/admin/overview", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_interviews"] >= 1
    assert data["completed_interviews"] >= 1
    assert data["average_score"] == 4.4
    assert len(data["alerts"]) > 0
    assert len(data["recent_candidates"]) >= 1


@pytest.mark.asyncio
async def test_admin_candidates_list_and_filters(client: TestClient, db_session: AsyncSession, seed_test_data, admin_headers):
    """Verifies GET /admin/candidates supports search queries and status filters."""
    role = seed_test_data["role"]

    # Create 2 interviews with different statuses
    c1 = Interview(
        id=uuid.uuid4(),
        role_id=role.id,
        candidate_name="Hannah Baker",
        candidate_email="hannah@test.com",
        token="tok_hannah_1",
        status="completed",
    )
    c2 = Interview(
        id=uuid.uuid4(),
        role_id=role.id,
        candidate_name="Ian Malcolm",
        candidate_email="ian@jurassic.com",
        token="tok_ian_2",
        status="in_progress",
    )
    db_session.add_all([c1, c2])
    await db_session.commit()

    # 1. Fetch all
    resp_all = client.get("/admin/candidates", headers=admin_headers)
    assert resp_all.status_code == 200
    assert len(resp_all.json()) >= 2

    # 2. Filter by status=completed
    resp_comp = client.get("/admin/candidates?status=completed", headers=admin_headers)
    assert resp_comp.status_code == 200
    names = [c["candidate_name"] for c in resp_comp.json()]
    assert "Hannah Baker" in names
    assert "Ian Malcolm" not in names

    # 3. Filter by search=ian
    resp_search = client.get("/admin/candidates?search=ian", headers=admin_headers)
    assert resp_search.status_code == 200
    search_names = [c["candidate_name"] for c in resp_search.json()]
    assert "Ian Malcolm" in search_names
    assert "Hannah Baker" not in search_names


@pytest.mark.asyncio
async def test_admin_candidate_detail_endpoint(client: TestClient, db_session: AsyncSession, seed_test_data, admin_headers):
    """Verifies GET /admin/candidates/{id} returns full report details and transcript turns."""
    role = seed_test_data["role"]
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="Julia Roberts",
        candidate_email="julia@film.org",
        token="tok_julia_33",
        status="completed",
    )
    report = Report(
        interview_id=inv_id,
        overall_score=4.2,
        recommendation="Hire",
        summary="Solid engineer",
        rubric_breakdown={"arch": {"score": 4.2, "weight": 1.0, "weighted_score": 4.2, "evidence_count": 1}},
        synthesis_details={"strengths": ["Great articulation"], "growth_areas": []},
    )
    transcript = Transcript(
        interview_id=inv_id,
        speaker="interviewer",
        message="Welcome Julia!",
    )
    db_session.add_all([interview, report, transcript])
    await db_session.commit()

    resp = client.get(f"/admin/candidates/{inv_id}", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["candidate_name"] == "Julia Roberts"
    assert data["overall_score"] == 4.2
    assert len(data["transcripts"]) == 1
    assert data["transcripts"][0]["message"] == "Welcome Julia!"


def test_admin_candidate_detail_not_found(client: TestClient, admin_headers):
    """Verifies GET /admin/candidates/{id} returns 404 for non-existent UUID."""
    fake_id = uuid.uuid4()
    resp = client.get(f"/admin/candidates/{fake_id}", headers=admin_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_admin_record_decision_endpoint(client: TestClient, db_session: AsyncSession, seed_test_data, admin_headers):
    """Verifies POST /admin/candidates/{id}/decision updates recruiter verdict and notes."""
    role = seed_test_data["role"]
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="Kevin",
        candidate_email="kevin@test.com",
        token="tok_kevin_1",
        status="completed",
    )
    report = Report(interview_id=inv_id, overall_score=3.9, recommendation="Hire")
    db_session.add_all([interview, report])
    await db_session.commit()

    resp = client.post(
        f"/admin/candidates/{inv_id}/decision",
        headers=admin_headers,
        json={"decision": "next_round", "notes": "Strong candidate for team match."}
    )
    assert resp.status_code == 200
    assert resp.json()["human_decision"] == "next_round"


def test_admin_settings_get_and_post(client: TestClient, admin_headers):
    """Verifies reading and updating admin settings."""
    get_resp = client.get("/admin/settings", headers=admin_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "model_provider" in data

    update_resp = client.post(
        "/admin/settings",
        headers=admin_headers,
        json={
            **data,
            "model_provider": "anthropic",
            "model_name": "claude-3-5-sonnet-latest",
            "default_duration": 45,
            "rubric_threshold": 3.5,
        }
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["model_provider"] == "anthropic"
    assert updated_data["default_duration"] == 45
    assert updated_data["rubric_threshold"] == 3.5


def test_admin_unauthorized_rejection(client: TestClient):
    """Verifies unauthenticated calls to /admin routes return 401 Unauthorized."""
    resp = client.get("/admin/overview")
    assert resp.status_code == 401
