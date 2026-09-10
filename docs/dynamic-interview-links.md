# Dynamic Interview Link Generation

## Overview
This feature allows administrators to dynamically configure AI interviews (including job descriptions, specific role titles, custom questions, and evaluation criteria) from the frontend `/admin/setup` page, generate a unique link, and share it with candidates.

## Architecture & Data Flow
1. **Frontend Setup (`src/app/admin/setup/page.tsx`)**:
   - The user fills out a React form.
   - On submission, a `POST` request is sent to `http://localhost:8000/admin/interviews`.
2. **Backend Configuration Storage (`backend/core/interview_store.py`)**:
   - The backend creates an `InterviewConfig` object.
   - It stores this object in an in-memory dictionary keyed by a generated UUID (`interview_id`).
   - The API responds with the `interview_id`.
3. **Link Generation**:
   - The frontend constructs a shareable link: `${origin}/?id=${interview_id}`.
4. **The Candidate Journey (`src/app/page.tsx`)**:
   - The candidate visits the URL with the `?id=...` parameter.
   - The main interview room now reads this ID and establishes the session when it boots up.
   - The backend (`session.py`) looks up the specific `InterviewConfig` and attaches it to a new `SessionState`.
   - The `llm_evaluator` and `_process_candidate_turn` logic dynamically use the session's attached config (overriding the global `rubric_config.py`).
