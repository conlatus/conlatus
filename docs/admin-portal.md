# Conlatus Admin Portal & Candidate Evaluation Suite

## 1. Overview
The Conlatus Admin Portal provides recruiters and talent engineering teams with an interactive, dark-tech command interface for monitoring candidate assessments, reviewing synthesized scorecards, inspecting turn-by-turn audio/text transcripts, and calibrating LLM inference models and rubric thresholds.

---

## 2. Architectural Blueprint

```
                     ┌────────────────────────────────────────────────────────┐
                     │              Next.js 16 App Router Frontend            │
                     │  - /admin (Telemetry Dashboard & Animated Metrics)    │
                     │  - /admin/candidates (Pipeline Table & Modal Preview)  │
                     │  - /admin/candidates/[id] (Deep Dive & Transcript)     │
                     │  - /admin/settings (Inference, Keys & Thresholds)      │
                     └────────────────────────────┬───────────────────────────┘
                                                  │
                                                  │ Bearer Token HTTP / REST
                                                  ▼
                     ┌────────────────────────────────────────────────────────┐
                     │               FastAPI Backend (Port 8000)              │
                     │  - GET  /admin/overview                                │
                     │  - GET  /admin/candidates?search=&status=             │
                     │  - GET  /admin/candidates/{id}                         │
                     │  - POST /admin/candidates/{id}/decision               │
                     │  - POST /admin/candidates/{id}/retrigger              │
                     │  - GET/POST /admin/settings                           │
                     └─────────────┬──────────────────────────┬───────────────┘
                                   │                          │
                 SQLAlchemy 2.0 Async                         │
                                   ▼                          ▼
                          ┌─────────────────┐        ┌──────────────────┐
                          │ SQLite / Async  │        │ Groq Whisper v3  │
                          │ conlatus.db     │        │ GPT-OSS-120B     │
                          └─────────────────┘        └──────────────────┘
```

---

## 3. Core Capabilities & Interfaces

### A. Telemetry Dashboard (`/admin`)
- **Key Performance Indicators (`MetricsCard`):**
  - **Total Interviews:** Aggregated count with dynamic animated spring counters (`AnimatedCounter`).
  - **Average Assessment Score:** Real-time arithmetic mean of candidate evaluations against the 3.0 benchmark.
  - **Completion Rate:** Percentage of started interviews that reached terminal state.
  - **Active Sessions:** In-progress candidates currently participating in the dialogue loop.
- **Candidate Activity Stream:** Recent evaluations with score badges and instant one-click quick scorecard preview (`ReportModal`).
- **Telemetry Alerts:** Real-time notifications for candidates awaiting recruiter verdict, high-potential candidate alerts, and synthesis engine health status.

### B. Candidate Pipeline & Tracker (`/admin/candidates`)
- **Search & Filtering:** Real-time query debouncing across candidate name, email, and job role title.
- **Status Filter Tabs:** Seamlessly toggle between `All Sessions`, `Completed`, `In Progress`, and `Pending`.
- **Responsive Table:** Status pills with live pulse animations, formatted score badges, and action dropdowns:
  - **Quick Scorecard:** Launches `ReportModal` with radar chart and quote evidence.
  - **In-Depth View:** Direct link to `/admin/candidates/[id]`.
  - **Copy Interview Link:** Generates direct applicant URLs with instant clipboard feedback.
  - **Re-trigger Evaluation:** Allows clearing stale summaries and re-running Pass-2 LLM synthesis.

### C. In-Depth Candidate Assessment & Transcript (`/admin/candidates/[id]`)
- **Executive Summary:** High-level narrative of candidate strengths and technical capabilities.
- **Competency Radar (`RadarChart`):** SVG polygon visualization contrasting candidate performance across 5 key dimensions against target rubric thresholds.
- **Evidence Quote Pills:** Direct, verbatim quotes extracted by the LLM from candidate responses to justify positive scores or identified red flags.
- **Turn-by-Turn Transcript Player:** Complete chronological dialogue between Conlatus AI Interviewer and the candidate, with speaker badges, timestamps, and simulated speech audio turn playback.
- **Hiring Committee Decision Panel:** Recruiter input box allowing selection of `Hire / Offer`, `Next Round`, `Under Review`, or `Reject`, accompanied by written debrief notes persisted directly to `conlatus.db`.

### D. Organization & Model Settings (`/admin/settings`)
- **Inference Model Selection:** Interactive radio cards for Groq OpenAI GPT-OSS-120B (ultra-fast reasoning audio turns), Anthropic Claude 3.5 Sonnet, and OpenAI GPT-4o.
- **API Key Management:** Secure status monitoring and configuration of `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY`.
- **Duration & Benchmark Sliders:** Interactive range controls for default interview duration (15–60 mins) and automatic hire thresholds (2.0–4.5/5.0).
- **Company Branding:** Configure organization name and primary talent lead contact.
- **Notification Telemetry:** Toggles for completion email summaries and high-score priority alerts.

---

## 4. Design System & Aesthetics
- **Liquid Dark Mode:** Off-black `#050505` to `#09090b` neutral foundation avoiding pure black.
- **Glassmorphism & Refraction:** `SpecularContainer` panels featuring 1px subtle inner borders (`border-white/10`) and inset highlight diffusion.
- **Micro-Physics:** Tactile button states with active transform scaling, radial glowing card backdrops, and spring easing curves.
