# UI Palette Harmonization & Hover Effect Refinement

## Overview
This feature resolves visual inconsistency and aggressive hover states across the Conlatus platform by standardizing on the brand palette established on the root landing page (`/`):
- **OLED Surface Foundation**: `#050505` deep black backgrounds, zinc borders (`border-white/10` or `border-zinc-800`), and clean blur surfaces (`backdrop-blur-xl`).
- **Brand Violet/Indigo Identity**: Primary gradient `from-violet-600 to-indigo-600`, with accents using `violet-400`, `violet-300`, and `violet-500/20`.
- **Calm, High-Performance Surfaces**: Removal of distracting mouse-tracking WebGL shader specular borders on dashboard cards in favor of crisp, static glass borders.
- **Button Wrap Fix**: Inline-flex and `whitespace-nowrap` guarantees for action buttons and header bars, preventing icons from splitting onto new lines.

---

## Architectural & Styling Changes

### 1. Specular Container & Hover Border De-escalation
- **Previous State**: `SpecularContainer` initiated an active WebGL shader with proximity-based pointer tracking (`proximity = 350`, `followMouse = true`). Moving the mouse caused dynamic white specular lines and bright rims to flash across all dashboard cards.
- **Updated State**: The component was converted into a lightweight, high-performance static glass container:
  - Eliminates unnecessary canvas GPU cycles and mouse-move listeners.
  - Retains the exact same component API (`radius`, `tint`, `tintOpacity`, `className`, `contentClassName`, `children`).
  - Utilizes `bg-zinc-950/60`, `backdrop-blur-xl`, and `border border-white/10`, perfectly matching the landing page cards.
  - Removed all aggressive `hover:border-white/20` and `group-hover:scale-105` escalations.

### 2. Button Width & Content Wrapping Fix
- **Previous State**: In the `/admin` top command header, the "Create Interview" button wrapped the `+` icon onto a separate line above the text due to missing `inline-flex` / `whitespace-nowrap` constraints and container wrapping.
- **Updated State**:
  - In `SpecularButton.css`, `.specular-button` and `.specular-button__label` now explicitly define `display: inline-flex`, `align-items: center`, `justify-content: center`, `gap: 0.375rem`, `white-space: nowrap`, and `flex-shrink: 0`.
  - In `admin/page.tsx`, the action button is formatted with `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 ... whitespace-nowrap shrink-0`.
  - The sibling "Candidate Tracker" button matches the exact height and padding (`px-4 py-2 rounded-xl text-xs`) for symmetric visual balance.

### 3. Palette Standardization Across `/admin` & `/interview`
All generic emerald and green classes across admin and candidate portals were refactored to violet/indigo:
1. **Admin Hub (`/admin`)**:
   - Status indicators, pulse dots, and header badges updated to `bg-violet-400` and `text-violet-300`.
   - "Top Candidate" cards and trend indicators use `accentColor="#8b5cf6"`.
   - Metrics cards retain purposeful semantic colors for warning/success metrics (e.g. Amber for scores, Teal for completion rate) without generic emerald overrides.
2. **Setup View (`/admin/setup`)**:
   - Generation CTA upgraded to `bg-gradient-to-r from-violet-600 to-indigo-600`.
   - Success invite banners, mode selection tabs, focus rings, and curriculum cards updated to violet.
3. **Candidates Table (`/admin/candidates`) & Detail (`/admin/candidates/[id]`)**:
   - Invite button, search input focus rings, candidate avatars, status pills, and score bars use violet.
   - Transcript timeline candidate speaker tags and verdict actions use violet.
4. **Settings (`/admin/settings`)**:
   - Primary inference provider cards, toggle sliders (`accent-violet-500`), checkboxes, and save actions updated to violet.
5. **Modal & Charts (`ReportModal.tsx` & `RadarChart.tsx`)**:
   - Radar polygon fill and stroke transitioned from `#10b981` to `#8b5cf6`.
   - Verbatim evidence quotes, tabs, and pass indicators updated to violet.
6. **Candidate Interview Portal (`/interview` & `InterviewRoom.tsx`)**:
   - Background ambient glow shifted from emerald to `bg-violet-600/15`.
   - Access code confirmation, mic/cam active indicators, candidate avatar, input focus ring, and finalized badge use violet.

---

## Verification
- **Build Verification**: Ran Next.js production build (`pnpm --prefix frontend build`), compiling all 10 App Router endpoints successfully with 0 TypeScript or lint errors.
- **Layout Verification**: Confirmed button layout in the header maintains a single-line horizontal alignment across screen sizes.
