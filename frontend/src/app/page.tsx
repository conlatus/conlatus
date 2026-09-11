"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  Cpu,
  Mic,
  BarChart3,
  CheckCircle2,
  Terminal,
  Activity,
} from "lucide-react";
import { HandwritingText } from "@/components/ui/handwriting-text";
import { ShaderBackground } from "@/components/ui/waves-background";

export default function LandingPage() {
  const router = useRouter();
  const [quickCode, setQuickCode] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") || localStorage.getItem("admin_token")
        : null;
    if (token && token.trim().length > 10) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleQuickCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    router.push(`/interview/${encodeURIComponent(quickCode.trim())}`);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white selection:bg-violet-500/30 selection:text-violet-200 relative overflow-x-hidden font-sans flex flex-col justify-between">
      {/* Dynamic 21st.dev WebGL Wave Shader Atmosphere */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <ShaderBackground className="w-full h-full opacity-80" />
        {/* Subtle Vignette & Gradient Transition to OLED black */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#050505]/95 pointer-events-none" />
      </div>

      {/* Floating Island Navigation Header */}
      <header className="sticky top-4 z-50 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-2">
        <div className="rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-black/80">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <img src="/favicon.ico" alt="Conlatus" className="w-4 h-4 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Conlatus</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 font-mono">
                v0.2
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/interview"
              className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] transition-all"
            >
              Candidate Room
            </Link>
            <Link
              href={isAdminLoggedIn ? "/admin" : "/admin/login"}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all duration-300 shadow-lg shadow-violet-600/20 active:scale-[0.98]"
            >
              <span>{isAdminLoggedIn ? "Admin Suite" : "Recruiter Portal"}</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1: ATTENTION (HERO) */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 flex flex-col items-center justify-center text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6 backdrop-blur-md shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span>Deterministic Technical Assessment Engine</span>
        </motion.div>

        {/* Hero Title with OG Handwriting Font Preserved */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12] max-w-5xl"
        >
          Autonomous Technical Interviews.
          <br />
          Evaluate software engineers with{" "}
          <HandwritingText
            words={["adaptive voice.", "objective rubrics.", "deterministic scoring.", "instant reports."]}
            className="text-violet-400 font-normal"
            height="1.08em"
          />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed"
        >
          Conlatus conducts live technical audio screenings using Groq Whisper Large v3
          transcription, context-aware adaptive follow-ups, and auditable rubric scoring.
        </motion.p>

        {/* Double-Bezel Nested Quick Access Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-lg"
        >
          {/* Double-Bezel Input Card */}
          <div className="w-full sm:flex-1 rounded-[1.75rem] p-1.5 bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <form
              onSubmit={handleQuickCodeSubmit}
              className="w-full flex items-center rounded-[calc(1.75rem-0.375rem)] bg-black/60 p-1.5 focus-within:ring-1 focus-within:ring-violet-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all"
            >
              <input
                type="text"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                placeholder="Enter access key (e.g. DEMO)..."
                className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={!quickCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <button
            onClick={() => router.push("/interview")}
            className="w-full sm:w-auto px-5 py-4 rounded-[1.5rem] border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] backdrop-blur-md"
          >
            <Play className="w-3.5 h-3.5 text-violet-400" />
            <span>Launch Candidate Room</span>
          </button>
        </motion.div>

        {/* Real-time Hardware Telemetry Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-zinc-400"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>&lt; 220ms Audio Latency</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <ShieldCheck className="w-3 h-3 text-violet-400" />
            <span>Zero Recruiter Bias</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>OpenAI GPT-OSS-120B Engine</span>
          </div>
        </motion.div>
      </main>

      {/* SECTION 2: INTEREST (GAPLESS BENTO GRID) */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 sm:py-28 border-t border-white/5">
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400 block mb-2">
            System Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Engineered for deterministic evaluation
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Replace chaotic, uncalibrated technical calls with mathematical consistency and verbatim telemetry.
          </p>
        </div>

        {/* Bento Grid with mathematical interlocking (12 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 grid-flow-dense">
          {/* Card 1: Audio Engine (col-span-7) */}
          <div className="md:col-span-7 rounded-[2rem] p-1.5 bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-500">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    LIVE SPEECH-TO-SPEECH
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Fluid Conversational Probing
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Conlatus listens in real-time using Groq Whisper Large v3. It detects pauses, clarifies vague architectural explanations, and challenges hand-waving logic dynamically.
                </p>
              </div>

              {/* Simulated Audio Waveform Bar */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-6 rounded-full bg-violet-500 animate-pulse" />
                  <span className="w-1.5 h-10 rounded-full bg-indigo-500 animate-pulse delay-75" />
                  <span className="w-1.5 h-4 rounded-full bg-violet-400 animate-pulse delay-150" />
                  <span className="w-1.5 h-8 rounded-full bg-indigo-400 animate-pulse delay-100" />
                  <span className="w-1.5 h-5 rounded-full bg-violet-600 animate-pulse delay-200" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Groq Whisper Latency: 172ms</span>
              </div>
            </div>
          </div>

          {/* Card 2: Deterministic Rubrics (col-span-5) */}
          <div className="md:col-span-5 rounded-[2rem] p-1.5 bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-500">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    RUBRICS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Deterministic Scoring
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Every answer is evaluated against strict, predefined engineering rubrics. Eliminates recruiter bias, bad moods, and inconsistent interview standards.
                </p>
              </div>

              {/* Rubric Progress Snapshot */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">System Design</span>
                  <span className="text-emerald-400 font-semibold">96 / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="w-[96%] h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Autonomous Curriculum (col-span-5) */}
          <div className="md:col-span-5 rounded-[2rem] p-1.5 bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-500">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    SUB-3S SYNTHESIS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Generative Question Sets
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Questions are generated dynamically based on role seniority, tech stack, and experience. Zero question leaks across cohorts.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                <span>Tailored to Senior Go / Distributed Systems</span>
              </div>
            </div>
          </div>

          {/* Card 4: Auditable Verbatim Reports (col-span-7) */}
          <div className="md:col-span-7 rounded-[2rem] p-1.5 bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-500">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                    VERBATIM TELEMETRY
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Evidence-Backed Candidate Dossiers
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Recruiters receive a multi-dimensional scorecard with exact candidate voice quotes, identified blindspots, code-level assessments, and override capabilities.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Audit Trail
                </span>
                <span className="text-zinc-600">|</span>
                <span>Direct Recruiter PDF/JSON Export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ACTION (RECRUITER CTA) */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="rounded-[2.5rem] p-2 bg-gradient-to-b from-violet-500/20 via-white/5 to-transparent border border-violet-500/30 shadow-2xl backdrop-blur-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-zinc-950/90 p-8 sm:p-14 text-center flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-3">
              Deploy in your hiring stack
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
              Ready to automate your engineering screening?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              Configure tailored rubrics, launch candidate sessions with one-click links, and review verified evaluations.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/admin/login"
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-violet-600/30 transition-all duration-300 active:scale-[0.98]"
              >
                <span>Access Recruiter Suite</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
              <Link
                href="/interview"
                className="px-6 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-all"
              >
                Try Candidate Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Minimalist Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-black/40">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center">
              <img src="/favicon.ico" alt="Conlatus" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-sm font-semibold text-white">Conlatus AI Labs</span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500 font-mono">Autonomous Technical Screening</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <Link href="/interview" className="hover:text-white transition-colors">
              Candidate Room
            </Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Recruiter Suite
            </Link>
            <span className="text-zinc-600">© 2026 Conlatus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
