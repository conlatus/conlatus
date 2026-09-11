"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SignInPage, GlassInputWrapper } from "@/components/ui/sign-in";
import { ArrowLeft, User, Building2, ShieldCheck } from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || searchParams.get("mode");
  const [tab, setTab] = useState<"login" | "register">(
    requestedTab === "register" || requestedTab === "signup" ? "register" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState("");

  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();
  const redirectTarget = searchParams.get("redirect") || "/admin/setup";

  // Sync tab state if URL search query changes
  useEffect(() => {
    const requested = searchParams.get("tab") || searchParams.get("mode");
    if (requested === "register" || requested === "signup") {
      setTab("register");
    } else if (requested === "login") {
      setTab("login");
    }
  }, [searchParams]);

  // Pre-load remembered email
  useEffect(() => {
    if (typeof window !== "undefined") {
      const remembered = localStorage.getItem("remembered_admin_email");
      if (remembered) setRememberedEmail(remembered);
    }
  }, []);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, redirectTarget, router]);

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim() || "";
    const password = formData.get("password") as string || "";
    const rememberMe = formData.get("rememberMe") === "on";

    try {
      if (tab === "login") {
        await login(email, password);
        if (rememberMe) {
          localStorage.setItem("remembered_admin_email", email);
        } else {
          localStorage.removeItem("remembered_admin_email");
        }
      } else {
        const fullName = (formData.get("fullName") as string)?.trim() || "";
        const companyName = (formData.get("companyName") as string)?.trim() || "";
        const role = (formData.get("role") as string) || "recruiter";
        await register(email, password, fullName, companyName, role);
      }
      router.push(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    setError("Password reset link request initiated. Please contact your system administrator.");
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#050505]">
      {/* Top Floating Navigation Back Link */}
      <div className="absolute top-6 left-6 z-30">
        <button
          onClick={() => router.push("/")}
          className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-xs font-medium text-white/70 hover:text-white hover:border-white/20 transition-all duration-300 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </button>
      </div>

      <SignInPage
        title={
          tab === "login" ? (
            <span className="font-light text-white tracking-tight">
              Welcome back to{" "}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-200">
                Conlatus
              </span>
            </span>
          ) : (
            <span className="font-light text-white tracking-tight">
              Create an{" "}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-200">
                Account
              </span>
            </span>
          )
        }
        description={
          tab === "login"
            ? "Sign in to access your talent intelligence suite, question synthesis, and live candidate telemetry."
            : "Register as a recruiter or hiring administrator to configure assessment rubrics and review technical candidates."
        }
        heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400&auto=format&fit=crop"
        onSignIn={handleSignInSubmit}
        onResetPassword={handleResetPassword}
        onCreateAccount={() => {
          setError(null);
          setTab(tab === "login" ? "register" : "login");
        }}
        isLoading={isSubmitting}
        error={error}
        defaultEmail={rememberedEmail}
        submitButtonText={tab === "login" ? "Sign In to Dashboard" : "Register Account"}
        switchAccountPrompt={tab === "login" ? "New to our platform?" : "Already have an account?"}
        switchAccountActionText={tab === "login" ? "Create Account" : "Sign In to Dashboard"}
      >
        {/* Additional registration fields when tab is 'register' */}
        {tab === "register" && (
          <div className="space-y-4 animate-element animate-delay-200">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Full Name
              </label>
              <GlassInputWrapper>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 ml-4 text-zinc-500 shrink-0" />
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    className="w-full bg-transparent text-sm p-4 pl-3 rounded-2xl focus:outline-none text-white placeholder-zinc-500"
                  />
                </div>
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Company / Organization
              </label>
              <GlassInputWrapper>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 ml-4 text-zinc-500 shrink-0" />
                  <input
                    name="companyName"
                    type="text"
                    placeholder="Conlatus AI Labs"
                    className="w-full bg-transparent text-sm p-4 pl-3 rounded-2xl focus:outline-none text-white placeholder-zinc-500"
                  />
                </div>
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Role & Permissions
              </label>
              <GlassInputWrapper>
                <div className="relative flex items-center pr-3">
                  <ShieldCheck className="w-4 h-4 ml-4 text-zinc-500 shrink-0" />
                  <select
                    name="role"
                    defaultValue="recruiter"
                    className="w-full bg-transparent text-sm p-4 pl-3 rounded-2xl focus:outline-none text-white cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white"
                  >
                    <option value="recruiter">Recruiter / Technical Interviewer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </GlassInputWrapper>
            </div>
          </div>
        )}
      </SignInPage>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full bg-[#050505] text-white flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
