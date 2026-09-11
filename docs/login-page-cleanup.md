# Login Page 3D Surface Overlay Cleanup

## Overview
This change refines the recruiter and admin authentication interface (`/admin/login`) by removing the overlay caption text situated directly beneath the interactive 3D WebGL `ElasticMesh` surface.

## Background & Architecture
The Conlatus recruiter login interface is powered by Next.js App Router and utilizes a split-column design:
- **Left Column**: Form controls, glassmorphic input wrappers, and authentication flows (login/register).
- **Right Column**: A visual showcase featuring an interactive 3D WebGL / OpenGL fluid mesh surface powered by `ogl` (`ElasticMesh` component).

Previously, inside the 3D surface card container in [sign-in.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/components/ui/sign-in.tsx), a bottom caption block rendered text over the bottom of the canvas:
```tsx
{/* Bottom Subtle Overlay Vignette & Caption */}
<div className="relative z-10 pointer-events-none space-y-1.5 pt-12">
  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-violet-400">
    <span>Autonomous Technical Screening</span>
  </div>
  <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-sans">
    Real-time voice synthesis, deterministic rubric scoring, and zero recruiter bias.
  </p>
</div>
```

## Changes Implemented
1. **Removed Text Overlay**:
   - In [sign-in.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/components/ui/sign-in.tsx), deleted the bottom caption container (`Autonomous Technical Screening` badge and the descriptive summary paragraph).
2. **Preserved Clean Canvas Viewport**:
   - The interactive 3D `ElasticMesh` canvas now renders completely unobstructed across its container, preserving the top HUD micro-tag (`CONLATUS // RUNTIME` and `3D WebGL Surface`) while offering maximum visual clarity for the interactive particle mesh.

## Verification
- Verified [sign-in.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/components/ui/sign-in.tsx) syntax and JSX structure.
- Validated that the component cleanly renders inside [admin/login/page.tsx](file:///c:/Users/SIS/Documents/Diploma/DI-Sem5/MinorProject/MVP/frontend/src/app/admin/login/page.tsx).
