# 55 Green Lights: Locking Down Conlatus with Pytest 🛡️🧪

Pour yourself a double espresso, team! ☕️⚡️

You know that feeling when you refactor a massive multi-layer codebase with async databases, JWT authentication, state-machine dialogue engines, and audio processing pipelines... and you wonder: *"Does it actually hold up under pressure without tripping over itself?"*

Well, wonder no more. Today, we built and executed a **55-test modular test suite** using **pytest** and **pytest-asyncio** that validates every single layer of Conlatus from in-memory SQLite tables to LLM rate-limit backoffs.

Result? **55 passed, 0 failed, 100% green across the board.** 🎉

---

### What's in the Test Pyramid? 🏛️

We structured our tests to test every critical boundary in total isolation, with **zero external dependencies** (no live Groq API keys or external Postgres instances needed):

1. **Database Layer (`test_database.py` - 4 tests)**
   - Spins up a dedicated in-memory async SQLite engine (`sqlite+aiosqlite:///:memory:`).
   - Enforces foreign key constraints via `PRAGMA foreign_keys=ON` on connection.
   - Tests transaction lifecycles, dirty rollback recovery, and cascade deletions (e.g., nuking a `Role` cleanly cascades to its `Interview`, `Transcript`, and `Report` children).

2. **Authentication & RBAC (`test_auth.py` - 12 tests)**
   - Tests bcrypt password hashing, duplicate email detection, and inactive account blocks.
   - Verifies stateless JWT access tokens, refresh token rotation, and invalid/expired/tampered token rejection.
   - Validates RBAC permissions between candidates, recruiters, and admins.

3. **Adaptive Dialogue Engine (`test_dialogue_engine.py` - 7 tests)**
   - Tests our dynamic probe state machine: vague candidate answers trigger `ProbeDecision.DEEPEN` to dig deeper, while crisp answers trigger `ProbeDecision.PIVOT` to advance questions.
   - Validates strict followup budget caps (forced pivot when candidate exceeds max followups) and safety ceilings (`length_limited` termination).
   - Exercises candidate edge cases: 10,000-character essays, empty strings, and dense technical jargon.
   - Validates `ResilientLLMClient` exponential backoff and jitter on 429 rate limits, plus instant fail-fast on 401 auth errors.

4. **Curriculum Synthesis (`test_question_generator.py` - 3 tests)**
   - Validates structured topic intake, seniority rubric formulation, and graceful error bubbling when LLM keys are absent.

5. **Dual-Pass Report Engine (`test_reports.py` - 5 tests)**
   - Tests Pass-1 deterministic weighted criteria scoring math against passing thresholds.
   - Tests Pass-2 holistic qualitative synthesis with verbatim quote extraction.
   - Confirms that requesting reports for in-progress interviews returns `400 Bad Request`.
   - Validates recruiter override recording (`POST /api/v1/reports/{id}/decision`).

6. **Admin Telemetry & Portal (`test_admin_api.py` - 7 tests)**
   - Validates `GET /admin/overview` metric aggregation, candidate filtering & search, and settings CRUD.

7. **Full Interview Loop (`test_interview_loop.py` - 7 tests)**
   - Multi-turn candidate simulation through `/interview/start`, `/interview/{session_id}/message`, and `/interview/{session_id}/status`.

8. **Audio & Voice Turn Handoff (`test_audio_tts.py` - 6 tests)**
   - Punctuation chunking for streaming TTS audio, Whisper STT transcript handoff into the dialogue loop, and empty audio rejection.

9. **Deterministic Rubric Math (`test_rubric_scoring.py` - 4 tests)**
   - Weighted score accuracy, boundary thresholds, and `INCOMPLETE` failsafes.

---

### War Stories & Bugs Smashed Along the Way 🐛🔨

Building an exhaustive test suite is like turning on the stadium floodlights in an empty attic — you're bound to find a few critters. Here are the gems we caught and fixed:

- **The FastAPI Query Param Ambush:**
  In `api/deps.py`, `verify_interview_token(token: str)` didn't have `= Depends(get_token_from_header_or_cookie)`. FastAPI's dependency injection treated `token: str` as a required query parameter (`?token=...`), returning `422 Unprocessable Entity` even with valid `Authorization: Bearer` headers! Adding the extractor dependency fixed it instantly.

- **SlowAPI Rate Limiter Tripping the Test Runner:**
  When executing 55 tests in 14 seconds, our `/interview/start` endpoint rate limiter (`5/minute`) dutifully started firing `429 Too Many Requests`. In `conftest.py`, we set `limiter.enabled = False` during test execution so automated test runs don't get throttled.

- **Dialogue Manager Config Fallback:**
  When candidates started an interview without a custom interview configuration ID, `session.interview_config` was `None`. The dialogue manager was defaulting `active_questions` to `[]`, causing an `IndexError` on turn 1. We wired in clean fallbacks to `rubric_config.QUESTIONS` and `rubric_config.RUBRIC_CRITERIA`.

- **Candidate vs Interviewer Turn Indexing:**
  In `test_audio_tts.py`, asserting `conversation_history[-1]` failed because after processing candidate speech, the dialogue engine appends the *interviewer's* next question turn. Filtering for candidate turns fixed the assertion cleanly.

---

### How to Run the Suite 🚀

```bash
cd backend
python -m pytest tests -v
```

14 seconds, 55 tests, zero failures. Clean, deterministic, and rock solid! 🚢
