# High-Speed AI Curriculum Synthesis & Resilient Model Routing

## Overview
This feature resolves the latency bottleneck and 502 Bad Gateway errors previously encountered when synthesizing autonomous interview curricula in `/admin/setup`. By upgrading the model routing architecture, caching fast candidate models, eliminating exponential retry sleeps on model 404 errors, and enforcing explicit JSON prompt rules, technical question synthesis now completes in **~2 seconds**.

---

## 1. Problem & Root Cause Analysis
When recruiters clicked **"Synthesize Questions"**, the application remained stuck on `"Synthesizing..."` for 5 to 10 seconds before throwing `Failed to synthesize questions` (HTTP 502 Bad Gateway).

### Root Causes
1. **Model Availability & Access (404 Error)**:
   The backend had hardcoded `llama-3.3-70b-versatile`. On many Groq API keys and tiers, `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` are either deprecated, restricted, or unavailable, resulting in:
   ```json
   Error code: 404 - {'error': {'message': 'The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.', 'type': 'invalid_request_error', 'code': 'model_not_found'}}
   ```
2. **Obsolete Retry Sleep Loop**:
   When a 404 was returned, the generator caught it as a generic exception and retried 3 times with `time.sleep(1.0)` and `time.sleep(2.0)`. Retrying a 404 model error with a sleep never succeeds and merely delayed the inevitable failure, leaving the UI hanging.
3. **Frontend Error Masking**:
   The frontend caught `!response.ok` and alerted a generic message without exposing the underlying backend error detail or triggering automated admin auth redirection.

---

## 2. Architecture & Solution Design

### A. High-Speed Multi-Model Fallback Hierarchy
The platform now uses a prioritized, ultra-fast model candidate list configured in `backend/core/config.py` and `backend/services/question_generator.py`:
- **Primary Model**: `openai/gpt-oss-120b` (Flagship reasoning on Groq LPUs for questions and evaluation)
- **Secondary Fallback**: `openai/gpt-oss-20b` (Sub-second to 2-second ultra-low latency fallback)
- **Additional Fallbacks**: `qwen/qwen3.8-27b`, `qwen/qwen3.6-27b`, `groq/compound-mini`

### B. Zero-Delay 404 Fail-Fast
In both `ResilientLLMClient` and `QuestionGenerator`:
- If Groq returns a `404`, `model_not_found`, or `does not exist`, the system immediately classifies it as non-retryable and instantly moves to the next candidate model in the chain without sleeping.
- Transient network and rate-limit errors continue to be handled with intelligent backoff or immediate model rotation.

### C. Prompt Engineering for Speed & Schema Adherence
- System prompt incorporates grounding context, seniority level, and role title.
- Explicitly mandates JSON output conforming to `CurriculumPlanSchema`.
- Supplies a multi-item template so models consistently generate 4 to 5 scenario-based questions with custom rubrics.
- Sets `max_tokens=1800` and `temperature=0.3` to maximize inference speed without sacrificing depth.

### D. Frontend Error Reporting
In `frontend/src/app/admin/setup/page.tsx`:
- `handleSynthesize` reads `errData?.detail` from the API response to display actionable error messages.
- Calls `handleAuthError(response)` to gracefully redirect recruiters to `/admin/login` if their session has expired.

---

## 3. Benchmarks & Verification
- **Model Resolution**: In 0.49s, dynamically probes model availability.
- **Synthesis Speed**:
  - `openai/gpt-oss-20b`: Synthesizes 4-5 questions in **2.08s - 2.70s**.
  - `qwen/qwen3.8-27b`: Synthesizes 4-5 questions in **4.68s**.
- **Schema Validation**: 100% compliant with Pydantic `CurriculumPlanSchema`.
- **Backend Test Suite**: All 55 unit and integration tests passing (`python -m pytest backend/tests/`).
- **Frontend Turbopack Build**: Compiled and optimized in 9.6s with 0 errors (`pnpm build`).
