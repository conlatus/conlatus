# Adaptive Dialogue Engine & Resilient Probing

## Overview
The rigid 3-follow-up rollback loop has been replaced with a production-grade conversational state machine. The engine now dynamically assesses candidate depth, adjusts its probing strategy based on LLM outputs, implements resilient exponential backoff logic for external API calls, and transitions smoothly across questions.

## Architecture

### 1. `backend/schemas/dialogue.py`
Defines the `ProbeDecision` enum which contains four primary conversational actions:
- `DEEPEN`: Probe deeper technically.
- `CLARIFY`: Ask for specific metrics, architectural choices, or rationale.
- `PIVOT`: Transition gracefully to the next topic.
- `CONCLUDE`: Wrap up the interview completely.

Also defines the `EvaluationEnvelope` used to strictly parse the LLM's conversational intent.

### 2. `backend/services/resilient_client.py`
A custom `ResilientLLMClient` that wraps the Groq client. Uses `tenacity` for exponential backoff retries when hitting rate limits (`429`) or server errors (`502`, `503`). It also falls back gracefully and handles malformed JSON from the LLM natively.

### 3. `backend/services/dialogue_manager.py`
The `DialogueManager` class isolates state management from the HTTP routing layer. It evaluates the current turn, overrides `DEEPEN` or `CLARIFY` decisions if the candidate has exhausted their follow-up budget, and modifies the `Session` state directly.

### 4. `backend/core/llm.py`
The `LLMEvaluator` was refactored to use the `ResilientLLMClient`. Its system prompt was upgraded from outputting a boolean `is_complete` to selecting an action from the `ProbeDecision` space.

### 5. `backend/routers/interview.py`
The `_process_candidate_turn` method was heavily refactored, dropping over 80 lines of manual state management in favor of delegating directly to `dialogue_manager.process_turn`.
