# Comprehensive Modular Test Suite

## Overview
The Conlatus test suite provides an exhaustive, automated verification pyramid validating every layer of the application in strict isolation and across integration boundaries. Built with **pytest**, **pytest-asyncio**, and **HTTPX/Starlette TestClient**, the test suite executes with zero external dependencies, leveraging in-memory asynchronous SQLite and mocked LLM doubles.

---

## Test Architecture & Coverage Matrix

| Test Module | Coverage Domain | Key Invariants Tested |
| :--- | :--- | :--- |
| [`tests/test_database.py`](file:///backend/tests/test_database.py) | Async SQLAlchemy 2.0 ORM | Session lifecycle & rollbacks, foreign key constraint enforcement, cascade deletions (Role $\to$ Interviews $\to$ Transcripts/Reports). |
| [`tests/test_auth.py`](file:///backend/tests/test_auth.py) | Stateless JWT & Security | User registration, duplicate email rejection, bcrypt verification, inactive account blocks, `/api/v1/auth/me`, expired/tampered JWT rejection, refresh token rotation, logout. |
| [`tests/test_dialogue_engine.py`](file:///backend/tests/test_dialogue_engine.py) | State Machine & Probing | Dynamic `DEEPEN` probe on vague answers, `PIVOT` advancement on thorough answers, followup budget exhaustion forced transitions, runtime safety ceilings (`length_limited`), edge cases (empty strings, 10k characters, dense technical jargon). |
| [`tests/test_question_generator.py`](file:///backend/tests/test_question_generator.py) | Curriculum Synthesis | Topic intake & schema validation, seniority-calibrated rubric generation, missing API key error handling (`LLMMissingApiKeyError`), Groq 429 rate limit backoff. |
| [`tests/test_reports.py`](file:///backend/tests/test_reports.py) | Dual-Pass Report Engine | Pass-1 deterministic criteria scoring, Pass-2 holistic qualitative synthesis with verbatim quote extraction, lazy report generation rejection for in-progress interviews, recruiter override decision persistence. |
| [`tests/test_admin_api.py`](file:///backend/tests/test_admin_api.py) | Admin & Recruiter Portal | `GET /admin/overview` metric aggregation, `GET /admin/candidates` with search and status filtering, `GET /admin/candidates/{id}`, `POST /admin/candidates/{id}/decision`, `GET/POST /admin/settings`, 401 unauthenticated rejection. |
| [`tests/test_interview_loop.py`](file:///backend/tests/test_interview_loop.py) | Full Interview Lifecycle | End-to-end multi-turn interview loop (`/interview/start`, `/interview/{session_id}/message`, `/interview/{session_id}/status`), adaptive followup budgeting, safety ceilings, rubric configuration validation. |
| [`tests/test_audio_tts.py`](file:///backend/tests/test_audio_tts.py) | STT & Audio Turn Handoff | Whisper transcription handoff into interview state machine, sentence boundary punctuation chunking for TTS streaming, empty audio file rejection. |
| [`tests/test_rubric_scoring.py`](file:///backend/tests/test_rubric_scoring.py) | Deterministic Rubric Math | Weighted criteria calculations, exact boundary threshold handling, missing criteria failsafes (`INCOMPLETE` verdict). |

---

## Isolation & Mocking Strategy

1. **In-Memory SQLite Engine:**
   - Tests run against an isolated `sqlite+aiosqlite:///:memory:` database engine created per test run.
   - All tables are created in memory and foreign key constraints are strictly enforced via `@event.listens_for(test_engine.sync_engine, "connect")` issuing `PRAGMA foreign_keys=ON`.
   - FastAPI `get_db` dependency is overridden with a function-scoped async test session that automatically rolls back after each test.

2. **Mock LLM Doubles:**
   - Groq API calls are mocked using `unittest.mock.patch` returning typed `EvaluationEnvelope` payloads or deterministic `_mock_evaluate` outputs.
   - Zero live API calls are dispatched during test runs, allowing fast, deterministic offline execution.

3. **Rate Limiting Disabling:**
   - SlowAPI rate limiting is explicitly disabled during test runs (`limiter.enabled = False` in `conftest.py`), eliminating 429 false positives during rapid test execution.

4. **Session Store Isolation:**
   - In-memory interview `session_store` is cleared before and after every test via an autouse fixture (`reset_sessions`).

---

## Execution Guide

To run the complete test suite:

```bash
# Navigate to backend directory
cd backend

# Execute all tests with verbose output
python -m pytest tests -v
```

To run a specific test module:

```bash
python -m pytest tests/test_dialogue_engine.py -v
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_admin_api.py -v
```

---

## Verification Results
- **Total Tests:** 55
- **Passed:** 55 (100%)
- **Failed:** 0
- **Execution Time:** ~14 seconds
