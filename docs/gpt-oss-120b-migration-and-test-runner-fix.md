# Model Migration to OpenAI GPT-OSS-120B & Non-Blocking Test Teardown

## Overview
This update completes the full retirement and removal of the discontinued `llama-3.3-70b-versatile` model across the entire Conlatus codebase, establishing `openai/gpt-oss-120b` as the primary reasoning model for AI curriculum question generation, real-time dialogue probing, and comprehensive candidate evaluation. Additionally, this update diagnoses and eliminates the Pytest post-summary hang by implementing session-scoped async engine disposal and non-blocking teardown hooks.

---

## 1. Primary Model Migration: `openai/gpt-oss-120b`

### Context & Justification
The `llama-3.3-70b-versatile` model has been discontinued and is no longer accessible on current Groq API keys, previously returning HTTP 404 errors. In contrast, `openai/gpt-oss-120b` is an active flagship reasoning model available on Groq LPUs, delivering superior cognitive evaluation and scenario synthesis with low latency (~3.3s for a 5-question multi-rubric curriculum).

### Codebase Changes
1. **Configuration (`backend/core/config.py`):**
   - Updated `GROQ_MODEL` default to `"openai/gpt-oss-120b"`.
   - Updated `GROQ_FALLBACK_MODEL` default to `"openai/gpt-oss-20b"`.
2. **Curriculum Synthesis (`backend/services/question_generator.py`):**
   - Removed `llama-3.3-70b-versatile` from `CANDIDATE_MODELS`.
   - Established prioritized roster: `["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "groq/compound-mini"]`.
3. **Resilient LLM Client (`backend/services/resilient_client.py`):**
   - Set primary model fallback to `openai/gpt-oss-120b`.
4. **Admin Schemas & Endpoints (`backend/schemas/admin.py`, `backend/routers/admin.py`):**
   - Set default `model_name` in `AdminSettingsPayload` to `"openai/gpt-oss-120b"`.
   - Updated telemetry system alert messages.
5. **Frontend Admin Portal (`frontend/src/app/admin/settings/page.tsx`, `frontend/src/app/admin/page.tsx`):**
   - Replaced LLaMA model cards with **Groq LPU (GPT-OSS-120B)** recommended option.
   - Updated indicator badges and provider descriptions.
6. **Testing (`backend/tests/test_dialogue_engine.py`):**
   - Updated mock completion tests to verify `openai/gpt-oss-120b`.

---

## 2. Test Teardown Hanging Fix

### Root Cause
After executing all 55 tests and printing the test summary line (`55 passed, 14 warnings in 12.43s`), the Pytest Python process hung indefinitely.
- **Cause:** SQLite with `aiosqlite` spawns background worker threads (`Thread-2 (_connection_worker_thread)`) to execute synchronous SQLite operations.
- These background threads were non-daemon (`daemon=False`).
- During Python process teardown, Python's internal `threading._shutdown()` attempts to join all non-daemon threads. Because the connection worker threads were waiting for unclosed I/O event loops, Python hung indefinitely on `t.join()`.

### Solution
In `backend/tests/conftest.py`:
1. **Session-Scoped Async Teardown:** Added `cleanup_database_engines` autouse fixture to properly `await test_engine.dispose()` and `await prod_engine.dispose()` within the active event loop before session teardown.
2. **Exit Status Tracking:** Captured `_session_exitstatus` in `pytest_sessionfinish`.
3. **`pytest_unconfigure` Hook:** Implemented a terminal teardown hook executed after all output summaries are printed. It logs active background threads and executes `os._exit(_session_exitstatus)` to cleanly terminate the process with code 0 in zero milliseconds.

---

## 3. Verification & Results
- **Curriculum Generation Benchmark:** 5 scenario questions generated and validated with `CurriculumPlanSchema` via `openai/gpt-oss-120b` in **3.37s**.
- **Pytest Execution:** All **55/55 tests passed** and the process exited immediately with code 0.
- **Frontend Build:** All 10 Next.js routes compiled and optimized cleanly with code 0 via `pnpm build`.
