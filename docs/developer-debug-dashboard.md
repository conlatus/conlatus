# Developer Audio & Video Diagnostic Dashboard

## 1. Overview
The Developer Diagnostic Dashboard (`/dev/dashboard`, backed by `backend/static/dashboard.html`) is an integrated, zero-dependency browser testing console built directly into the FastAPI backend. It allows engineers to diagnose, verify, and monitor low-level WebRTC media streams, Whisper Large v3 speech transcription, adaptive LLM dialogue state machines, and real-time rubric calculations in isolation from the Next.js frontend.

---

## 2. Architecture & Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│               Developer Diagnostic Dashboard UI                 │
│                   (http://localhost:8000/dev/dashboard)         │
├───────────────────────────────┬─────────────────────────────────┤
│          Chat & Media Panel   │        Live Diagnostic Telemetry│
│  - WebRTC Camera Stream       │  - Active Session Metadata      │
│  - Push-to-Talk Microphone    │  - State Machine Phase Tracking │
│  - Live Transcript Bubbles    │  - Turn-by-Turn Criteria Table  │
│  - Text Input Fallback        │  - Deterministic Verdict Preview│
└───────────────────────────────┴─────────────────────────────────┘
```

---

## 3. Core Features

### A. Media Stream & Push-to-Talk Verification
- **WebRTC Camera Toggle:** Accesses `navigator.mediaDevices.getUserMedia` to verify camera permissions, frame rate, and canvas rendering.
- **Audio Recorder:** Captures microphone chunks via `MediaRecorder` (`audio/webm`), validates payload sizes, and dispatches them via `multipart/form-data` to `/interview/{sessionId}/audio-message`.
- **Latency Diagnostics:** Measures round-trip time between audio upload, Groq Whisper v3 transcription, and LLM follow-up generation.

### B. State Machine & Dialogue Tracking
- **State Inspector:** Displays the active session phase: `initialized`, `active`, `clarification`, `probing`, `concluded`, or `length_limited`.
- **Turn Counter:** Monitors multi-turn dialogue progression and remaining questions in the configured curriculum.
- **Transcript Inspector:** Color-coded speech bubbles separating interviewer prompts (blue) from candidate transcripts (green).

### C. Live Scoring & Rubric Breakdown Table
- **Per-Criterion Scoring:** Tabulates live scores (1.0–5.0) awarded by the LLM across configured competencies (e.g., *Technical Competence*, *Problem Solving*, *Communication*).
- **Verdict Preview:** Continuously computes weighted averages against the 3.0 threshold, visually displaying `PASS`, `FAIL`, or `INCOMPLETE` state badges.

---

## 4. Usage Instructions

1. Start the FastAPI backend:
   ```bash
   npm run backend
   # or: python backend/main.py
   ```
2. Navigate to [http://localhost:8000/dev/dashboard](http://localhost:8000/dev/dashboard) in any modern browser.
3. Click **"Start New Interview"** to initialize a test session.
4. Test candidate responses either by holding the **🎙️ Hold to Talk** button or typing in the text field.
