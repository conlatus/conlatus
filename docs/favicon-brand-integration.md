# Favicon & Brand Icon Integration

## Overview
This update configures the official Conlatus brand icon/favicon provided in `frontend/public/conlatus-logo.ico`.

## Changes Implemented
1. **Favicon Placement**:
   - Copied `conlatus-logo.ico` to `frontend/src/app/favicon.ico` (standard Next.js App Router root icon convention).
   - Copied to `frontend/public/favicon.ico` as an explicit static asset fallback.
2. **Metadata Configuration**:
   - Updated `frontend/src/app/layout.tsx` to explicitly register `icons: { icon: "/favicon.ico" }` and set document title to `"Conlatus — AI Technical Interview Platform"`.
3. **UI Branding Enhancements**:
   - Integrated the icon into the candidate interview room top header in [page.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/Set-main.app/frontend/src/app/page.tsx).
   - Added the brand icon to the admin navigation sidebar header in [admin/layout.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/Set-main.app/frontend/src/app/admin/layout.tsx).

## Verification
- HTTP `GET /favicon.ico` returns `200 OK` (`image/x-icon`, 4,286 bytes).
- Verified production build (`pnpm build:frontend`) passes cleanly with zero errors.
