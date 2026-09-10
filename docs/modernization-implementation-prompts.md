# AI Interview Platform Modernization Prompts & Execution Blueprint

## Overview
This document outlines the architectural roadmap and prompt decomposition created for modernizing the Conlatus AI Interview Platform. The raw user requirements were decomposed, dependency-analyzed, and structured into an execution sequence designed to prevent circular dependencies and redundant refactors.

## Architectural Dependency Pipeline

1. **Modular Database & ORM (`conlatus.db` / PostgreSQL / Supabase / Neon):**
   - Establishes persistent models for organizations, admins, roles, question banks, candidate sessions, conversation logs, and evaluation reports.
   - Decoupled configuration enables local SQLite development switching to Postgres in production via `DATABASE_URL`.
2. **Enterprise Security & JWT Authentication:**
   - Stateless JWT authentication for admins/recruiters with Argon2/Bcrypt password hashing.
   - Single-use signed tokens for candidate interview access.
   - CORS lockdown, CSP/security headers, and route-level rate limiting (`slowapi`).
3. **Autonomous Question Synthesis & Real-World Grounding:**
   - Moves beyond manual question uploads by enabling topic prompts, seniority inputs, and web-grounded scenario formulation.
4. **Adaptive Conversational Dialogue Engine:**
   - Replaces the hardcoded 3-followup rollback loop with a dynamic conversation state machine (`DEEPEN`, `CLARIFY`, `PIVOT`, `CONCLUDE`).
   - Integrates exponential backoff and multi-model fallbacks for 429/5xx error recovery.
5. **Comprehensive Candidate Assessment & Multi-Pass Scoring:**
   - Turn-by-turn rubric evidence aggregation combined with an executive summary pass and verbatim quote extraction.
   - Persisted reports and recruiter decision overrides (`hire`/`no-hire`).
6. **Modern Admin Experience (`/admin`, `/admin/candidates`, `/admin/settings`):**
   - ReactBits dark-mode interfaces, live metrics, candidate interview tracking, and granular system configuration.
7. **End-to-End Modular Testing Suite:**
   - Isolated `pytest` fixtures for database transactions, mock LLM responses, token lifecycles, and edge case evaluations.

## Related Assets
- Implementation Prompts: [prompts.md](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/Set-main.app/.dev/prompts.md)
- Feature Registry: [FEATURES.md](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/Set-main.app/READMEs/FEATURES.md)
