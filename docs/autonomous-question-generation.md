# Autonomous AI Interview Question Generation

## Overview
The Autonomous AI Question Generation feature empowers recruiters and engineering managers to instantly synthesize a technical interview curriculum. Instead of manually writing questions, the admin specifies high-level topics (e.g., "Kafka", "Raft consensus") and a seniority level. The AI then generates 4-6 highly specific, scenario-based questions with precise evaluation rubrics.

## Architecture

### 1. `backend/services/question_generator.py`
Leverages the Groq API (using the primary `openai/gpt-oss-120b` model with `openai/gpt-oss-20b` and `qwen/qwen3.8-27b` fallbacks) to construct deep technical questions. The generation is heavily grounded using strict prompts and guided by the `CurriculumPlanSchema`.

### 2. `backend/services/web_research.py`
A mock web-grounding service designed to simulate fetching real-world production incidents, RFCs, and engineering scenarios to inject into the LLM's context window.

### 3. `backend/schemas/question_generation.py`
Pydantic schemas enforce the strict JSON output structure from the LLM, ensuring every generated question contains:
- `text`: The scenario prompt.
- `competency_tag`: Target skill area.
- `difficulty`: 1-5 scale rating.
- `expected_signals`: Evaluation criteria.
- `rubric_criteria`: Detailed scoring weights.

### 4. `backend/routers/admin_questions.py`
Exposes the `POST /admin/generate-questions` endpoint, securely protected by the `get_current_admin` RBAC dependency.

### 5. `frontend/src/app/admin/setup/page.tsx`
Provides an intuitive UI toggle to switch between manual mode and autonomous mode. Generated questions are rendered dynamically in editable textareas, allowing human-in-the-loop review before committing them to the interview session.
