# Multi-Port Development CORS & Preflight Resolution

## Problem Analysis
When the frontend dev server is running on an alternate development port (such as `http://localhost:3001` or `http://127.0.0.1:3001` when port 3000 is occupied), browser fetch requests trigger an HTTP `OPTIONS` preflight request. 

Previously, Starlette's `CORSMiddleware` only allowed port 3000 (`http://localhost:3000`, `http://127.0.0.1:3000`). Consequently:
1. `OPTIONS /api/v1/auth/register` (and `/api/v1/auth/login`) failed with HTTP `400 Bad Request` ("Disallowed CORS origin").
2. The browser blocked the subsequent `POST` payload.
3. The database layer was never reached, giving the appearance that backend SQLite access was failing.

## Architecture & Fix
1. **Dynamic Origin Regex (`allow_origin_regex`)**:
   - Configured `CORSMiddleware` in `backend/main.py` with `allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$"`.
   - This dynamically permits any localhost development port (`3000`, `3001`, `3002`, `8000`, etc.) without manual configuration.

2. **Expanded Default Allowed Origins**:
   - Updated `Settings.ALLOWED_ORIGINS` in `backend/core/config.py` to explicitly include `http://localhost:3001`, `http://127.0.0.1:3001`, `http://localhost:3002`, and `http://127.0.0.1:3002`.

3. **Verification**:
   - Validated through `FastAPI.testclient` that preflight `OPTIONS` requests across `3000`, `3001`, and `3002` return `200 OK` with appropriate `Access-Control-Allow-Origin` headers.
   - Verified that `POST /api/v1/auth/register` successfully executes and inserts users and companies into SQLite.
