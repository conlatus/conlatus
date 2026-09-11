"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ElasticMesh from "./elastic-mesh";

// --- HELPER COMPONENTS (ICONS) ---

export const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  isLoading?: boolean;
  error?: string | null;
  defaultEmail?: string;
  submitButtonText?: string;
  children?: React.ReactNode;
}

// --- SUB-COMPONENTS ---

export const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-all duration-300 focus-within:border-violet-500/60 focus-within:bg-violet-500/[0.08] focus-within:ring-1 focus-within:ring-violet-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
    {children}
  </div>
);

export const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div
    className={`animate-testimonial ${delay} flex items-start gap-3.5 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 w-72 shadow-2xl transition-all duration-500 hover:border-white/20 hover:scale-[1.02]`}
  >
    <img
      src={testimonial.avatarSrc}
      className="h-11 w-11 object-cover rounded-2xl border border-white/10 shrink-0"
      alt={testimonial.name}
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-xs text-white/50">{testimonial.handle}</p>
      <p className="mt-1.5 text-xs text-white/80 line-clamp-3">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tight">Welcome back</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400&auto=format&fit=crop",
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  isLoading = false,
  error = null,
  defaultEmail = "",
  submitButtonText = "Sign In",
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row font-sans w-full bg-[#050505] text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="animate-element animate-delay-100 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                {title}
              </h1>
              <p className="animate-element animate-delay-200 text-sm sm:text-base text-zinc-400 mt-2">
                {description}
              </p>
            </div>

            {error && (
              <div className="animate-element animate-delay-200 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={onSignIn}>
              {children}

              <div className="animate-element animate-delay-300">
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={defaultEmail}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-zinc-500"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Password
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-zinc-400 hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" defaultChecked />
                  <span className="text-zinc-300">Keep me signed in</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onResetPassword?.();
                  }}
                  className="hover:underline text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Reset password
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-4 font-medium text-sm sm:text-base text-white transition-all duration-300 shadow-lg shadow-violet-600/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>{submitButtonText}</span>
                )}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center my-1">
              <span className="w-full border-t border-white/10"></span>
              <span className="px-4 text-xs text-zinc-400 bg-[#050505] absolute">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-white/10 rounded-2xl py-3.5 hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium text-white cursor-pointer bg-white/[0.02]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-xs sm:text-sm text-zinc-400">
              New to our platform?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCreateAccount?.();
                }}
                className="text-violet-400 hover:text-violet-300 hover:underline transition-colors font-medium"
              >
                Create Account
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4 lg:p-6 overflow-hidden">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 lg:inset-6 rounded-3xl bg-[#08080a] border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-6">
            {/* Ambient deep tech gradient behind the 3D mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950/80 to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.08),transparent_70%)] pointer-events-none" />

            {/* Top HUD Micro-Tag */}
            <div className="relative z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[11px] font-mono text-zinc-300 tracking-wider">
                  CONLATUS // RUNTIME
                </span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 backdrop-blur-md">
                3D WebGL Surface
              </span>
            </div>

            {/* Interactive ElasticMesh Container — Clean without duplicate background */}
            <div className="absolute inset-0 z-0">
              <ElasticMesh
                image={heroImageSrc}
                interaction="hover"
                tilt={12}
                shading={0.65}
                borderRadius={24}
                gridDensity={22}
                gridOpacity={0.16}
                gridColor="#ffffff"
                className="w-full h-full"
              />
            </div>
          </div>

          {testimonials.length > 0 && (
            <div className="absolute bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 flex gap-4 px-6 w-full justify-center z-10">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
