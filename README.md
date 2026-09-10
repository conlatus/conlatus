# Conlatus AI Interview Platform

A production-grade, full-stack AI technical interview platform featuring dynamic role curriculum generation, adaptive multi-turn audio/text conversational evaluation, deterministic rubric scoring, and an administrative telemetry command center.

---

## Project Structure

```text
├── backend/       # FastAPI application, Groq LLM & Whisper STT, async SQLAlchemy 2.0, pytest suite
├── frontend/      # Next.js App Router (Turbopack, Tailwind CSS, Specular components)
├── docs/          # Architecture, API design, and feature specifications
├── READMEs/       # Feature registry (FEATURES.md)
└── .dev/devlogs/  # Developer logs and technical release narratives
```

---

## Quickstart

### Prerequisites
- **Node.js**: `v18+` and **npm**: `v9+` (or **pnpm**: `v8+`)
- **Python**: `3.10+` with pip
- **Groq API Key**: Set `GROQ_API_KEY` in `backend/.env` (obtainable at [console.groq.com](https://console.groq.com))

---

### 1. Installation

Install Node.js dependencies from the repository root:
```bash
npm install
```
*(If you prefer pnpm, run `pnpm install`)*

Install Python backend dependencies:
```bash
pip install -r backend/requirements.txt
```

Configure your environment variables:
```bash
# In backend/.env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

---

### 2. Start the Backend (FastAPI on Port 8000)

From the repository root:
```bash
npm run backend
```
*Or directly with Python:*
```bash
python backend/main.py
```
*(Or with pnpm: `pnpm backend`)*

- **API Health Check:** [http://localhost:8000/](http://localhost:8000/)
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Developer Testing Dashboard:** [http://localhost:8000/dev/dashboard](http://localhost:8000/dev/dashboard)

---

### 3. Start the Frontend (Next.js on Port 3000)

From the repository root:
```bash
npm run frontend
```
*(Or with pnpm: `pnpm frontend`)*

- **Candidate Room:** [http://localhost:3000/](http://localhost:3000/)
- **Admin Dashboard Overview:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Candidate Pipeline Tracker:** [http://localhost:3000/admin/candidates](http://localhost:3000/admin/candidates)
- **Model Calibration & Settings:** [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings)
- **Dynamic Interview Builder:** [http://localhost:3000/admin/setup](http://localhost:3000/admin/setup)

---

## Testing & Quality Assurance

- **Run Modular Test Suite (55 automated tests):**
  ```bash
  npm run test:backend
  ```
  *(Or directly: `python -m pytest backend/tests -v`)*

- **Build Frontend Production Bundle:**
  ```bash
  npm run build:frontend
  ```
  *(Or with pnpm: `pnpm build:frontend`)*

- **Lint Frontend:**
  ```bash
  npm run lint:frontend
  ```
