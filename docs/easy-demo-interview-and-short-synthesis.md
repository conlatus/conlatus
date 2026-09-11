# Ultra-Easy DEMO Interview & Short Autonomous Question Synthesis

## Overview
This feature completely simplifies the default **DEMO** interview and default recruiter setup configuration from complex, advanced topics (e.g. React architecture, distributed system design, API rate limiters) down to ultra-easy computer science and web development fundamentals (HTML, CSS, variables, interpreted vs. compiled languages).

Additionally, it configures both the dialogue engine and mock evaluator to accept and reward concise or **one-word answers** (e.g. "Python", "HTML", "styling"), and updates the autonomous question synthesizer to generate **short ~ one-sentence questions** rather than bloated, multi-sentence scenario prompts.

---

## What Was Added & Changed

### 1. Ultra-Easy DEMO Base Questions (`backend/rubric_config.py`)
Replaced the previous advanced backend engineering questions (REST vs GraphQL, slow API debugging, B-Tree indexes, rate limiters) with 5 fundamental questions:
- **Q1**: `What is HTML?`
  - *Acceptable answers*: Single-word or short phrase (e.g., "markup", "structure", "webpages", "HyperText Markup Language").
- **Q2**: `What is CSS?`
  - *Acceptable answers*: Single-word or short phrase (e.g., "styling", "design", "presentation", "Cascading Style Sheets").
- **Q3**: `What are variables in programming?`
  - *Acceptable answers*: Single-word or short phrase (e.g., "containers", "storage", "data holders", "memory").
- **Q4**: `Give one example of an interpreted programming language.`
  - *Acceptable answers*: Exact one-word language name (e.g., "Python", "JavaScript", "Ruby", "PHP").
- **Q5**: `Give one example of a compiled programming language.`
  - *Acceptable answers*: Exact one-word language name (e.g., "C", "C++", "Java", "Rust", "Go").

Updated `ROLE_TITLE` to `"Junior Web Developer — Fundamentals"`.

### 2. DEMO Resolver in Backend Router (`backend/routers/interview.py`)
- In `_resolve_interview_metadata`, typing or submitting `"DEMO"` or `"demo-interview"` always constructs and caches the updated 15-minute introductory technical screening with the 5 beginner questions and rubric mapping.

### 3. One-Word Answers & Short Follow-Ups (`backend/core/llm.py`)
- **Evaluator System Prompt**: Explicitly informs the LLM that this is an entry-level assessment where one-word or concise answers are completely valid. Correct one-word answers receive full credit (scores 4.0–5.0) and trigger `PIVOT` to move smoothly to the next question.
- **Short Questions Enforcement**: When `DEEPEN` or `CLARIFY` is triggered, the suggested follow-up question is restricted to at most one concise sentence (~ 5 to 12 words).
- **Mock Evaluator Fix**: Removed the previous `len(resp_lower) < 15` rule which previously caused valid one-word answers like `"Python"` (6 characters) or `"HTML"` (4 characters) to be flagged as vague.

### 4. Autonomous Question Synthesis Prompt (`backend/services/question_generator.py`)
- Replaced the previous prompt instructions (which demanded deep, multi-paragraph scenario debugging questions) with strict rules:
  1. **Short Questions**: Exactly one concise sentence (~ 6 to 15 words) per question.
  2. **Beginner-Friendly**: Simple fundamentals (HTML, CSS, variables, language types).
  3. **One-Word Answers**: Questions designed so candidates can answer with a single word or short phrase.
  4. **Expected Signals**: Notes that one-word answers are completely valid.

### 5. Admin Setup Defaults & Placeholders (`frontend/src/app/admin/setup/page.tsx`)
- Updated default focus tags / rubric criteria from `["React", "System Design"]` to `["HTML", "CSS", "Variables", "Basic Programming"]`.
- Changed default duration from `30` to `15` minutes.
- Changed default seniority level from `Mid` to `Junior`.
- Updated role title fallback and placeholders to `e.g. Junior Web Developer`, `e.g. What is HTML?`, and introductory JD descriptions.

---

## Verification & Testing
1. **Unit & Protocol Verification**: Verified `rubric_config.py` criteria weighting, question schemas, and `_mock_evaluate` response handling for one-word answers ("Python", "HTML", "CSS", "C++", "container") through isolated Python testing protocol.
2. **Backend Regression Test Suite**: Ran all 55 tests via `pnpm test:backend`. All 55 tests passed cleanly with 0 errors.
3. **Frontend Production Build**: Ran `pnpm --prefix frontend run build` (Next.js 16 App Router with Turbopack). Static and dynamic routes compiled successfully with 0 TypeScript errors.
