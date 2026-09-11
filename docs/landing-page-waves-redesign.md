# Landing Page WebGL Wave Shader Integration & Redesign

## Overview
This feature integrates the 21st.dev `ShaderBackground` WebGL fluid waves component into the Conlatus platform, completely modernizing the root landing page (`/`) while strictly preserving the signature animated handwriting typography font (`HandwritingText`).

## Architecture & Codebase Support

### 1. Project Standards Compliance
The Conlatus web client conforms to modern React & Next.js conventions:
- **shadcn Project Structure**: Component primitives reside in `src/components/ui`, cleanly separating UI system building blocks from domain-level views.
- **Tailwind CSS**: Full Tailwind v4 configuration via `@tailwindcss/postcss` with customized fluid easing curves (`cubic-bezier(0.32, 0.72, 0, 1)`) and hardware-accelerated transforms.
- **TypeScript**: Strict type definitions and path mapping (`@/*` -> `./src/*` in [tsconfig.json](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/tsconfig.json)).

### 2. Component Path & Directory Rationale
- **Default Path**: `frontend/src/components/ui/`
- **Why `/components/ui` Matters**: In shadcn and modern component design systems, primitive, reusable components (like buttons, dialogs, shaders, and text renderers) live in `/components/ui`. This ensures domain code and page routes can consume atomic UI components without circular dependencies or conflicting styles.

### 3. WebGL Shader Architecture & Wave Dynamics Fix (`waves-background.tsx`)
The newly integrated [waves-background.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/components/ui/waves-background.tsx) features:
- **Zero External Dependencies**: Implemented in raw WebGL 1.0 using standard GPU vertex and fragment pipelines.
- **Harmonic Multiscale Wave Displacement**: Replaced a single-pass vertical ramp with multidirectional sinusoidal harmonic wave functions (`waveA`, `waveB`, `waveC`) coupled with turbulent FBM noise so that undulating wave ribbons and crests sweep across the entire viewport.
- **Interactive Cursor Dynamics**: Enabled real-time pointer interaction (`cursorEnabled: true`), generating ripple distortions directly under user mouse motion.
- **Perceptual OKLab Color Mixing**: Eliminates muddy gray banding during multi-stop palette blending across midnight abyss, royal blue, electric cyan, and foam white.
- **Eliminated Obscuring Masks**: Replaced an opaque radial black overlay and harsh blend mode with a clean fixed background container with subtle top/bottom ambient vignettes to ensure full wave visibility while maintaining sharp typography contrast.
- **Dynamic Resource Teardown**: Intersects viewport visibility and cleans up WebGL context (`WEBGL_lose_context`) to eliminate memory leaks.

## Landing Page Redesign Highlights ([page.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/app/page.tsx))

1. **Ethereal Living Atmosphere**:
   - Dropped `<ShaderBackground />` behind the hero viewport with a subtle radial contrast wash and gradient fade to OLED black (`#050505`).
2. **Preservation of the OG Handwriting Font**:
   - Maintained the self-inking `<HandwritingText />` component cycling through: `"adaptive voice."`, `"objective rubrics."`, `"deterministic scoring."`, and `"instant reports."`.
3. **Double-Bezel Nested Architecture**:
   - Replaced flat containers with double-bezel cards (`rounded-[2rem] p-1.5 bg-white/5` outer shell with `rounded-[calc(2rem-0.375rem)]` inner core).
4. **Gapless 12-Column Bento Grid**:
   - Feature blocks mathematically interlock (7-5 and 5-7 col-spans) with simulated live audio waveforms, rubric progress meters, dynamic question badges, and verbatim evidence telemetry.
5. **High-Contrast Recruiter Call to Action**:
   - Concludes with an invitation to access the Recruiter Suite (`/admin/login`) or try the Candidate Room (`/interview`).

## Verification
- Web server responds with `HTTP 200 OK` on `http://localhost:3000`.
- Component clean render verified without console warnings or layout shifts.
