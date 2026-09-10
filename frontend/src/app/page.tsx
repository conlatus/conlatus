"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { HandwritingText } from "@/components/ui/handwriting-text";

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
      {/* Background Precision Atmosphere */}
      <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-violet-600/10 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-8%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[15%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Subtle Precision Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Floating Island Navigation Header */}
      <header className="sticky top-4 z-50 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-2">
        <div className="rounded-full border border-white/10 bg-black/65 backdrop-blur-2xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-black/80">
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

      {/* Hero Section — Centered as the primary focal point */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 sm:py-28 flex-1 flex flex-col items-center justify-center text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span>Deterministic Technical Assessment Engine</span>
        </motion.div>

        {/* Hero Title with Handwriting Animation */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] max-w-4xl"
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

        {/* Quick Access Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-lg"
        >
          <form
            onSubmit={handleQuickCodeSubmit}
            className="flex-1 w-full flex items-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-1.5 shadow-2xl focus-within:border-violet-500/50 transition-all"
          >
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder="Enter interview access key (e.g. DEMO)..."
              className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={() => router.push("/interview")}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-violet-400" />
            <span>Launch Candidate Room</span>
          </button>
        </motion.div>
      </main>

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
