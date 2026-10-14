# 2026-10-12 - The Ghost of Port 3001 Busted! 👻🚪

Pour another cup of hot brew, friends, because we just solved the classic mystery of the "silent database failure"! ☕🔍

### The Mystery
The browser screamed `OPTIONS /api/v1/auth/register 400 Bad Request`, and no recruiter account was landing in SQLite. It felt like the database engine was on strike or SQLite forgot how to open `conlatus.db`!

### The Detective Work
When we examined the network traffic and active listening sockets:
1. Next.js had launched on port `3001` (because port `3000` was already occupied).
2. The browser faithfully fired an HTTP `OPTIONS` preflight request with `Origin: http://localhost:3001`.
3. Starlette's `CORSMiddleware` checked `ALLOWED_ORIGINS`—which only had port `3000`—and immediately threw `400 Bad Request: Disallowed CORS origin`.
4. Because the preflight choked at the front door, the browser refused to even send the `POST` payload. SQLite never even heard a whisper of the registration request!

### The Bulletproof Fix
- **Dynamic Localhost Regex**: Added `allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$"` to `backend/main.py`. Now whatever port Next.js picks (3000, 3001, 3002, etc.), CORS will warmly greet it with `200 OK`.
- **Explicit Allowed Origins**: Expanded `ALLOWED_ORIGINS` in `backend/core/config.py` to include ports 3001 and 3002.
- **Verification**: Ran FastAPI test client simulations across all origins and verified a full user registration write into SQLite.

Everything is green, smooth, and preflighted! 🚀🎉
