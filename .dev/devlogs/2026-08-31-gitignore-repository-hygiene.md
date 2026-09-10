# Devlog: Gitignore Protocol & Monorepo Hygiene Overhaul 🧹🚀

**Date:** 2026-08-31  
**Author:** Antigravity Engineering  
**Mood:** Fresh, clean, and artifact-free! ☕✨

---

### What went down?

Ever open `git status` only to see hundreds of Turbopack `.sst` / `.meta` chunks and `.next/` cache traces screaming for attention? Yeah, we've all been there! 

When our monorepo split into separate `/backend` and `/frontend` directories, the legacy root `.gitignore` rules had leading slashes like `/.next/` and `/coverage`. Git strictly matches leading slashes from the directory where the `.gitignore` lives, so anything generated inside `frontend/.next` completely bypassed the rule. On top of that, Next.js 16 / Turbopack build caches had inadvertently made their way into git tracking previously.

### The Fix

1. **Unslashed the Root Rules:**
   - Changed `/.next/` -> `.next/`
   - Changed `/coverage` -> `coverage/`
   - Changed `/.pnp` -> `.pnp/`
   - Added `.turbo/`, `build/`, `dist/`, and `out/`.
   
2. **Added Deep Python & Testing Protection:**
   - Added `temp-tests/` so any temporary Python testing directories are automatically ignored.
   - Added coverage for `.pytest_cache/`, `htmlcov/`, `.coverage*`, `*.sqlite*`, `.db*`, `*.pem`, `*.key`, `*.cert`, `*.crt`.

3. **Dedicated Frontend Safety Net:**
   - Created `frontend/.gitignore` with direct Next.js & Turbopack exclusions.

4. **Cleaned the Git Index:**
   - Safely purged `frontend/.next` from git tracking with `git rm -r --cached` while leaving local files intact.
   - Verified that `git status` is completely pristine now!

### Tech Stack & Specs Under the Hood
- **Git version control** with monorepo-compatible path matching.
- **Next.js 16.2.12 Turbopack** dev cache patterns ignored.
- **Python / pytest** temporary sandbox protocol adhered to.

Here's to a spotless git log! 🥂
