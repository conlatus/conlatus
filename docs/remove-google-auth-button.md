# Removal of "Continue with Google" on Login & Signup Dashboards

## Overview
This update streamlines the authentication interface by removing the disabled "Continue with Google" button and its separating divider from both the Login and Signup (Register) tabs within the authentication portal (`/admin/login`). It also adds Next.js redirects for direct navigation to `/login` and `/signup`.

---

## Architectural & Component Changes

### 1. `SignInPage` UI Component (`frontend/src/components/ui/sign-in.tsx`)
- **Conditional Google Auth Display**: The `"Or continue with"` divider and the `"Continue with Google"` button were converted into conditional blocks (`{onGoogleSignIn && ( ... )}`). If `onGoogleSignIn` is omitted, no Google authentication elements are rendered.
- **Dynamic Account Switch Prompts**: Added `switchAccountPrompt` and `switchAccountActionText` props to `SignInPageProps` so the call-to-action at the bottom dynamically reflects whether the user is logging in or registering.

### 2. Admin Authentication Controller (`frontend/src/app/admin/login/page.tsx`)
- **Removed Google Sign-In Handler**: Removed `handleGoogleSignIn` and the associated `onGoogleSignIn` prop from `<SignInPage />`.
- **Query Parameter Synchronization**: Added support for `?tab=register` and `?tab=signup` query parameters via `useSearchParams()`. When arriving with a register or signup query, the page defaults to the registration form view.
- **Dynamic Action Labels**: Configured dynamic prompts (`switchAccountPrompt` and `switchAccountActionText`) to switch between "New to our platform? Create Account" when on the sign-in tab, and "Already have an account? Sign In to Dashboard" when on the registration tab.

### 3. Next.js Routing Redirects (`frontend/next.config.mjs`)
- Configured declarative redirects:
  - `/login` $\rightarrow$ `/admin/login`
  - `/signup` $\rightarrow$ `/admin/login?tab=register`
  - `/register` $\rightarrow$ `/admin/login?tab=register`
- Allows direct browser navigation or external links to land on the correct authentication tab cleanly.

### 4. Component Demo Preview (`frontend/src/components/ui/demo.tsx`)
- Removed unused `handleGoogleSignIn` and `onGoogleSignIn` prop in the component demo sandbox.

---

## Verification & Status
- Both Login and Register tabs render strictly email/password input fields and submit actions.
- The UI maintains smooth micro-animations (`animate-element`) without layout shifts.
