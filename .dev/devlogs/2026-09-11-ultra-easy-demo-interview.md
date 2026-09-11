# Devlog: Making the DEMO Interview Fun & Breezy (Plus Snappy One-Word Answers!)

**Date:** September 11, 2026  
**Author:** Fellow AI Dev  
**Mood:** Relaxed, smiling, and sipping on a fresh latte ☕🎈  

---

### Pull up a chair! ☕😄

Have you ever jumped into what you thought was a quick "Hello World" demo interview, only to be ambushed by questions asking you to sketch out distributed B-Tree indexing strategies, debug SQL deadlock cascades in production, and architect a sliding-window rate limiter in Redis? 

Yeah... talk about trial by fire for someone just trying to see how the speech-to-speech audio loop works! 😅

Today we took a step back, took a deep breath, and gave our default **DEMO interview** the ultimate beginner-friendly glow up. We made it *ultra* easy, tuned the AI so candidates can answer with just **one single word** without getting penalized, and reigned in our autonomous question synthesizer so it stops writing miniature novels and instead sticks to snappy, crisp, one-sentence prompts.

---

### What changed under the hood 🛠️💻

Here is the technical lowdown on everything we shipped across both the backend engine and frontend suite:

1. **Brand New Introductory Question Roster in `backend/rubric_config.py`:**
   - Gone are GraphQL vs. REST debates and DB lock contention!
   - We seeded 5 foundational questions that anyone learning to code can answer right off the bat:
     - `q1`: *"What is HTML?"* (Answers like `"markup"`, `"structure"`, or `"webpages"`).
     - `q2`: *"What is CSS?"* (Answers like `"styling"` or `"design"`).
     - `q3`: *"What are variables in programming?"* (Answers like `"containers"`, `"storage"`, or `"memory"`).
     - `q4`: *"Give one example of an interpreted programming language."* (Answers like `"Python"` or `"JavaScript"`).
     - `q5`: *"Give one example of a compiled programming language."* (Answers like `"C"`, `"C++"`, or `"Java"`).
   - Re-calibrated the rubric criteria weights across `technical_depth` (0.4), `problem_solving` (0.3), and `communication` (0.3) so the math stays strictly normalized to 1.0.

2. **One-Word Answer Liberation in `backend/core/llm.py`:**
   - *The Hiccup We Caught:* In `_mock_evaluate`, there was an old legacy rule: `len(resp_lower) < 15` automatically flagged an answer as vague! That meant if someone answered `"Python"` (6 letters) or `"HTML"` (4 letters), the mock evaluator thought they were mumbling and hit them with a follow-up!
   - We squashed that: single-word answers now pass through with flying colors (score: 4.5, decision: `PIVOT`).
   - We updated the live LLM prompt with strict instructions: entry-level questions are designed for short answers. Correct one-word replies receive top marks (4.0–5.0) and immediately advance to the next question.
   - We also placed a hard restriction on follow-ups (`DEEPEN` / `CLARIFY`): they must be at most **one sentence (~ 5 to 12 words)**!

3. **Short & Punchy AI Autonomous Synthesis in `backend/services/question_generator.py`:**
   - Replaced the previous "Staff-level scenario debugging" prompt with a clear mandate for **short, approximately one-sentence questions (~ 6 to 15 words)**.
   - Instructed the model to craft simple, accessible questions where one-word answers are completely valid, preventing the AI from generating winding multi-sentence setups.

4. **Fresh Defaults for the Recruiter Setup Portal (`frontend/src/app/admin/setup/page.tsx`):**
   - Replaced default rubric tags from `["React", "System Design"]` to `["HTML", "CSS", "Variables", "Basic Programming"]`.
   - Set default seniority level to `Junior` and standard duration to `15` minutes.
   - Updated placeholders so recruiters immediately see beginner-friendly prompts like `e.g. What is HTML?` instead of generic enterprise questions.

---

### Testing & Verification Victory 🏆

- **Python Protocol Verification**: Created an isolated test harness in `temp-tests`, verified `rubric_config` criteria validation, tested one-word responses against the evaluator, confirmed short follow-up sentence lengths, and cleaned up the folder.
- **Backend Test Suite**: Ran `pnpm test:backend` — all 55 tests passed in 10.98s!
- **Frontend Turbopack Build**: Ran `pnpm --prefix frontend run build` — Next.js 16 compiled clean across all static and dynamic endpoints with zero TypeScript errors.

The DEMO interview is now effortless, welcoming, and blisteringly fast. Time to celebrate with another cup of coffee! ☕🚀
