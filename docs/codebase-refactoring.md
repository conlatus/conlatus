# Codebase Architecture Refactoring: Standalone /backend and /frontend

## 1. Overview & Motivation
Prior to this refactoring, the repository suffered from confusing directory nesting:
- The backend application was buried deep within `backend/conlatus/backend`, with virtual environments and tests fragmented under `backend/conlatus/`.
- The frontend codebase (Next.js App Router, Tailwind CSS, and components) was sitting at the workspace root alongside global project configs.
- Starting the applications required navigating deeply into individual directories with error-prone manual command paths.

This refactor establishes clean separation of concerns with top-level `/backend` and `/frontend` directories, coordinated by root-level workspace tooling.

---

## 2. Directory Architecture

```
Set-main.app/
├── backend/                       # Dedicated Python FastAPI application
│   ├── core/                      # LLM evaluator, STT, TTS, SessionStore, InterviewStore
│   ├── models/                    # Pydantic schemas (schemas.py)
│   ├── routers/                   # FastAPI APIRouters: interview.py & admin.py
│   ├── static/                    # Developer test dashboard (dashboard.html)
│   ├── tests/                     # Pytest suite (all 17 unit & integration tests)
│   ├── .env & .env.example        # Environment configuration
│   ├── requirements.txt           # Python backend dependencies
│   ├── main.py                    # Entrypoint with self-hosting uvicorn runner
│   └── rubric_config.py           # Default scoring rubrics & questions
├── frontend/                      # Dedicated Next.js frontend
│   ├── src/                       # App router, components, hooks
│   ├── public/                    # Assets and svgs
│   ├── package.json               # Frontend dependencies & Next scripts
│   ├── tsconfig.json              # TypeScript configuration with @/* aliases
│   └── next.config.mjs            # Next.js configuration
├── package.json                   # Root orchestration scripts
├── pnpm-workspace.yaml            # PNPM workspace definition
├── README.md                      # Unified quickstart guide
├── docs/                          # Architecture & feature documentation
├── READMEs/                       # Feature registry (FEATURES.md)
└── .dev/devlogs/                  # Devlog narratives
```

---

## 3. Key Technical Changes

### A. Backend Flattening & Flexible Module Resolution
1. **Flattened Directory Hierarchy:** Extracted all backend files from `backend/conlatus/backend` directly to `/backend`, and tests to `/backend/tests`.
2. **Resilient Dynamic Imports:** In `main.py`, `routers/`, `core/`, and `tests/conftest.py`, added runtime `sys.path` bootstrapping and `try/except ImportError` blocks. Modules now resolve seamlessly whether invoked via `python backend/main.py`, `python -m pytest backend/tests`, or `uvicorn main:app --app-dir backend`.
3. **Optional `interview_id` Fallback:** In `backend/models/schemas.py`, adjusted `StartInterviewRequest` so `interview_id: Optional[str] = None`. In `backend/routers/interview.py`, if `interview_id` is omitted, the session falls back to default questions from `rubric_config.py`. This restored 100% backward compatibility for automated tests and the static developer dashboard.
4. **Self-Hosting Entrypoint:** Added `if __name__ == "__main__": uvicorn.run(...)` to `backend/main.py`.

### B. Frontend Isolation
1. **Directory Isolation:** Relocated `src/`, `public/`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, and frontend `package.json` into `/frontend`.
2. **Configurable Backend Target:** In `frontend/src/app/page.tsx` and `frontend/src/app/admin/setup/page.tsx`, updated fetch calls to use `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`.
3. **Verified Turbopack Compilation:** Production build verified with zero errors (`pnpm --dir frontend run build`).

### C. Single-Command Developer Experience
The root `package.json` now exposes single-command scripts:
- **Start Backend:** `pnpm backend` (starts FastAPI on port 8000 with reload enabled)
- **Start Frontend:** `pnpm frontend` (starts Next.js on port 3000)
- **Test Backend:** `pnpm test:backend` (runs all 17 pytest tests)
- **Build Frontend:** `pnpm build:frontend` (runs Next.js production build)
