# Conlatus AI Interview Platform — Sequential Implementation Prompts

This document provides a refined, dependency-ordered breakdown of the system modernization plan for the AI Interview Platform. Each prompt is structured with explicit architectural context, technical specifications, input/output schemas, target files, and concrete acceptance criteria.

---

## Roadmap & Execution Order Overview

Executing these tasks in the wrong order leads to duplicate work and rewrites. The prompts are arranged according to architectural dependency:

```
[Phase 1: Modular Database & ORM Layer]
                    │
                    ▼
[Phase 2: Security, Authentication & Session Hardening]
                    │
                    ▼
[Phase 3: Autonomous Topic & Web-Grounded Question Synthesis]
                    │
                    ▼
[Phase 4: Adaptive Conversational Engine (Production Follow-up Logic)]
                    │
                    ▼
[Phase 5: Candidate Assessment, Scoring & Comprehensive Reports]
                    │
                    ▼
[Phase 6: Admin Experience (/admin, /candidates, /settings, /setup)]
                    │
                    ▼
[Phase 7: End-to-End Modular Testing Suite & Verification]
```

---

## Prompt 1: Modular Database Layer & Multi-Database ORM Setup

### 🎯 Objective
Establish a clean, asynchronous database abstraction layer using **SQLAlchemy 2.0** and **Alembic**. The system must default to **SQLite** for zero-friction local development, while providing a modular configuration that switches seamlessly to **PostgreSQL / Supabase / Neon** in production via environment variables.

### 📁 Target Files
- `backend/core/database.py` (Engine, session factory, base metadata, dynamic dialect provider)
- `backend/core/config.py` (Pydantic Settings reading `DATABASE_URL`, pool configs, dialect flags)
- `backend/models/base.py` (Declarative base with UUID primary keys and timestamp mixins)
- `backend/models/user.py` (Admin / Recruiter accounts)
- `backend/models/company.py` (Organization metadata)
- `backend/models/role.py` (Job roles, competency definitions, rubric JSON)
- `backend/models/question.py` (Curated and generated questions)
- `backend/models/interview.py` (Interview instances, tokens, lifecycle status)
- `backend/models/transcript.py` (Turn-by-turn conversation log)
- `backend/models/report.py` (Scored reports, rubric breakdown, human decisions)
- `backend/alembic.ini` & `backend/alembic/` (Auto-generating migration environment)

### 📋 Technical Specifications
1. **Dialect-Agnostic Config:**
   - Detect dialect from `DATABASE_URL`. If `sqlite`, configure `connect_args={"check_same_thread": False}` and appropriate WAL mode. If `postgresql`, configure connection pooling (`pool_size`, `max_overflow`, `pool_pre_ping=True`).
   - Support standard PostgreSQL connection strings from Supabase and Neon (handling `sslmode=require` and pooler transaction mode).
2. **Model Definitions:**
   - Standardize JSON fields: Use `JSON` generic type (maps to `JSONB` in Postgres, text/JSON in SQLite).
   - Foreign keys: Cascade rules clearly specified (`ondelete="CASCADE"` where appropriate).
   - Relationship definitions with lazy loading / join policies to prevent N+1 queries.
3. **Database Session Dependency:**
   - Create `get_db()` FastAPI dependency yielding async/sync sessions with clean commit/rollback/close lifecycle.
4. **Migration Pipeline:**
   - Initialize Alembic with a migration script creating all initial tables.

### ✅ Acceptance Criteria
- [ ] Running backend without external services automatically spins up a functioning SQLite database (`conlatus.db`).
- [ ] Changing `DATABASE_URL` in `.env` to a Postgres connection string connects without altering any model or route code.
- [ ] Alembic migration applies cleanly: `alembic upgrade head`.
- [ ] Core tables created: `companies`, `users`, `roles`, `questions`, `interviews`, `transcripts`, `reports`.

---

## Prompt 2: Enterprise Security Hardening & Authentication (FastAPI + Next.js)

### 🎯 Objective
Implement end-to-end recruiter/admin authentication and security controls. The backend must provide stateless JWT authentication with bcrypt/argon2 password hashing, role-based access control, security headers, rate limiting, and CORS restrictions. The frontend must enforce protected routes for all `/admin/*` views.

