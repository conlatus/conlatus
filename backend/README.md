# Conlatus — AI Technical Interview Platform

An AI-driven technical interview platform designed to conduct adaptive, structured candidate assessments. Using Large Language Models (LLMs) such as OpenAI GPT-OSS-120B via Groq, Conlatus dynamically evaluates candidate responses against pre-configured rubrics, asking context-aware follow-up questions while maintaining auditable, deterministic scoring rules.

This repository contains the **MVP prototype** implementation. It focuses strictly on validating the core interview loop—supporting text input, speech-to-text (STT), streaming text-to-speech (TTS), live camera preview, and deterministic rubric evaluation.

---

## Current Status

This repository is an **MVP prototype**. The primary objective is validating the core conversational interview loop and evaluation logic.

* **Working Features:** Text-based interview loop, push-to-talk audio capture and Groq Whisper Large v3 speech transcription, sentence-chunked browser TTS audio playback, live camera preview display, follow-up question budget management, and deterministic rubric score calculation.
* **Not Yet Built:** Database persistence (PostgreSQL schema & storage deferred to later phase), candidate/HR authentication and access control, Safe Exam Browser (SEB) verification contract, and heuristic cheat/behavior detection.

---

## Prerequisites

* **Python:** Version `3.10` or higher required.
* **Node.js:** Not required for this phase (the developer dashboard is served directly by FastAPI as a static HTML/JS file).
* **Groq API Key:** Required for LLM reasoning (OpenAI GPT-OSS-120B) and speech transcription (Whisper Large v3). Obtain a key at [console.groq.com](https://console.groq.com).

---

## Setup Guide

Follow these steps in exact order to set up and launch the backend server:

### 1. Clone the repository
```bash
git clone https://github.com/conlatus/conlatus.git
cd conlatus
```

### 2. Create a virtual environment
```bash
python -m venv venv
```

### 3. Activate the virtual environment
* **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```
* **Windows (PowerShell):**
  ```powershell
  venv\Scripts\activate
  ```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Configure environment variables
Copy the template environment file to `.env`:
* **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```
* **Windows (PowerShell):**
  ```powershell
  copy .env.example .env
  ```

Edit `.env` and set your Groq API key:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

### 6. Start the backend server
Run Uvicorn to start the FastAPI server on port 8000:
```bash
uvicorn backend.main:app --reload --port 8000
```

---

## Walkthrough & Manual Testing

1. Open your browser and navigate to the Developer Dashboard:
   [http://localhost:8000/dev/dashboard](http://localhost:8000/dev/dashboard)

2. Click **"Start Interview"**. The backend will initialize a new session and load the first question from `backend/rubric_config.py`.

3. **Answering Questions:**
   * **Text Input:** Type your answer into the input box and click **"Send Text"** (or press Enter).
   * **Push-to-Talk Audio:** Click and hold (or toggle) the **"Hold to Speak / Push-to-Talk"** button. Your browser will prompt for microphone access. Speak your answer and release the button. The recorded audio chunk will be transcribed via Groq Whisper and sent to the interview loop.
   * **Camera Preview:** Allow camera access when prompted by the browser to display your video feed in the camera panel.

4. **Understanding Status States:**
   * `idle`: Waiting for candidate input.
   * `listening`: Push-to-talk button active; recording microphone input.
   * `transcribing`: Audio blob sent to backend; awaiting Groq Whisper STT output.
   * `thinking`: Transcript received; LLM evaluating response and generating next question/follow-up.
   * `speaking`: Browser speech synthesis actively playing back the interviewer's question sentence by sentence.

5. **Verdict & Rubric Evidence:**
   * The **"Live Session Status"** panel updates after each turn, displaying accumulated `rubric_evidence` per criterion in real-time.
   * When all base questions and follow-ups are completed, the final verdict (`PASS` or `FAIL`) and candidate rubric score summary will be displayed. Verdicts are computed deterministically by `backend/core/rubric_scoring.py` against `VERDICT_THRESHOLD`.

---

## Running Tests

Run the test suite using `pytest`:

```bash
pytest
```

> **Note:** Audio capture, Whisper STT, and camera feeds are not covered by automated unit/integration tests due to hardware dependencies in CI environments. Per `.antigravity/workflows/testing-and-dev-dashboard.md`, manual testing via the Developer Dashboard is used to verify audio/video capabilities.

---

## Project Structure

```
conlatus/
├── backend/
│   ├── main.py                 # FastAPI application entrypoint and route declarations
│   ├── rubric_config.py        # Interview rubric criteria, weights, and base question definitions
│   ├── core/
│   │   ├── llm.py              # Groq / OpenAI GPT-OSS-120B client wrapper & prompt formatting
│   │   ├── rubric_scoring.py   # Deterministic verdict computation module
│   │   ├── session.py          # In-memory interview session state management
│   │   ├── stt.py              # Groq Whisper Large v3 transcription service integration
│   │   └── tts.py              # Text-to-speech helper & sentence chunking utilities
│   ├── models/
│   │   └── schemas.py          # Pydantic models for API requests & responses
│   ├── routers/
│   │   └── interview.py        # API router for interview session endpoints
│   └── static/
│       └── dashboard.html      # Developer testing dashboard (Vanilla HTML/JS)
├── tests/
│   ├── conftest.py             # Pytest fixtures and automated failure report generator
│   ├── test_audio_tts.py       # Audio & TTS helper function tests
│   ├── test_interview_loop.py  # Interview loop API integration tests
│   └── test_rubric_scoring.py  # Unit tests for deterministic rubric scoring logic
├── .antigravity/              # Architectural specs, rules, and workflow documentation
├── .env.example                # Template for environment configuration
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation & setup guide
```

---

## Known Limitations

* **MVP Scope:** Designed solely for evaluating the interview loop and scoring mechanisms.
* **In-Memory State:** Session state is stored in server memory and resets whenever the backend process restarts.
* **No Authentication:** Access control and candidate-specific tokenized links are not implemented.
* **Browser TTS Quality:** Speech output relies on browser-native `SpeechSynthesis` sentence queuing, which may produce minor pauses between sentence chunks depending on OS/browser voice drivers.
* **SEB Compatibility:** Safe Exam Browser (SEB) compatibility has not yet been verified outside of standard desktop web browsers.

---
Co-authored-by: [LC-bhargav](<LC-bhargav@users.noreply.github.com>)
