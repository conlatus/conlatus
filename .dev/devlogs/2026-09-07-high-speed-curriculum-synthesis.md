# Devlog: Turbocharging AI Curriculum Synthesis to Sub-3-Second Speeds ⚡☕

**Date:** September 7, 2026  
**Author:** Pair Programming Agent & Engineering Lead  
**Mood:** Hyped on espresso, watching questions pop up in 2.2 seconds flat  

---

### The "Why Is It Taking Forever?!" Mystery

You know that feeling when you press a slick button that says **"Synthesize Questions"**, grab your mug for a quick sip, and... 10 seconds pass. 15 seconds pass. Then boom: **502 Bad Gateway** and `Failed to synthesize questions` pops up in the console like an uninvited party guest. 

Naturally, our user was like: *"Why does this take so long? Make it quick (like ~ few seconds)!"*

So, sleeves rolled up. Time to dive into the logs and see who was snoozing on the job.

### Finding the Culprit: 404s and the Sleep of Death 💤

When we checked the FastAPI console trace, the smoking gun was right there:
```text
Database session error: 502: Question generation failed: Failed to generate questions: 
Error code: 404 - {'error': {'message': 'The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.', 'type': 'invalid_request_error', 'code': 'model_not_found'}}
```

`llama-3.3-70b-versatile` had been hardcoded in `question_generator.py`. And to make matters worse, when Groq handed us a 404, our retry loop didn't know it was talking to a brick wall. It was literally doing:
```python
# Try 1 -> 404 -> sleep(1.0s)
# Try 2 -> 404 -> sleep(2.0s)
# Try 3 -> 404 -> crash with 502!
```
Waiting on a model that doesn't exist on your API key is like repeatedly checking an empty mailbox hoping a package magically teleports in. 😅

### Hunting Down the Fastest Brains on Groq 🏎️

We queried Groq's active model registry directly via `client.models.list()`. The results were illuminating:
- `openai/gpt-oss-20b`: Active and screaming fast.
- `qwen/qwen3.8-27b`: Active, super smart on structured logic.
- `groq/compound-mini`: Active, decent reasoning.

We ran a head-to-head benchmark generating full scenario-based interview rubrics:
1. `openai/gpt-oss-20b`: Generated 5 full multi-criteria scenario questions in **2.23 seconds**!
2. `qwen/qwen3.8-27b`: Generated 4 deep questions in **4.68 seconds**.

### The Architecture Fix

Here is what we engineered under the hood:

1. **Config-Driven Model Routing (`backend/core/config.py`):**
   Added `GROQ_MODEL` defaulting to `"openai/gpt-oss-20b"` and `GROQ_FALLBACK_MODEL` defaulting to `"qwen/qwen3.8-27b"`. Now teams can swap models effortlessly in `.env` without touching Python code.

2. **Instant 404 Fail-Fast (`backend/services/resilient_client.py`):**
   Updated `should_retry` and `_execute_chat_completion`. If Groq says `404` or `model_not_found`, it's classified as `NonRetryableLLMError`. No sleeps, zero pauses. It immediately cascades to the fallback model in milliseconds.

3. **Multi-Model Priority Cascade (`backend/services/question_generator.py`):**
   Equipped `QuestionGenerator` with an ordered candidate roster:
   `["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "groq/compound-mini", "llama-3.3-70b-versatile"]`.
   If one model has a hiccup or hits rate limits, the next one picks up the baton seamlessly.

4. **Laser-Guided Schema Prompting:**
   Refined the system prompt with explicit JSON rules, multi-question array examples, `temperature=0.3`, and `max_tokens=1800`. The LLM doesn't wander or write conversational preamble—it outputs pure, validated `CurriculumPlanSchema` JSON in ~2 seconds.

5. **Frontend Error Clarity & Auth Grace (`frontend/src/app/admin/setup/page.tsx`):**
   Exported `handleAuthError` in `api.ts` and wired it into `handleSynthesize`. If an API error ever does occur, the recruiter gets the specific explanation or gets smoothly routed to login if their session expired.

### Verification Victory 🏆
- **Backend Tests:** Ran all 55 tests in `python -m pytest backend/tests/` -> **55 passed** in 13.36s.
- **Frontend Turbopack Build:** Ran `pnpm build` in `frontend/` -> **10/10 routes compiled cleanly with 0 errors**.
- **Real-time Latency:** Question synthesis dropped from an infinite hang / 502 crash down to a breezy **~2.2 seconds**!

Now when recruiters hit "Synthesize Questions", questions pop in practically before they can take a sip of coffee. Cheers! ☕🚀
