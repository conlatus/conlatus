# Devlog: Building the Asynchronous Database Abstraction Layer

**Date:** September 1, 2026  
**Author:** Antigravity AI Engineering  
**Topic:** SQLAlchemy 2.0 Async Engine, Alembic Migrations, and Zero-Friction SQLite/Postgres Dialect Switching  

---

Hey team! Grab a fresh cup of coffee ☕ because today we just shipped a massive foundational upgrade to the Conlatus backend architecture: a fully asynchronous, dialect-agnostic database abstraction layer built on **SQLAlchemy 2.0** and **Alembic**!

### 💡 Why We Built This

Up until now, our MVP had minimal in-memory state. As we scale Conlatus into a enterprise-grade AI interviewing platform, we needed a robust persistence layer that:
1. **Requires zero setup for local devs:** Anyone cloning the repo should be able to run the backend out-of-the-box with local SQLite (`conlatus.db`).
2. **Switches seamlessly to production Postgres:** Flipping `DATABASE_URL` in `.env` to a Supabase or Neon connection string just works — no code changes, no driver hacks, no query rewrites!

---

### ⚙️ Under The Hood: Technical Specs

#### 1. Dynamic Dialect Provider (`backend/core/config.py` & `database.py`)
We built a smart Pydantic `Settings` provider that inspects `DATABASE_URL`:
- If SQLite: automatically wraps it with `sqlite+aiosqlite://`, disables thread checks (`check_same_thread=False`), and turns on WAL mode (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`) on connection checkout.
- If PostgreSQL: normalizes `postgresql://` -> `postgresql+asyncpg://` and enables connection pooling (`pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`).
- For Alembic migrations: converts URLs to sync equivalents (`sqlite://` or `postgresql://`) so schema upgrades run blazingly fast.

#### 2. Clean Base Mixins (`backend/models/base.py`)
- `UUIDMixin`: Generates UUID v4 primary keys (`id`) using SQLAlchemy's native `UUID(as_uuid=True)` type across both SQLite and PostgreSQL.
- `TimestampMixin`: Automatically sets `created_at` and `updated_at` with server default `func.now()`.

#### 3. Core Domain Models (`backend/models/`)
We established all 7 core domain models with explicit foreign key cascades and relationships:
- 🏢 `Company`: Organization accounts & domain indexing (`companies`).
- 👤 `User`: Admin & recruiter accounts with hashed passwords (`users`).
- 💼 `Role`: Job roles, competency definitions, and rubric JSON (`roles`).
- ❓ `Question`: Curated & generated interview questions (`questions`).
- 🎯 `Interview`: Candidate instances, token access, and lifecycle state (`interviews`).
- 💬 `Transcript`: Turn-by-turn dialogue logs with audio URLs & metadata (`transcripts`).
- 📊 `Report`: AI evaluation scores, rubric breakdown, and human recruiter verdicts (`reports`).

#### 4. Alembic Migration Suite (`backend/alembic/`)
- Initialized Alembic with `env.py` configured for dynamic `DATABASE_URL` parsing.
- Enabled SQLite batch mode (`render_as_batch=True`) for flawless SQLite migration operations.
- Generated initial schema migration `0001_initial_schema.py` and verified `python -m alembic upgrade head` execution!

---

### 🧪 Verification & Proof

We ran full integration tests creating all 7 entities, asserting foreign key cascades, JSON field serialization, and session lifecycle (`get_db()` dependency). Everything passed cleanly!

```bash
INFO [alembic.runtime.migration] Running upgrade -> e3db949fd4a5, Initial schema
Successfully committed all test records!
```

Stay tuned for our next update where we wire up JWT authentication and wire these models into our API endpoints! 🚀
