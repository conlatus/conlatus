# Tailwind CSS v4 `@apply` Shadow Utility Syntax Fix

## Overview
During the Next.js 16.2.12 Turbopack frontend build, PostCSS failed when processing `globals.css`:
```text
CssSyntaxError: tailwindcss: globals.css:1:1: Cannot apply unknown utility class `shadow-[inset_0_1px_1px_rgba(255,`
```

## Root Cause Analysis
In Tailwind CSS v4 (using `@tailwindcss/postcss`), the `@apply` directive splits class lists by whitespace (`\s+`).
In `frontend/src/app/globals.css`, `.glass-panel` and `.glass-panel-inner` were defined with spaces inside the arbitrary value utilities:
- `shadow-[inset_0_1px_1px_rgba(255, 255, 255, 0.05)]`
- `shadow-[inset_0_1px_1px_rgba(255, 255, 255, 0.1)]`

This caused the PostCSS parser to break at the first space, yielding an unclosed arbitrary utility token `shadow-[inset_0_1px_1px_rgba(255,` and throwing a build-breaking `CssSyntaxError`.

## Changes Applied
Eliminated the whitespace within arbitrary values cutting down to compact `rgba(r,g,b,a)` notation in `frontend/src/app/globals.css`:
- `.glass-panel`: updated to `shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]`
- `.glass-panel-inner`: updated to `shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`

## Verification
Executed `pnpm run build:frontend` (`next build` with Turbopack). Verified:
1. Tailwind CSS PostCSS evaluation completed without syntax errors.
2. Next.js App Router successfully compiled all client and server components.
3. Static and dynamic route generation succeeded across all 10 pages.
