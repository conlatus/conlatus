import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from models.company import Company
from models.user import User
from models.role import Role
from models.interview import Interview
from models.report import Report
from models.transcript import Transcript
from core.security import hash_password


@pytest.mark.asyncio
async def test_session_lifecycle_and_rollback(db_session: AsyncSession):
    """Verifies transactions commit correctly and rollbacks leave DB clean."""
    company = Company(name="Ephemeral Corp")
    db_session.add(company)
    await db_session.flush()

    assert company.id is not None
    comp_id = company.id

    # Rollback
    await db_session.rollback()

    res = await db_session.execute(select(Company).where(Company.id == comp_id))
    assert res.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_entity_creation_and_relationships(db_session: AsyncSession):
    """Verifies creating Company, User, Role, Interview, Transcript, and Report with valid foreign keys."""
    # 1. Company
    comp = Company(name="Acme Systems")
    db_session.add(comp)
    await db_session.flush()

    # 2. User
    user = User(
        email="dev@acme.com",
        full_name="Alice Engineer",
        hashed_password=hash_password("secret123"),
        role="recruiter",
        company_id=comp.id,
    )
    db_session.add(user)
    await db_session.flush()

    # 3. Role
    role = Role(
        title="Staff AI Architect",
        description="Lead AI engineering",
        company_id=comp.id,
        competencies={"ml": 5, "system_design": 5},
    )
    db_session.add(role)
    await db_session.flush()

    # 4. Interview
    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        user_id=user.id,
        candidate_name="Bob Candidate",
        candidate_email="bob@candidate.com",
        token="tok_test_bob_123",
        status="completed",
    )
    db_session.add(interview)
    await db_session.flush()

    # 5. Transcripts
    t1 = Transcript(
        interview_id=inv_id,
        speaker="interviewer",
        message="Tell me about your RAG architecture.",
    )
    t2 = Transcript(
        interview_id=inv_id,
        speaker="candidate",
        message="We use hybrid sparse and dense vector search.",
    )
    db_session.add_all([t1, t2])
    await db_session.flush()

    # 6. Report
    rep = Report(
        interview_id=inv_id,
        overall_score=4.5,
        recommendation="Strong Hire",
        summary="Outstanding candidate with deep RAG expertise.",
        rubric_breakdown={"ml": {"score": 4.5, "weight": 1.0, "weighted_score": 4.5, "evidence_count": 2}},
        synthesis_details={"strengths": ["Deep RAG knowledge"], "growth_areas": []},
    )
    db_session.add(rep)
    await db_session.commit()

    # Query back and verify relationships
    q = await db_session.execute(select(Interview).where(Interview.id == inv_id))
    loaded_inv = q.scalar_one()

    assert loaded_inv.candidate_name == "Bob Candidate"
    assert loaded_inv.role.title == "Staff AI Architect"
    assert len(loaded_inv.transcripts) == 2
    assert loaded_inv.report is not None
    assert loaded_inv.report.overall_score == 4.5


@pytest.mark.asyncio
async def test_cascade_deletion(db_session: AsyncSession):
    """Verifies that deleting a Role cascade-deletes associated Interviews, Transcripts, and Reports."""
    comp = Company(name="Cascade Corp")
    db_session.add(comp)
    await db_session.flush()

    role = Role(title="Backend Dev", company_id=comp.id)
    db_session.add(role)
    await db_session.flush()

    inv_id = uuid.uuid4()
    interview = Interview(
        id=inv_id,
        role_id=role.id,
        candidate_name="Carol",
        candidate_email="carol@test.com",
        token="tok_carol_456",
        status="completed",
    )
    db_session.add(interview)
    await db_session.flush()

    transcript = Transcript(interview_id=inv_id, speaker="candidate", message="Hello world")
    report = Report(interview_id=inv_id, overall_score=3.8, recommendation="Hire")
    db_session.add_all([transcript, report])
    await db_session.commit()

    # Delete Role
    await db_session.delete(role)
    await db_session.commit()

    # Interview, Transcript, and Report must be cascade deleted
    inv_check = await db_session.execute(select(Interview).where(Interview.id == inv_id))
    assert inv_check.scalar_one_or_none() is None

    rep_check = await db_session.execute(select(Report).where(Report.interview_id == inv_id))
    assert rep_check.scalar_one_or_none() is None

    trans_check = await db_session.execute(select(Transcript).where(Transcript.interview_id == inv_id))
    assert len(trans_check.scalars().all()) == 0


@pytest.mark.asyncio
async def test_foreign_key_constraint_enforcement(db_session: AsyncSession):
    """Verifies that foreign key violations (e.g. invalid role_id) raise IntegrityError."""
    bad_inv = Interview(
        id=uuid.uuid4(),
        role_id=uuid.uuid4(),  # Non-existent role ID
        candidate_name="Ghost",
        candidate_email="ghost@test.com",
        token="tok_ghost_999",
        status="created",
    )
    db_session.add(bad_inv)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()
