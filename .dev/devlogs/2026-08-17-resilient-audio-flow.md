# Devlog: Bulletproofing Audio Streams & Multi-turn Interview Lifecycles 🎙️⚡

**Date:** 2026-08-17  
**Author:** Antigravity Pair Programmer  

---

### What happened today?
Grab your coffee, because we just solved a classic distributed state machine puzzle! ☕

During live testing of our generated dynamic interview links, the first few audio turns went great (200 OKs flowing like butter), but right around turn 4, things started throwing `400 Bad Request` and `502 Bad Gateway`. 

### The Root Cause Mystery Solved 🕵️‍♂️
1. **The 400 Bad Request Culprit:** Our admin setup was creating interview configs with a default of only *one* question (`"Tell me about yourself..."`) when no custom questions were typed in. After question 1 plus its two follow-ups, the backend marked the session status as `completed`. But because the frontend didn't have a clear "Interview Finished" card, the candidate kept talking into the mic! When turn 4 hit the backend, FastAPI rightly noticed the interview was completed and threw a 400.
2. **The 502 Bad Gateway Glitch:** Groq Whisper or LLM calls occasionally experienced transient network latency or rate-limit hiccups under rapid audio chunk uploads, which surfaced as unhandled `502 Bad Gateway` exceptions.

### How We Fixed It Under The Hood 🛠️
- **Structured 5-Phase Interview Flow:** In `backend/routers/admin.py`, if custom questions aren't specified, we now dynamically generate a realistic, multi-phase interview structure (Introduction, Deep-dive on Rubric Tech, Incident/Debugging, Cross-functional Collaboration, and Role Fit).
- **Graceful Lifecycle Responses:** In `backend/routers/interview.py`, completed sessions now return clean `status="completed"` payloads instead of raising 400 exceptions.
- **Self-Healing API Calls:** In `backend/core/llm.py` and `backend/core/stt.py`, we added retry loops with exponential backoff and safe fallbacks so transient network drops never break an active live call.
- **Crisp UI States & Timer:** In `src/app/page.tsx`, we added an active call timer, live recording pills, "Transcribing..." badges, and an official "Session Finalized" completion banner with synthesized vocal conclusion!

Onward and upward! 🚀
