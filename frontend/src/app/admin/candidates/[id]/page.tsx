"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Warning,
  Quotes,
  Play,
  Pause,
  SpeakerHigh,
  User,
  Robot,
  FloppyDisk,
  Check,
  CalendarBlank,
  Buildings,
  ShieldCheck,
} from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import RadarChart from "@/components/admin/RadarChart";
import {
  fetchCandidateDetail,
  submitCandidateDecision,
  CandidateDetailResponse,
} from "@/lib/api";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recruiter Decision Form State
  const [decision, setDecision] = useState<string>("next_round");
  const [notes, setNotes] = useState<string>("");
  const [isSavingDecision, setIsSavingDecision] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Audio Playback Simulation State
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCandidateDetail(id);
        setCandidate(data);
        if (data.human_decision) setDecision(data.human_decision);
        if (data.human_notes) setNotes(data.human_notes);
      } catch (err: any) {
        console.error("Failed to load candidate details:", err);
        setError(err.message || "Failed to load candidate assessment.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSaveDecision = async () => {
    if (!id) return;
    setIsSavingDecision(true);
    try {
      await submitCandidateDecision(id, decision, notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to submit decision:", err);
      alert("Failed to record recruiter verdict.");
    } finally {
      setIsSavingDecision(false);
    }
  };

  const togglePlayAudio = (turnId: string) => {
    if (playingTurnId === turnId) {
      setPlayingTurnId(null);
    } else {
      setPlayingTurnId(turnId);
      // Auto-stop simulation after 4 seconds
      setTimeout(() => {
        setPlayingTurnId((prev) => (prev === turnId ? null : prev));
      }, 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white/40 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-xs">Loading comprehensive candidate scorecard & transcript...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error || "Candidate assessment not found."}
        </div>
        <Link href="/admin/candidates">
          <button className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            ← Back to Candidate Tracker
          </button>
        </Link>
      </div>
    );
  }

  const score = candidate.overall_score || 0;
  const isPass = score >= 3.0;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-24 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/candidates"
          className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Candidate Pipeline</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border ${
              candidate.status === "completed"
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                : candidate.status === "in-progress"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                : "bg-white/10 text-white/60 border border-white/10"
            }`}
          >
            {candidate.status}
          </span>
        </div>
      </div>

      {/* Candidate Profile Hero Card */}
      <SpecularContainer
        radius={24}
        tintOpacity={0.02}
        className="glass-panel border border-white/10"
        contentClassName="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-800/40 border border-violet-500/30 flex items-center justify-center text-2xl font-bold text-violet-300 shrink-0 shadow-lg">
            {candidate.candidate_name ? candidate.candidate_name[0].toUpperCase() : "C"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {candidate.candidate_name}
              </h1>
              {candidate.overall_score !== null && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    isPass
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {candidate.overall_score.toFixed(1)} / 5.0 • {candidate.recommendation || "Assessed"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-white/50 mt-2">
              <span className="flex items-center gap-1.5 text-white/70 font-medium">
                <Buildings size={14} className="text-violet-400" />
                {candidate.role_title} @ {candidate.company_name}
              </span>
              <span>•</span>
              <span>{candidate.candidate_email}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarBlank size={14} />
                {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : "Recent"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Verdict Badge */}
        {candidate.human_decision && (
          <div className="p-3 px-4 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 text-right">
            <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider block">
              Recorded Verdict
            </span>
            <span className="text-sm font-semibold capitalize text-violet-300">
              {candidate.human_decision.replace("_", " ")}
            </span>
          </div>
        )}
      </SpecularContainer>

      {/* Grid: Assessment Summary & Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Executive Summary, Strengths, Growth Areas */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Executive Summary */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 space-y-3"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <ShieldCheck size={16} className="text-violet-400" />
              Executive Assessment Synthesis
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              {candidate.summary || "Holistic post-interview synthesis not yet compiled."}
            </p>

            {candidate.synthesis_details?.communication && (
              <div className="pt-3 border-t border-white/5 text-xs text-white/60">
                <span className="font-semibold text-white/80 mr-1.5">Communication Quality:</span>
                {candidate.synthesis_details.communication}
              </div>
            )}
          </SpecularContainer>

          {/* Verified Strengths with Quotes */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.01}
            className="glass-panel border border-violet-500/20 bg-violet-950/[0.04]"
            contentClassName="p-6 space-y-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <CheckCircle size={16} />
              Demonstrated Strengths & Verbatim Quotes
            </h2>

            {candidate.synthesis_details?.strengths && candidate.synthesis_details.strengths.length > 0 ? (
              <div className="space-y-3">
                {candidate.synthesis_details.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black/40 border border-violet-500/20 text-xs text-white/90 leading-relaxed flex items-start gap-3"
                  >
                    <Quotes size={18} className="text-violet-400 shrink-0 mt-0.5" />
                    <p className="flex-1">{str}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">No specific strength quotes logged.</p>
            )}
          </SpecularContainer>

          {/* Growth Areas & Flags */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.01}
            className="glass-panel border border-amber-500/20 bg-amber-950/[0.04]"
            contentClassName="p-6 space-y-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Warning size={16} />
              Identified Growth Areas & Caveats
            </h2>

            {candidate.synthesis_details?.growth_areas && candidate.synthesis_details.growth_areas.length > 0 ? (
              <div className="space-y-3">
                {candidate.synthesis_details.growth_areas.map((ga, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-white/90 leading-relaxed flex items-start gap-3"
                  >
                    <Quotes size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="flex-1">{ga}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">No significant caveats flagged.</p>
            )}
          </SpecularContainer>
        </div>

        {/* Right 5 Cols: Radar Geometry & Recruiter Verdict */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Radar Chart Card */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 flex flex-col items-center justify-center"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4 w-full text-left">
              Competency Radar Visualizer
            </h2>
            <RadarChart
              data={candidate.rubric_breakdown || {}}
              size={290}
              benchmarkScore={3.0}
            />

            {/* Criteria mini list */}
            {candidate.rubric_breakdown && (
              <div className="w-full mt-6 space-y-2.5 pt-4 border-t border-white/5">
                {Object.entries(candidate.rubric_breakdown).map(([key, item]) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{label}</span>
                      <span className="font-mono font-semibold text-violet-400">
                        {item.score.toFixed(1)} / 5.0
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SpecularContainer>

          {/* Recruiter Decision Box */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.02}
            className="glass-panel border border-white/15"
            contentClassName="p-6 space-y-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Submit Recruiter Decision
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "hired", label: "Hire / Offer", color: "border-violet-500 text-violet-300 bg-violet-500/15" },
                { val: "next_round", label: "Next Round", color: "border-teal-500 text-teal-300 bg-teal-500/15" },
                { val: "under_review", label: "Under Review", color: "border-amber-500 text-amber-300 bg-amber-500/15" },
                { val: "rejected", label: "Reject", color: "border-rose-500 text-rose-300 bg-rose-500/15" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDecision(opt.val)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                    decision === opt.val
                      ? `${opt.color} shadow-[0_0_12px_rgba(139,92,246,0.25)]`
                      : "border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/60 mb-1.5 block">
                Decision Notes & Leveling Rationale:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter debrief notes for hiring committee..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {saveSuccess && (
                <span className="text-xs font-medium text-violet-400 flex items-center gap-1">
                  <Check size={14} />
                  Decision updated!
                </span>
              )}
              <div className="ml-auto">
                <button
                  onClick={handleSaveDecision}
                  disabled={isSavingDecision}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <FloppyDisk size={14} />
                  <span>{isSavingDecision ? "Saving..." : "Save Verdict"}</span>
                </button>
              </div>
            </div>
          </SpecularContainer>
        </div>
      </div>

      {/* Verified Full Interview Transcript Player */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white/95">
              Verified Dialogue Transcript
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Turn-by-turn synchronized exchange between Conlatus AI Interviewer and Candidate.
            </p>
          </div>
          <span className="text-xs font-mono text-white/40">
            {candidate.transcripts ? `${candidate.transcripts.length} dialogue turns` : "0 turns"}
          </span>
        </div>

        <SpecularContainer
          radius={24}
          tintOpacity={0.01}
          className="glass-panel border border-white/10"
          contentClassName="p-6 md:p-8 space-y-6"
        >
          {candidate.transcripts && candidate.transcripts.length > 0 ? (
            candidate.transcripts.map((turn, index) => {
              const isInterviewer = turn.speaker === "interviewer";
              const isPlaying = playingTurnId === turn.id;

              return (
                <div
                  key={turn.id || index}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ${
                    isInterviewer
                      ? "bg-white/[0.02] border border-white/5"
                      : isPlaying
                      ? "bg-violet-950/20 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "bg-black/30 border border-white/10"
                  }`}
                >
                  {/* Speaker Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold border ${
                      isInterviewer
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                        : "bg-violet-500/20 border-violet-500/30 text-violet-300"
                    }`}
                  >
                    {isInterviewer ? <Robot size={18} /> : <User size={18} />}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white/90 capitalize">
                          {isInterviewer ? "Conlatus AI Interviewer" : candidate.candidate_name}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Turn ${index + 1}`}
                        </span>
                      </div>

                      {/* Turn Playback Button */}
                      <button
                        onClick={() => togglePlayAudio(turn.id)}
                        className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] cursor-pointer ${
                          isPlaying
                            ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                            : "text-white/40 hover:text-white bg-white/5 border-white/5"
                        }`}
                        title="Simulate speech audio turn"
                      >
                        {isPlaying ? (
                          <>
                            <Pause size={12} weight="fill" />
                            <span className="text-[10px] font-mono">Playing...</span>
                          </>
                        ) : (
                          <>
                            <SpeakerHigh size={12} />
                            <span className="text-[10px]">Play</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                      {turn.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-white/40">
              No transcript turns logged for this session.
            </div>
          )}
        </SpecularContainer>
      </div>
    </div>
  );
}
