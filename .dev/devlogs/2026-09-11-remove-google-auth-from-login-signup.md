# Devlog: Kicking Google Auth to the Curb & Polishing the Login/Signup Dashboards

**Date:** September 11, 2026  
**Author:** Fellow AI Dev  
**Mood:** Caffeinated, satisfied, and cutting out the bloat ☕  

---

### Hey friend! Grab a cup of joe... ☕

You know that feeling when you look at a crisp, slick auth dashboard, and right below your handcrafted credentials form, there’s a big "Continue with Google" button that... just throws a mock toast saying *"Google OAuth is disabled in local mode"*? Yeah, it was time for that button to gracefully pack its bags and exit stage left!

Today, we officially pruned the Google OAuth button and the "Or continue with" divider completely from both the **/login** (Sign In) and **signup** (Create Account) recruiter dashboards. No more phantom buttons, no more unnecessary noise—just pure, focused authentication.

---

### What went down under the hood 🛠️

Let’s talk brass tacks and technical specs:

1. **Made `SignInPage` in `frontend/src/components/ui/sign-in.tsx` smarter & cleaner:**
   - Instead of unconditionally displaying the divider and Google button, we wrapped them inside a conditional `{onGoogleSignIn && ( ... )}` check. So if no Google handler is provided, that entire DOM subtree simply never mounts.
   - We also introduced two new flexible props to `SignInPageProps`: `switchAccountPrompt` and `switchAccountActionText`.
   - Now, when you're in sign-in mode, it prompts: *"New to our platform? Create Account"*. When you switch over to registration mode, it seamlessly swaps to: *"Already have an account? Sign In to Dashboard"*. Smooth and contextual!

2. **Cleaned up `frontend/src/app/admin/login/page.tsx`:**
   - Removed the dead `handleGoogleSignIn` callback and omitted the `onGoogleSignIn` prop.
   - Wired up reactive URL query param detection with Next.js App Router's `useSearchParams()`.
   - Now, passing `?tab=register` or `?tab=signup` initializes and keeps the `tab` state strictly synchronized with the URL!

3. **Configured Next.js Route Redirects in `frontend/next.config.mjs`:**
   - Added asynchronous `redirects()` to map friendly root routes directly to the admin auth hub:
     - `/login` $\rightarrow$ `/admin/login`
     - `/signup` $\rightarrow$ `/admin/login?tab=register`
     - `/register` $\rightarrow$ `/admin/login?tab=register`
   - Now, whether a teammate types `/login` or `/signup` into the address bar, Next.js routes them right where they need to be with the exact tab pre-selected!

4. **Housekeeping in `demo.tsx`:**
   - Purged the leftover Google handlers in the UI demo sandbox so everything stays coherent across the codebase.

---

### Verification & The High-Five Moment 🚀

We kicked off `pnpm --prefix frontend run build`, and Next.js 16.2.12 with Turbopack compiled everything into production-ready static & dynamic chunks in 4.7 seconds flat with zero TypeScript or lint errors. 

The login and signup screens look ultra-sleek, laser-focused, and 100% true to our self-hosted JWT authentication engine.

Catch you on the next commit! 🚀🔥
