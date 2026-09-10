# Resilient Audio Interview Lifecycle & Error Recovery

## Overview
This feature introduces complete lifecycle resilience for candidate audio message handling, multi-turn interview flow, automatic error recovery, and seamless interview conclusion states.

## Key Changes
1. **Multi-Question Adaptive Interview Generation**:
   - The admin setup router (`backend/routers/admin.py`) now structures comprehensive 5-phase interview flows tailored to the role, company name, and rubric skills when no custom questions are provided.
   - Prevents premature session completion after only 1 question.

2. **Graceful Completion & Safe HTTP Error Handling**:
   - `_process_candidate_turn` and `POST /interview/{session_id}/audio-message` in `backend/routers/interview.py` return structured completion responses rather than throwing raw 400 Bad Request errors when an interview finishes.
   - Provides clear error messaging for empty audio payloads, inaudible speech, or transient errors.

3. **Groq API & STT Retry Loop with Fallback**:
   - `backend/core/llm.py` and `backend/core/stt.py` implement an exponential backoff retry loop (up to 2 retries) for transient network glitches, 429 rate limits, and JSON parsing issues.
   - If repeated LLM API calls fail, fallback deterministic evaluations ensure the live candidate interview never crashes with a 502 Bad Gateway.

4. **Frontend Dynamic Room & Visual Status Feedback**:
   - `src/app/page.tsx` dynamically displays the role title, company name, live elapsed timer, recording pill indicator, transcribing status indicator, and a finalized completion card.
   - Handles speech synthesis cleanly and avoids sending extra audio once concluded.
