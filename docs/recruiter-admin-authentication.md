# Recruiter & Admin Authentication, Authorization & Security Hardening

## Overview
This document details the security architecture, stateless JWT authentication system, password hashing standards, role-based access control (RBAC), API rate limiting, application hardening, and Next.js route protection for the Conlatus AI Interview platform.

---

## Technical Specifications & Security Stack

### 1. Backend Security Stack (`backend/core/security.py`)
- **Password Hashing:** `bcrypt` salted password hashing with 72-byte truncation safety.
- **JWT Cryptography:** Signed JWTs using `HS256` HMAC-SHA256.
  - **Access Tokens:** Expire in 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
  - **Refresh Tokens:** Expire in 7 days (`REFRESH_TOKEN_EXPIRE_DAYS`).
  - **Candidate Link Session Tokens:** Signed single-use session tokens for `/interview/start` and live dialogue endpoints without requiring candidate user accounts.

### 2. API Endpoints (`backend/routers/auth.py`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Registers a new recruiter or admin account and attaches optional organization metadata. |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticates credentials, issues JWT access/refresh tokens, and sets `auth_token` HTTP-only cookie. Throttled to 5 requests/min. |
| `POST` | `/api/v1/auth/refresh` | Public | Exchanges a valid refresh token for a fresh access token pair. |
| `GET` | `/api/v1/auth/me` | Protected (`get_current_user`) | Returns details of the currently authenticated recruiter or admin user. |
| `POST` | `/api/v1/auth/logout` | Public | Clears `auth_token` cookie and invalidates client session. |

### 3. Application Hardening (`backend/main.py`)
- **Rate Limiting:** `slowapi` rate limiter integrated across authentication routes to prevent brute-force attacks.
- **CORS Controls:** Restricted to configured frontend origins (`settings.ALLOWED_ORIGINS`).
- **Security Headers Middleware:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...`

---

## Frontend Route Protection & Auth State

### 1. Next.js Route Guard (`frontend/src/middleware.ts`)
Interprets server-side requests to `/admin/*` views (excluding `/admin/login`). Checks for `auth_token` cookie and automatically redirects unauthenticated visitors to `/admin/login?redirect=...`.

### 2. Client-Side Auth State (`frontend/src/context/AuthContext.tsx`)
React Context provider supplying `user`, `accessToken`, `login`, `register`, and `logout` across all admin routes. Coordinates localStorage and cookie sync.

### 3. Admin Login Page (`frontend/src/app/admin/login/page.tsx`)
Modern glassmorphic authentication interface featuring dual tab switching (Sign In / Create Account), glowing gradient highlights, error feedback banners, and redirect handling.
