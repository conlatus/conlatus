# Polishing the Conlatus Admin Command Center 🚀

Grab a fresh cup of coffee, folks! ☕️

Remember when the admin area had a setup screen and a login page, but visiting `/admin` or `/admin/candidates` gave you an empty void? Well, say goodbye to the ghost town. Today we are rolling out the **Conlatus Admin Portal & Candidate Evaluation Suite**!

We packed in glowing dark-tech glassmorphism, ReactBits-inspired micro-physics, dynamic radar charts, and full CRUD pipelines connecting directly to our FastAPI backend.

---

### What's in the Box? 🎁

1. **The Pulse of the Pipeline (`/admin`)**
   - Built an animated telemetry dashboard.
   - Powered by four `MetricsCard` widgets equipped with `AnimatedCounter` (smooth cubic-bezier spring counting on mount).
   - Real-time KPIs: Total Interviews, Average Assessment Score, Completion Rate, and Active In-Progress Sessions.
   - A live candidate evaluation stream with instant "Preview Scorecard" modals and actionable alert telemetry (e.g. flagging candidates awaiting recruiter verdict).

2. **The Candidate Tracker (`/admin/candidates`)**
   - Full search & status filtering across candidate name, email, and role title.
   - Interactive status tabs: `All Sessions`, `Completed`, `In Progress`, and `Pending`.
   - Actions to trigger one-click link copying (`/?token=...`), launch the rich `ReportModal`, re-trigger LLM evaluation, or jump straight into the full deep-dive.

3. **In-Depth Scorecards & Dialogue Playback (`/admin/candidates/[id]`)**
   - This page is pure eye candy. It renders a clean SVG `RadarChart` comparing candidate scores across 5 competency dimensions against the target 3.0 benchmark.
   - Highlights executive summaries, verified strengths, and growth areas with **verbatim candidate quotes** extracted by Pass-2 LLM synthesis.
   - Includes a chronological dialogue transcript with speaker avatars, timestamps, and speech audio playback simulation for every turn.
   - Features an interactive **Recruiter Verdict** submission box (`Hire`, `Next Round`, `Under Review`, `Reject` + leveling notes) that persists directly to `conlatus.db`.

4. **Command & Model Calibration (`/admin/settings`)**
   - Allows talent teams to toggle inference providers between **Groq LLaMA 3.3 70B** (ultra-low latency), **Anthropic Claude 3.5 Sonnet**, and **OpenAI GPT-4o**.
   - API key status indicators, duration sliders (15–60 mins), and rubric passing threshold sliders.
   - Organization branding and completion email notification toggles.

---

### Engineering Hiccups & Little Victories 🛠️

- **The Python 3.14 Passlib Trap:** Python 3.14 with bcrypt 4.0+ threw an internal passlib error during wrap bug checks (`ValueError: password cannot be longer than 72 bytes`). We cut through the passlib bloat and switched directly to native `bcrypt.hashpw` and `bcrypt.checkpw`. Rock solid now.
- **SlowAPI Argument Quirk:** SlowAPI decorators strictly expect the FastAPI argument to be named `request: Request`. We standardized the parameter signature in `routers/interview.py`, and our rate limiters were back in business.
- **Zero-Warning Next.js 16 Production Build:** Ran `pnpm run build` with Turbopack and TypeScript — all 9 routes compiled cleanly in 3.8s!

### How to Take it for a Spin 🏎️

Fire up the FastAPI backend on port 8000 and run `pnpm dev` in `frontend/`. Log in as `admin@conlatus.ai` (password: `admin123`) and take a tour through `/admin`, `/admin/candidates`, and `/admin/settings`.

Huge win for recruiter experience today. Onward! 🚢
