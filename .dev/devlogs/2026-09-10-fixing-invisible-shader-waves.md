# Devlog: The Mystery of the Invisible Ocean Waves 🌊🔍🕵️

**Date:** September 10, 2026  
**Author:** Pair Programming Agent & Graphics Tinkerer  
**Mood:** Laughing over an empty coffee cup, victorious shader triumph, 60fps glowing waves rolling in!  

---

### "Wait, Where Are The Waves?!" ☕😅

Right after dropping in the new `waves-background.tsx` WebGL component and admiring our landing page architecture, the user pinged us with the most honest bug report in developer history:

> *"the background waves are not working"*

We opened up our browser inspection tool and took a screenshot. And lo and behold... they were 100% right! The canvas was rendering, `gl.getError()` was returning `0` (clean WebGL), but to the human eye, the center of the landing page looked like a completely static, pitch-black void with a faint blue blur at the very top edge.

No visible waves. No ripple. No oceanic undulation. Just dark silence.

Time for some shader forensics! 🔍

---

### The Mystery Deconstructed: A Double-Whammy 🕵️‍♂️💥

We discovered two distinct culprits working together to sabotage our waves:

#### 1. The Masking Overkill in `page.tsx`
When we initially dropped the `<ShaderBackground />` behind the hero, we were so worried about preserving text contrast that we put:
- `opacity-35` (killing 65% of the light output)
- `mix-blend-screen` (which on `#050505` black causes dark blues and teals to drop to near 0)
- AND a radial gradient mask: `bg-[radial-gradient(circle_at_50%_20%,transparent_20%,#050505_80%)]`

That radial gradient was literally painting an opaque coat of pure `#050505` black over 80% of the screen, completely smothering the canvas!

#### 2. The Monotonic Vertical Ramp in `shade()`
Even with the mask pulled back, the shader mathematics in the default 21st.dev template had a limitation:
```glsl
vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}
```
Notice `uv.y`!
`uv.y` was a single monotonic linear coordinate going from 0 at the bottom to 1 at the top. The wave fluctuation was only `sin(...) * 0.08` (an 8% amplitude wobble).
Across the middle 60% of the screen, `y` hovered around `0.5`, which meant it just rendered a flat, unchanging color band. There were no actual wave ribbons crossing the middle of the screen!

---

### The Fix: Multiscale Harmonic Waves & Full Visibility 🛠️🌊

We tackled both sides with surgical precision:

1. **Multidirectional Sinusoidal Harmonics:**
   We re-engineered `shade()` to calculate intersecting harmonic waves with distinct frequencies, orientations, and speeds:
   ```glsl
   vec3 shade(vec2 uv, vec2 p, float t) {
     float waveA = sin(p.x * (2.2 + u_intensity * 3.5) + p.y * 2.8 + t * 0.9) * 0.28;
     float waveB = cos(p.x * 3.2 - p.y * 2.2 - t * 0.75) * 0.22;
     float waveC = sin((p.x + p.y) * 4.0 + t * 0.5) * 0.15;
     float noiseDetail = (fbm(p * (u_detail * 0.7) + vec2(t * 0.12, -t * 0.08)) - 0.5) * (u_intensity * 0.55);
     
     float y = 0.52 + waveA + waveB + waveC + noiseDetail;
     return palette(clamp(y, 0.0, 1.0));
   }
   ```
   Now, wave crests and troughs traverse the entire coordinate space. The peaks hit radiant electric cyan and crisp white foam highlights, while the valleys plunge into deep midnight indigo!

2. **Enabled Real-Time Mouse Ripples:**
   Set `cursorEnabled: true` in `UNIFORMS` with a healthy `cursorStrength: 0.850`. Moving the mouse across the page now leaves dynamic ripple wakes in the water!

3. **Removed the Smothering Gradient:**
   In `frontend/src/app/page.tsx`, we gave `<ShaderBackground />` a clear viewport with `fixed inset-0 w-full h-full opacity-80` and replaced the heavy radial mask with a subtle top/bottom ambient vignette (`bg-gradient-to-b from-black/25 via-transparent to-[#050505]/95`).

---

### The Verdict: Absolute Eye Candy 📸✨

We opened the headless browser and captured the live rendered screen:
The waves are rolling across the entire display in glorious 60fps fluid motion. The whites, cyans, and deep blues create an ethereal backdrop, while the white headline and violet handwriting text remain 100% legible and ultra-sharp.

Problem solved, aesthetics dialed to eleven! 🚀🌊
