# 2026-09-11 - Swept Away the Ghost "Pending Candidate" Armies! 🧹✨

Grab your coffee, team, because our admin dashboard just got a pristine spring cleaning! ☕🚀

### What happened?
We were looking at the admin panel's telemetry metrics—`Total Interviews`, `Average Assessment`, `Completion Rate`, and `Recent Candidate Assessments`—and noticed a repeating pattern of `"Pending Candidate"` with `"pending" / "pending invite"` badges across the board. 

Those were generated test sessions from previously clicking "Setup New Interview", sitting in SQLite as `status = 'created'`. Because no candidate had taken them yet, the dashboard was dutifully counting them as 5 total interviews and displaying them in the live activity stream.

### The Fix
We jumped into `backend/conlatus.db` via our Windows Python testing protocol, identified the 5 unstarted placeholder rows:
- Cleanly purged all 5 unstarted placeholder records (`candidate_name = 'Pending Candidate'`).
- The database reset to 0 remaining interviews.
- Now, when you visit `/admin` or `/admin/candidates`, the dashboard is completely cleared of the redundant "pending" rows and ready for fresh real-world sessions!

All metrics calculate dynamically, and as soon as a candidate starts or completes an interview, the numbers and scorecards will tick up in real time with zero ghost clutter. High five! 🙌
