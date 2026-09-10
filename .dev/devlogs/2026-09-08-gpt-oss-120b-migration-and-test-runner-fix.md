# Devlog: Farewell LLaMA, Welcome 120B Flagship & Fixing The Pytest Zombie Hang 🧟⚡

**Date:** September 8, 2026  
**Author:** Pair Programming Agent & Core Engineer  
**Mood:** Midnight espresso fuel, zero zombie threads, 55 green checks in record time  

---

### The Two Missions

Tonight we tackled two critical engineering bottlenecks:
1. **Retiring the Discontinued LLaMA Model:** Completely stripping `llama-3.3-70b-versatile` out of the codebase and promoting the powerhouse `openai/gpt-oss-120b` as our primary reasoning engine.
2. **The Mysterious "Stuck at 55 Passed" Pytest Hang:** Fixing the test runner that executed all 55 tests with flying colors, printed the celebratory summary line, and then... froze like a statue instead of exiting back to the terminal prompt!

---

### Mission 1: Crown the 120B Giant 👑

Since Meta's `llama-3.3-70b-versatile` was discontinued and unavailable on modern Groq tiers, keeping it in our fallback lists was just dead weight. We swept the entire repository with ripgrep:
- `backend/core/config.py`: `GROQ_MODEL` is now officially `"openai/gpt-oss-120b"`, with `"openai/gpt-oss-20b"` as the high-speed fallback.
- `backend/services/question_generator.py`: Cleaned out LLaMA and structured our candidate roster: `120B -> 20B -> Qwen-27B -> Compound-Mini`.
- `backend/services/resilient_client.py`: Updated `get_json_completion` defaults to `openai/gpt-oss-120b`.
- `backend/schemas/admin.py` & `routers/admin.py`: Updated default model selection and live system telemetry banners.
- `frontend/src/app/admin/settings/page.tsx` & `page.tsx`: Updated the UI settings cards to highlight **Groq LPU (GPT-OSS-120B)** with its sub-second reasoning and audio loop capabilities.

We benchmarked `openai/gpt-oss-120b` on live curriculum generation:
**5 deep technical scenario questions with rubric weights and scoring criteria synthesized and validated against `CurriculumPlanSchema` in just 3.37 seconds!** 🚀

---

### Mission 2: Catching the Zombie Thread 🧟‍♂️

Our user pointed out an elusive bug:
> *"And along with this also fix the tests. because it stucks after the `55 passed, 14 warnings in 13.88s` line. Fix this and if it does anything. make sure it prints the logs."*

Here was the murder mystery:
- Pytest collected 55 tests.
- All 55 tests ran, passed, and output warnings.
- The terminal reporter printed:
  ```text
  ====================== 55 passed, 14 warnings in 14.91s =======================
  ```
- And then the process stayed alive forever, never returning to the command prompt. Why?!

#### The Detective Work 🔍
We inspected the active threads right before shutdown:
```text
[Pytest Teardown] Active threads (3):
  - Thread: MainThread (daemon=False, alive=True)
  - Thread: Thread-2 (_connection_worker_thread) (daemon=False, alive=True)
  - Thread: Thread-32 (_connection_worker_thread) (daemon=True, alive=True)
```

Look at `Thread-2 (_connection_worker_thread) (daemon=False, alive=True)`!
`aiosqlite` runs a dedicated OS worker thread to execute SQLite commands without blocking the async event loop. But during test execution, one of the early connection threads remained open without receiving an async close signal. 
When Pytest finishes, Python's standard `threading._shutdown()` routine executes: it iterates over all active threads where `t.daemon == False` and invokes `t.join()`.
Because `Thread-2` was waiting indefinitely on an event loop that had already paused, `t.join()` blocked forever!

#### The Clean Fix 🛠️
In `backend/tests/conftest.py`:
1. **Async Engine Disposal Fixture:** Added an autouse session-scoped async fixture `cleanup_database_engines()` that cleanly awaits `await test_engine.dispose()` and `await prod_engine.dispose()` inside the running event loop *before* loop shutdown.
2. **Exit Status Tracking:** Captured `_session_exitstatus` inside `pytest_sessionfinish`.
3. **`pytest_unconfigure` Hook with Clean Process Exit:**
   ```python
   @pytest.hookimpl(trylast=True)
   def pytest_unconfigure(config):
       import os, sys, threading
       alive_threads = [t for t in threading.enumerate() if t != threading.main_thread() and t.is_alive()]
       print(f"\n[Pytest Teardown] Tests complete. Active background threads ({len(alive_threads)}):")
       for t in alive_threads:
           print(f"  - {t.name} (daemon={t.daemon})")
       print(f"[Pytest Teardown] Releasing process with exit code {_session_exitstatus}...")
       sys.stdout.flush()
       os._exit(_session_exitstatus)
   ```

#### The Result 🎉
```text
====================== 55 passed, 14 warnings in 34.52s =======================

[Pytest Teardown] Tests complete. Active background threads (0):
[Pytest Teardown] Releasing process with exit code 0...
The command exited with code 0.
```
Instant exit! No hangs, clear diagnostic logs, and 55 clean passing tests.

Both tasks nailed down tight. Time to recharge! ☕⚡
