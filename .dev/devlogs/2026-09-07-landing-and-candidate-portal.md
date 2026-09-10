# Devlog: Rolling Out the Red Carpet — Landing Page, Candidate Portal & 1-Click WhatsApp Sharing!

**Date:** September 7, 2026  
**Mood:** ☕ Espresso-fueled, smiling, and feeling sleek  
**Soundtrack:** Lo-fi Synthwave & ambient keystrokes  

---

Hey team! Grab your mug, pull up a chair, and let me tell you about what we just landed.

You know that feeling when you invite someone to your house, but the front door was actually a back alley straight into the control room? Yeah... that was our root `/` route. If you visited without an ID query param, you were basically staring at an empty room wondering, *"Wait, am I supposed to talk right now? Where is everybody?"*

Not anymore. We just built an ultra-clean, jaw-dropping front porch for Conlatus, built a dedicated VIP lounge for candidates, and gave our recruiters actual Zoom-style and WhatsApp sharing powers.

Let’s unpack how we did it under the hood!

---

### 1. The New Front Door: The Obsidian Landing Page (`/`)

The root page is no longer an orphaned interview room. It’s now an obsidian-themed (`#050505`) experience powered by `framer-motion` and our custom WebGL-inspired `SpecularContainer` shaders.

The centerpiece? A crystal-clear **"What are you here for?"** role selector:
- **I am a Candidate:** Directly invites candidates with an inline access-code launcher. Type your code, tap "Join", and boom — you’re directed straight into `/interview/[code]`.
- **I am a Recruiter / Admin:** Takes hiring managers to the admin suite (`/admin/login`). And if you’re already logged in? It detects your cached session and immediately offers a 1-click hop into `/admin`.

No more confusion. No more broken URLs. Just pure, intentional UX.

---

### 2. The Dedicated Candidate Portal (`/interview` & `/interview/[code]`)

We broke the monolithic interview code out of `page.tsx` and modularized it into a standalone `<InterviewRoom />` component in `frontend/src/components/interview/InterviewRoom.tsx`.

Then, we stood up two new App Router entrypoints:
- `app/interview/page.tsx` (Manual code entry portal)
- `app/interview/[code]/page.tsx` (Direct link entry)

Here’s the cool technical detail:
When a candidate types or lands with an access code, the frontend debounces a call to our new backend endpoint `GET /interview/details/{code}`. It instantly verifies the code against both the in-process `interview_store` and our SQLAlchemy database. If valid, the UI renders a live preview badge displaying the **Company Name**, **Job Role**, and **Expected Duration** before the candidate even touches their microphone!

When they click **"Start Technical Interview"**:
1. It calls `POST /interview/join` with `{ interview_code, candidate_name, candidate_email }`.
2. The FastAPI backend generates a cryptographic candidate JWT token via `create_interview_token(interview_id, candidate_email)` with claim `type="interview_session"`.
3. It sets the `auth_token` browser cookie and passes the bearer token into `InterviewRoom`.
4. All subsequent calls — starting the session, audio chunks to Groq Whisper v3, and typed fallback turns — pass this token in the `Authorization: Bearer <token>` header. Zero 401 Unauthorized hiccups.

---

### 3. Zoom-Style Plaintext & 1-Click WhatsApp Sharing

Our recruiters asked for Zoom-like convenience, and we delivered:
In `admin/setup/page.tsx`:
- When you click **"Generate Link"**, the URL is cleanly drafted as `${origin}/interview/${interview_id}`.
- Right below the direct link, recruiters get two supercharged sharing actions:
  1. **Share Invite via WhatsApp:** A dedicated WhatsApp button that triggers `https://api.whatsapp.com/send?text=...` with a perfectly formatted invitation text including role title, duration, code, and direct link.
  2. **Copy Full Invitation (Zoom Style):** One-click button that copies the whole structured announcement straight into their clipboard, formatted for Slack, LinkedIn, or Email.

We also wired this up into `admin/candidates/page.tsx` so recruiters can share or re-send invitations directly from candidate table rows!

---

### 4. Admin Auth Caching & "Remember Me"

We tied up a lingering loose end in `AuthContext.tsx` where tokens were saved under `access_token` while some admin pages were hunting for `admin_token`. Now, both tokens and the `auth_token` cookie are kept strictly in lockstep.
We also added a **"Remember my email"** toggle in the admin login form, plus an automatic redirect for recruiters who already have an active session.

---

### The Verification

We didn't just write code and hope for the best:
- Tested the backend candidate flow (`details`, `join`, `start`) using the strict temporary test protocol (`temp-tests`).
- Ran all 55 pytest unit and integration tests across the backend — 100% green!
- Executed `pnpm build` in the Next.js frontend with Turbopack. Caught a missing `useEffect` import during TypeScript checks, fixed it in seconds, and watched all 10 routes compile like a dream!

That's it for this sprint. The front door is open, the candidate room is humming, and recruiter workflows are faster than ever.

Catch you in the next one! 🚀
