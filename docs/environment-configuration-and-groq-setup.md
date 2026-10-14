# Environment Configuration & Groq API Key Setup

## Overview
This document details the configuration of environment variables and the integration of Groq API credentials for Conlatus across both development and production environments.

## Architecture & Design
Conlatus leverages Pydantic Settings (`pydantic_settings.BaseSettings`) in FastAPI for strongly typed, validated application configurations, and standard Next.js environment resolution on the frontend.

### Multi-Location .env Resolution
To prevent runtime configuration drift when running tasks from either the monorepo root (e.g. `pnpm run backend`) or directly from the `backend/` directory, `backend/core/config.py` uses multi-location resolution in `SettingsConfigDict`:
- `.env` (current working directory)
- `backend/.env` (relative to current working directory)
- Absolute path to root `.env`
- Absolute path to `backend/.env`

### Environment Keys Configured
- **`GROQ_API_KEY`**: Authenticates requests to Groq Cloud for both reasoning models (`openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b`) and Whisper Large v3 audio transcription.
- **`GROQ_MODEL`**: Primary reasoning LLM model identifier.
- **`GROQ_FALLBACK_MODEL`**: High-availability fallback model in case of rate limits or service interruptions.
- **`JWT_SECRET_KEY`**, **`JWT_ALGORITHM`**, **`ACCESS_TOKEN_EXPIRE_MINUTES`**, **`REFRESH_TOKEN_EXPIRE_DAYS`**: Core JWT signing and lifecycle values for recruiter and admin sessions.
- **`NEXT_PUBLIC_API_URL`**: Base URL for frontend-to-backend REST API and WebSocket communication.

### Version Control Hygiene
All `.env` files are tracked in `.gitignore` to prevent credential exposure, while template configuration files (`.env.example`) are tracked in the repository to guide new environment setups.
