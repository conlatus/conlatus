# Multi-Dimensional Report Engine

## Overview
The Report Engine is a dual-pass evaluation system designed to provide comprehensive, actionable candidate assessments upon interview completion. It combines deterministic scoring algorithms with generative AI synthesis to output normalized scores alongside qualitative feedback.

## Architecture

### Pass 1: Deterministic Scoring (`services/rubric_scoring.py`)
During the interview, as the LLM evaluates individual candidate turns, it assigns criteria-specific numerical scores based on the configured rubric. When the interview ends, `calculate_verdict` aggregates these raw scores, applies the assigned criteria weightings, and outputs a normalized 1.0 - 5.0 score per criterion, as well as an overall `PASS` / `FAIL` verdict if the weighted score meets the threshold.

### Pass 2: Generative Synthesis (`services/report_generator.py`)
Because turn-by-turn evaluations can miss the holistic context of a conversation, a second evaluation pass occurs as a background task. The `ReportGenerator` reads the full interview transcript and the Pass 1 scores, then calls the LLM with a comprehensive prompt to generate:
- **Executive Summary:** A high-level overview.
- **Strengths & Growth Areas:** Specific traits backed by verbatim transcript quotes.
- **Communication Assessment:** An evaluation of the candidate's articulation and clarity.
- **Overall Recommendation:** (Strong Hire, Hire, Leaning No, Strong No).

### Asynchronous Design
Since the generative synthesis (Pass 2) requires a full context window evaluation over the entire transcript, it can take several seconds to compute. To prevent the candidate from waiting on a loading screen after their final answer, the report generation is triggered via FastAPI `BackgroundTasks` in `routers/interview.py`. 

### Human-in-the-Loop Override
Recruiters have the final say. The `POST /api/v1/reports/{interview_id}/decision` endpoint allows authorized admins to append a `human_decision` and `human_notes` to the report, which persists to the database.