### 📁 Target Files
- `backend/core/security.py` (Password hashing, JWT generation, JWT decoding/validation)
- `backend/schemas/auth.py` (LoginRequest, TokenResponse, UserResponse)
- `backend/routers/auth.py` (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`, `/api/v1/auth/refresh`)
- `backend/api/deps.py` (`get_current_user`, `get_current_admin`, `verify_interview_token`)
- `backend/main.py` (CORS configuration, security middleware, rate limiter integration)
- `frontend/src/middleware.ts` (Next.js route guard for `/admin/*`)
- `frontend/src/app/admin/login/page.tsx` (Admin login page with secure token storage)
- `frontend/src/context/AuthContext.tsx` (Client-side auth state and token refresh)

### 📋 Technical Specifications
1. **Security & Cryptography:**
   - Use `passlib` with `bcrypt` or `argon2` for password hashing.
   - Use `python-jose` or `pyjwt` with HMAC-SHA256 (`HS256`) or RSA (`RS256`).
   - Configurable token expiry via `.env` (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 60 min; `REFRESH_TOKEN_EXPIRE_DAYS`, default 7 days).
2. **API Protection:**
   - Protect all admin endpoints with `Depends(get_current_user)`.
   - Separate candidate session authentication: Candidate links use secure, signed single-use session tokens (`/interview/start` & live websockets/routes) without requiring candidate user registration.
3. **Application Hardening:**
   - Restrict CORS from `*` to configured frontend origins (e.g., `http://localhost:3000`, production domain).
   - Add security headers middleware: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`.
   - Implement IP-based or token-based rate limiting on sensitive routes (`/auth/login`, `/interview/chat`) using `slowapi`.
4. **Frontend Route Guards:**
   - Next.js middleware checks for auth token on any `/admin/*` route; redirects unauthenticated visitors to `/admin/login`.
   - Implement seamless token storage (HTTP-only cookies or memory + secure storage) and automatic 401 redirect handling.

### ✅ Acceptance Criteria
- [ ] Calling protected endpoints without `Authorization: Bearer <token>` returns `401 Unauthorized`.
- [ ] Admin login returns JWT tokens with valid expiration; `/api/v1/auth/me` returns current user details.
- [ ] Visiting `/admin` in the browser unauthenticated immediately redirects to `/admin/login`.
- [ ] Password hashes in the DB are never plain-text; brute-force attacks on `/auth/login` are throttled.

---

## Prompt 3: Autonomous Topic-to-Question Synthesis & Real-World Web Grounding

### 🎯 Objective
Empower recruiters to specify high-level topics, technical focus areas, seniority levels, or job prompts, and have the AI autonomously synthesize authentic, production-grade interview questions. Questions must be grounded in real-world engineering challenges rather than generic textbook trivia, complete with competency tags and evaluation criteria.

### 📁 Target Files
- `backend/services/question_generator.py` (LLM-guided curriculum designer & web-grounding pipeline)
- `backend/services/web_research.py` (Search/grounding provider to fetch contemporary engineering scenarios, RFCs, and real-world postmortems)
- `backend/schemas/question_generation.py` (TopicGenerationRequest, GeneratedQuestionSchema, CurriculumPlanSchema)
- `backend/routers/admin_questions.py` (`POST /admin/generate-questions`, `POST /admin/roles/{id}/curriculum`)
- `frontend/src/app/admin/setup/page.tsx` (Enhanced interview setup UI supporting autonomous topic mode)

### 📋 Technical Specifications
1. **Intake Capabilities:**
   - Input: Role title (e.g. "Senior Distributed Systems Engineer"), Topic keywords (e.g. "Kafka partition rebalancing, Raft consensus, memory leaks"), Seniority level ("Junior", "Mid", "Senior", "Staff"), Context prompt / Job description.
2. **Synthesis & Real-World Grounding:**
   - Service prompts LLM with strict few-shot patterns based on real-world system designs, architecture trade-offs, debugging drills, and failure postmortems.
   - Grounding query generator synthesizes search queries to find contemporary architectural trends, real open-source issues, or production incident patterns.
   - Generates structured output:
     - `text`: Scenario-based question prompt with concrete context.
     - `competency_tag`: Target skill (e.g., "Fault Tolerance", "Concurrency").
     - `difficulty`: 1 to 5 scale.
     - `expected_signals`: Key indicators of a strong answer vs red flags.
     - `rubric_criteria`: Specific grading facets for this question.
3. **Admin Review & Customization Flow:**
   - The generated curriculum is returned to the frontend for one-click admin review, reordering, editing, or re-generating before committing to the database.

### ✅ Acceptance Criteria
- [ ] Submitting a prompt like "Mid-level React engineer with focus on performance optimization and WebSockets" generates 4-6 deep scenario questions with evaluation rubrics.
- [ ] Questions emphasize real trade-offs (e.g., bundle size vs code splitting, re-render profiling) rather than generic definitions ("What is useState?").
- [ ] Questions are saved to the database linked to the interview configuration.
- [ ] Setup UI in frontend allows toggling between "Manual Questions" and "AI Autonomous Synthesis".

---

## Prompt 4: Production-Grade Conversational Interview Engine & Adaptive Probing

### 🎯 Objective
Re-architect the interview conversation engine (`backend/core/llm.py` and `backend/routers/interview.py`). Replace the rigid, hardcoded 3-followup rollback loop with a production-grade conversational state machine. The engine must dynamically assess candidate depth, adjust probing strategy, implement resilient exponential backoff retry logic for LLM calls, and transition smoothly across questions.

### 📁 Target Files
- `backend/core/llm.py` (Refactored LLM orchestrator, structured response parsers, retry policies)
- `backend/services/dialogue_manager.py` (Conversational state machine, probe policies, turn planner)
- `backend/services/resilient_client.py` (Exponential backoff, fallback models, circuit breaker)
- `backend/routers/interview.py` (Cleaned route handler delegating to dialogue manager)
- `backend/schemas/dialogue.py` (TurnState, ProbeDecision, EvaluationEnvelope)

### 📋 Technical Specifications
1. **Eliminate Hardcoded Rollbacks:**
   - Remove static counter checks (`followup_count >= 3`).
   - Replace with an **Adaptive Dialogue Policy** based on:
     - *Information Entropy & Coverage:* Has the candidate provided sufficient signal on the target competencies?
     - *Response Quality:* Is the response rich (move forward), ambiguous (targeted probe), or completely evasive (gentle pivot/nudge)?
     - *Candidate Fatigue / Time Budget:* Dynamic ceiling that adjusts based on question importance and interview time elapsed.
2. **Conversational Action Space:**
   - The LLM evaluator decides one of four actions per turn:
     - `DEEPEN`: Candidate touched on an interesting point; probe deeper technically.
     - `CLARIFY`: Candidate gave a vague answer; ask for specific metrics, architectural choices, or code rationale.
     - `PIVOT`: Candidate has demonstrated mastery or hit diminishing returns; transition gracefully to the next topic.
     - `CONCLUDE`: All competencies covered or interview time budget reached.
3. **Resilient AI Retry & Fallback Logic:**
   - Implement retry logic using `tenacity` or custom backoff for 429 (Rate Limit), 500/503 (Server Error), and transient connection drops.
   - Fallback model hierarchy: Primary (e.g. `llama-3.3-70b-versatile` via Groq) → Secondary fallback (e.g. `llama-3.1-8b-instant` or OpenAI/Anthropic).
   - Clean handling of malformed JSON from LLM: Structured recovery prompt or regex-based JSON extractor before erroring out.

### ✅ Acceptance Criteria
- [ ] Dialogue flows naturally without robotic repetitive follow-ups when the candidate gives comprehensive answers.
- [ ] If a candidate gives a stellar first answer, the engine moves to the next question immediately rather than forcing follow-ups.
- [ ] If Groq/LLM returns a rate limit or 503, the retry handler intercepts with exponential backoff without dropping the candidate's session.
- [ ] Transcripts accurately record speaker, turn indices, timestamps, and the underlying dialogue decisions.

---

## Prompt 5: Comprehensive Candidate Assessment & Multi-Dimensional Report Engine

### 🎯 Objective
Build a rich report generation pipeline triggered when a candidate completes an interview. Generate structured scorecards, competency radar data, transcript quote evidence, red/green flags, and an executive hiring recommendation. Store reports in the database and provide queryable endpoints for recruiter review.

### 📁 Target Files
- `backend/services/report_generator.py` (Post-interview synthesis, rubric aggregation, executive summary generator)
- `backend/services/rubric_scoring.py` (Enhanced deterministic criteria scoring)
- `backend/models/report.py` (Report ORM entity with JSON schema validation)
- `backend/schemas/report.py` (ReportResponse, CriteriaScorecard, RecommendationSummary)
- `backend/routers/reports.py` (`GET /api/v1/reports/{interview_id}`, `POST /api/v1/reports/{interview_id}/decision`)

### 📋 Technical Specifications
1. **Multi-Pass Evaluation Architecture:**
   - *Pass 1 (Deterministic):* Aggregate turn-by-turn criteria evidence into normalized weighted scores (1.0 to 5.0).
   - *Pass 2 (Synthesizer LLM):* Review the entire transcript holistically to generate:
     - Executive Summary (3-4 sentence high-level overview).
     - Strengths (with direct verbatim quotes from candidate).
     - Areas for Growth / Red Flags (with direct verbatim quotes).
     - Communication & Articulation Assessment.
     - Overall Recommendation: `Strong Hire`, `Hire`, `Leaning No`, `Strong No`.
2. **Human-in-the-Loop Decision Recording:**
   - Support recruiter overrides: `POST /api/v1/reports/{interview_id}/decision` records the hiring manager's final verdict (`hired`, `rejected`, `next_round`), reviewer ID, notes, and timestamp.
3. **Data Integrity:**
   - Reports are generated idempotently upon session status transition to `completed`.
   - Cached in the database so repeated GET requests do not trigger redundant LLM calls.

### ✅ Acceptance Criteria
- [ ] Finishing an interview triggers report generation; report is saved to `reports` table.
- [ ] `GET /api/v1/reports/{interview_id}` returns complete report with overall score, criteria breakdown, and transcript evidence quotes.
- [ ] Recruiter can submit a final human decision that persists in the database.

---

## Prompt 6: Admin Frontend Modernization (`/admin`, `/candidates`, `/settings`)

### 🎯 Objective
Complete and polish the admin frontend interfaces using **ReactBits** UI components, sleek dark mode aesthetics, and Tailwind CSS. Implement full CRUD and interactive dashboards for `/admin` (Overview), `/admin/candidates` (Candidate Tracker & Report Viewer), and `/admin/settings` (Organization, Models, Keys).

### 📁 Target Files
- `frontend/src/app/admin/page.tsx` (Dashboard Overview: metrics, active interviews, completion rate, recent alerts)
- `frontend/src/app/admin/candidates/page.tsx` (Candidate management table, status filters, search, quick report preview)
- `frontend/src/app/admin/candidates/[id]/page.tsx` (In-depth candidate interview report & transcript viewer)
- `frontend/src/app/admin/settings/page.tsx` (API keys configuration, default rubric thresholds, company branding, notifications)
- `frontend/src/components/admin/ReportModal.tsx` (Rich scorecard modal with score breakdowns and quote evidence)
- `frontend/src/components/admin/MetricsCard.tsx` (Animated statistics card)

### 📋 Technical Specifications
1. **Design System & Aesthetics:**
   - Follow premium dark-tech aesthetics with glassmorphic cards (`SpecularContainer`, subtle border glows, backdrop blurs).
   - Integrate ReactBits interactive elements (such as animated counters, magnetic buttons, or smooth tab transitions).
2. **Page Implementations:**
   - **`/admin` (Overview):** Summary stats (Total Interviews, Average Score, Pass/Fail Ratio), recent candidate activity feed, quick "Create Interview" CTA.
   - **`/admin/candidates`:** Searchable, filterable list of all candidate sessions. Displays candidate email, role title, status badge (`completed`, `in-progress`, `pending`), overall score, and action menu (View Report, Copy Link, Re-trigger).
   - **`/admin/candidates/[id]`:** Detailed report screen showing radar chart / bars of competencies, executive summary, verified transcript with turn-by-turn speaker playback, and Recruiter Decision submission box.
   - **`/admin/settings`:** Allows admin to configure model selection (Groq, Anthropic, OpenAI), set default interview duration, configure email notifications, and update company profile.
3. **Data Fetching & State:**
   - Typed API client using Axios or Fetch with Bearer token injection.
   - Loading skeletons and clean error toast notifications.

### ✅ Acceptance Criteria
- [ ] Navigating to `/admin`, `/admin/candidates`, and `/admin/settings` renders responsive, fully functional pages.
- [ ] Candidate table reflects real data from the backend database.
- [ ] Clicking a completed candidate opens the full assessment report with transcript quotes and criteria breakdown.
- [ ] Recruiter can change settings and save them to backend.

---

## Prompt 7: Modular Backend Test Suite & Automated Quality Gates

### 🎯 Objective
Write a comprehensive, modular test suite using **pytest** and **pytest-asyncio** that validates every layer of the modernized application in isolation and across integration boundaries.

### 📁 Target Files
- `backend/tests/conftest.py` (Test DB fixtures, mock LLM client, mock user/admin auth tokens)
- `backend/tests/test_database.py` (Session lifecycle, dialect compatibility, cascade deletions)
- `backend/tests/test_auth.py` (Registration, login, JWT verification, expired tokens, role permissions)
- `backend/tests/test_dialogue_engine.py` (Adaptive follow-up logic, probe policies, retry handlers)
- `backend/tests/test_question_generator.py` (Topic intake, schema validation, rubric formulation)
- `backend/tests/test_reports.py` (Deterministic scoring, report synthesis, human decision recording)
- `backend/tests/test_admin_api.py` (Admin endpoints, candidate listing, settings updates)

### 📋 Technical Specifications
1. **Mocking & Isolation:**
   - LLM calls must be reliably mocked using a configurable test double to allow instant, zero-cost CI test execution while asserting exact prompt and payload shapes.
   - In-memory SQLite database used for test execution with isolated transactions rolled back per test.
2. **Failure Mode Testing:**
   - Test LLM rate-limit (429) simulation to verify exponential backoff triggers.
   - Test invalid credentials, expired candidate tokens, and tampered JWT payloads.
   - Test edge cases: candidate giving empty answers, extremely long answers, or technical jargon.

### ✅ Acceptance Criteria
- [ ] Running `pytest` in `backend/` passes 100% with high test coverage.
- [ ] Tests run without requiring an active external database or live Groq API key.
- [ ] All major security checks, route handlers, dialogue transitions, and scoring algorithms are covered.
