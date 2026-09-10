# Interview Router Hardening & Dual Package Manager (NPM / PNPM) Compatibility

## Overview
This document details the architectural fixes and enhancements made to [`backend/routers/interview.py`](file:///backend/routers/interview.py) to resolve import resolution errors, background task serialization exceptions, and establish dual package manager compatibility (`npm` and `pnpm`) across the repository.

---

## Key Changes in `backend/routers/interview.py`

1. **Import Path Correction (`calculate_verdict`):**
   - Corrected the fallback import path from `backend.core.rubric_scoring` to `backend.services.rubric_scoring`, eliminating `ModuleNotFoundError` when importing the interview router from outside the `backend/` directory.

2. **Automated `sys.path` Resolution:**
   - Injected proactive root path discovery at module initialization:
     ```python
     _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
     if _backend_dir not in sys.path:
         sys.path.insert(0, _backend_dir)
     ```
   - Guarantees seamless imports whether running via Uvicorn, pytest, or external worker scripts.

3. **Resilient Background Task Scheduling:**
   - Added protective exception handling around background report generation tasks:
     ```python
     try:
         interview_uuid = uuid.UUID(session_id)
         bg_tasks.add_task(report_generator.generate_report_background, interview_uuid)
     except (ValueError, TypeError, AttributeError):
         logger.debug(f"Session {session_id} is not a valid UUID; skipping database report generation.")
     ```
   - Prevents unhandled exceptions if an in-memory session or test runner utilizes non-standard session identifier formats.

4. **Dynamic Import Fallbacks:**
   - Added robust import fallbacks for `services.dialogue_manager` and `services.report_generator`.

---

## Dual Package Manager Compatibility (NPM & PNPM)

1. **Root Workspaces Setup (`package.json`):**
   - Added `"workspaces": ["frontend"]` to the root `package.json`, allowing a single `npm install` command to resolve and install dependencies across the monorepo.

2. **Cross-Manager Scripts:**
   - Standardized scripts to use the universal `--prefix` convention:
     ```json
     {
       "workspaces": ["frontend"],
       "scripts": {
         "backend": "python -m uvicorn main:app --reload --port 8000 --app-dir backend",
         "frontend": "npm --prefix frontend run dev",
         "dev": "npm --prefix frontend run dev",
         "test:backend": "python -m pytest backend/tests",
         "build:frontend": "npm --prefix frontend run build",
         "lint:frontend": "npm --prefix frontend run lint"
       }
     }
     ```
   - Works seamlessly with both `npm` (`npm run frontend`, `npm run backend`) and `pnpm` (`pnpm frontend`, `pnpm backend`).

3. **Documentation Update (`README.md`):**
   - Rewrote the quickstart section in [`README.md`](file:///README.md) to showcase `npm` as the default setup while maintaining explicit references and parity for `pnpm` users.
