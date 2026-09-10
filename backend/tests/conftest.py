import datetime
import json
import os
import sys
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import event

# Ensure backend root is on sys.path
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

os.environ["TESTING"] = "true"
os.environ["GROQ_API_KEY"] = "mock_groq_key_for_testing_purposes"

from main import app
from core.database import get_db
from models.base import Base
from models.user import User
from models.company import Company
from models.role import Role
from models.interview import Interview
from models.report import Report
from models.transcript import Transcript
from core.security import (
    create_access_token,
    create_interview_token,
    hash_password,
)
from core.session import session_store
from routers.auth import limiter

# Disable SlowAPI rate limiting during test executions to prevent 429 false-positives
limiter.enabled = False

# In-memory async SQLite engine for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

@event.listens_for(test_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides an isolated in-memory database session for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestAsyncSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db_session: AsyncSession) -> TestClient:
    """FastAPI TestClient with get_db dependency overridden to in-memory test DB."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def seed_test_data(db_session: AsyncSession):
    """Seeds a test company, roles, and admin/recruiter users."""
    company = Company(name="Test Acme Labs")
    db_session.add(company)
    await db_session.flush()

    admin = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password=hash_password("adminpass123"),
        role="admin",
        company_id=company.id,
        is_active=True,
    )
    recruiter = User(
        email="recruiter@test.com",
        full_name="Test Recruiter",
        hashed_password=hash_password("recruiterpass123"),
        role="recruiter",
        company_id=company.id,
        is_active=True,
    )
    db_session.add_all([admin, recruiter])
    await db_session.flush()

    role = Role(
        title="Test Software Engineer",
        description="Senior Fullstack role",
        company_id=company.id,
        rubric={
            "architecture": {"score": 4.0, "weight": 0.5, "weighted_score": 2.0, "evidence_count": 2},
            "communication": {"score": 4.0, "weight": 0.5, "weighted_score": 2.0, "evidence_count": 2},
        },
    )
    db_session.add(role)
    await db_session.commit()

    return {
        "company": company,
        "admin": admin,
        "recruiter": recruiter,
        "role": role,
    }


@pytest.fixture
def admin_token(seed_test_data) -> str:
    admin = seed_test_data["admin"]
    return create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role})


@pytest.fixture
def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def recruiter_token(seed_test_data) -> str:
    recruiter = seed_test_data["recruiter"]
    return create_access_token({"sub": str(recruiter.id), "email": recruiter.email, "role": recruiter.role})


@pytest.fixture
def recruiter_headers(recruiter_token) -> dict:
    return {"Authorization": f"Bearer {recruiter_token}"}


@pytest.fixture
def candidate_token() -> str:
    return create_interview_token(interview_id="test-candidate-interview-1", candidate_email="candidate@test.com")


@pytest.fixture
def candidate_headers(candidate_token) -> dict:
    return {"Authorization": f"Bearer {candidate_token}"}


@pytest.fixture
def expired_token() -> str:
    import jwt
    from core.config import settings
    payload = {
        "sub": str(uuid.uuid4()),
        "email": "expired@test.com",
        "type": "access",
        "exp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1),
        "iat": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def tampered_token() -> str:
    import jwt
    payload = {"sub": str(uuid.uuid4()), "type": "access"}
    return jwt.encode(payload, "wrong_secret_key_tampered_1234567890", algorithm="HS256")


@pytest.fixture(autouse=True)
def reset_sessions():
    """Resets the in-memory session store before and after each test."""
    session_store.clear()
    yield
    session_store.clear()


# Test results recording for test-reports summary
_TEST_RESULTS = []

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call":
        _TEST_RESULTS.append({
            "nodeid": item.nodeid,
            "passed": report.passed,
            "failed": report.failed,
            "skipped": report.skipped,
            "longrepr": str(report.longrepr) if report.failed else "",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })


_session_exitstatus = 0


@pytest_asyncio.fixture(scope="session", autouse=True)
async def cleanup_database_engines():
    """Session-scoped async teardown ensuring all aiosqlite connections are properly closed."""
    yield
    try:
        await test_engine.dispose()
    except Exception:
        pass
    try:
        from core.database import engine as prod_engine
        await prod_engine.dispose()
    except Exception:
        pass


def pytest_sessionfinish(session, exitstatus):
    global _session_exitstatus
    _session_exitstatus = exitstatus

    reports_dir = os.path.join(os.getcwd(), "test-reports")
    os.makedirs(reports_dir, exist_ok=True)
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file_path = os.path.join(reports_dir, f"report_{timestamp_str}.md")

    passed_count = sum(1 for r in _TEST_RESULTS if r["passed"])
    failed_count = sum(1 for r in _TEST_RESULTS if r["failed"])
    skipped_count = sum(1 for r in _TEST_RESULTS if r["skipped"])
    total_count = len(_TEST_RESULTS)

    lines = [
        f"# Test Execution Report — {timestamp_str}",
        "",
        f"**Summary:** {passed_count} Passed, {failed_count} Failed, {skipped_count} Skipped (Total: {total_count})",
        "",
    ]
    if failed_count == 0:
        lines.append("All tests passed successfully!")
    else:
        lines.append("## Failures")
        for r in _TEST_RESULTS:
            if r["failed"]:
                lines.append(f"### `{r['nodeid']}`")
                lines.append(f"```\n{r['longrepr']}\n```")

    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


@pytest.hookimpl(trylast=True)
def pytest_unconfigure(config):
    """
    Final teardown hook executed after all tests, session finish, and terminal summaries are printed.
    Prints execution diagnostic logs and terminates the process with the proper exit status,
    preventing any unjoined non-daemon background threads (e.g. from telemetry or connection pools)
    from hanging Python shutdown.
    """
    import os
    import threading

    alive_threads = [t for t in threading.enumerate() if t != threading.main_thread() and t.is_alive()]
    print(f"\n[Pytest Teardown] Tests complete. Active background threads ({len(alive_threads)}):")
    for t in alive_threads:
        print(f"  - {t.name} (daemon={t.daemon})")

    print(f"[Pytest Teardown] Releasing process with exit code {_session_exitstatus}...")
    sys.stdout.flush()
    os._exit(_session_exitstatus)
