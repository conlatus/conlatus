"use client";

import React, { useState } from "react";
import { X, CheckCircle, Warning, Quotes, ArrowSquareOut, FloppyDisk } from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import RadarChart from "./RadarChart";
import { CandidateDetailResponse, submitCandidateDecision } from "@/lib/api";
import Link from "next/link";

interface ReportModalProps {
  candidate: CandidateDetailResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onDecisionUpdated?: (decision: string, notes: string) => void;
}

export default function ReportModal({
  candidate,
  isOpen,
  onClose,
  onDecisionUpdated,
}: ReportModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "competencies" | "decision">("summary");
  const [decision, setDecision] = useState<string>(candidate?.human_decision || "next_round");
  const [notes, setNotes] = useState<string>(candidate?.human_notes || "");
  const [isSavingDecision, setIsSavingDecision] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when candidate changes
  React.useEffect(() => {
    if (candidate) {
      setDecision(candidate.human_decision || "next_round");
      setNotes(candidate.human_notes || "");
      setSaveSuccess(false);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleSaveDecision = async () => {
    setIsSavingDecision(true);
    try {
      await submitCandidateDecision(candidate.id, decision, notes);
      setSaveSuccess(true);
      if (onDecisionUpdated) {
        onDecisionUpdated(decision, notes);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save decision:", err);
      alert("Failed to save recruiter decision. Please try again.");
    } finally {
      setIsSavingDecision(false);
    }
  };

  const score = candidate.overall_score || 0;
  const isPass = score >= 3.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <SpecularContainer
          radius={24}
          tintOpacity={0.02}
          className="glass-panel border border-white/15 shadow-2xl flex flex-col overflow-hidden"
          contentClassName="flex flex-col max-h-[90vh] p-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-700/30 border border-emerald-500/30 flex items-center justify-center text-lg font-bold text-emerald-300 shrink-0">
                {candidate.candidate_name ? candidate.candidate_name[0].toUpperCase() : "C"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white tracking-tight">
                    {candidate.candidate_name}
                  </h2>
                  {candidate.overall_score !== null && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isPass
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {candidate.overall_score.toFixed(1)} / 5.0 • {candidate.recommendation || "Assessed"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1">
                  {candidate.role_title} • {candidate.company_name} • {candidate.candidate_email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/candidates/${candidate.id}`}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Open in full detailed view"
              >
                <span>Full Report</span>
                <ArrowSquareOut size={16} />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-black/20 text-xs">
            <button
              onClick={() => setActiveTab("summary")}
              className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
                activeTab === "summary"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Executive Summary & Quotes
            </button>
            <button
              onClick={() => setActiveTab("competencies")}
              className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
                activeTab === "competencies"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Radar & Rubric Breakdown
            </button>
            <button
              onClick={() => setActiveTab("decision")}
              className={`pb-3 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "decision"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Recruiter Decision
              {candidate.human_decision && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "summary" && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Executive Summary
                  </h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {candidate.summary || "No executive summary generated yet."}
                  </p>
                </div>

                {/* Key Strengths with Quotes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    Verified Strengths & Quote Evidence
                  </h3>
                  {candidate.synthesis_details?.strengths && candidate.synthesis_details.strengths.length > 0 ? (
                    <div className="space-y-2.5">
                      {candidate.synthesis_details.strengths.map((st, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-white/90 leading-relaxed flex items-start gap-2.5"
                        >
                          <Quotes size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="flex-1">{st}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">No specific strengths recorded.</p>
                  )}
                </div>

                {/* Growth Areas & Gaps */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Warning size={15} />
                    Areas for Growth & Red Flags
                  </h3>
                  {candidate.synthesis_details?.growth_areas && candidate.synthesis_details.growth_areas.length > 0 ? (
                    <div className="space-y-2.5">
                      {candidate.synthesis_details.growth_areas.map((ga, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-white/90 leading-relaxed flex items-start gap-2.5"
                        >
                          <Quotes size={18} className="text-amber-400 shrink-0 mt-0.5" />
                          <span className="flex-1">{ga}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">No red flags or growth areas detected.</p>
                  )}
                </div>

                {/* Communication */}
                {candidate.synthesis_details?.communication && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
                    <span className="font-semibold text-white/90 mr-1.5">Communication Analysis:</span>
                    {candidate.synthesis_details.communication}
                  </div>
                )}
              </div>
            )}

            {activeTab === "competencies" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/30 border border-white/5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                    Competency Geometry
                  </h3>
                  <RadarChart
                    data={candidate.rubric_breakdown || {}}
                    size={270}
                    benchmarkScore={3.0}
                  />
                </div>

                {/* Detailed Criteria Bars */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Criteria Breakdown
                  </h3>
                  {candidate.rubric_breakdown && Object.keys(candidate.rubric_breakdown).length > 0 ? (
                    Object.entries(candidate.rubric_breakdown).map(([k, crit]) => {
                      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      const critScore = crit.score;
                      const percentage = (critScore / 5) * 100;
                      return (
                        <div key={k} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-white/80">{label}</span>
                            <span className="font-mono font-semibold text-emerald-400">
                              {critScore.toFixed(1)} / 5.0
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {crit.evidence_count !== undefined && (
                            <p className="text-[10px] text-white/40">
                              Based on {crit.evidence_count} verified transcript signals
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-white/40 italic">No criteria breakdown available.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "decision" && (
              <div className="max-w-xl mx-auto space-y-5 py-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/70 mb-2 block">
                    Recruiter Verdict
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: "hired", label: "Hire / Offer", color: "border-emerald-500 text-emerald-300 bg-emerald-500/10" },
                      { val: "next_round", label: "Next Round", color: "border-teal-500 text-teal-300 bg-teal-500/10" },
                      { val: "under_review", label: "Under Review", color: "border-amber-500 text-amber-300 bg-amber-500/10" },
                      { val: "rejected", label: "Reject", color: "border-rose-500 text-rose-300 bg-rose-500/10" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setDecision(opt.val)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                          decision === opt.val
                            ? `${opt.color} shadow-[0_0_12px_rgba(16,185,129,0.2)]`
                            : "border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/70 mb-1.5 block">
                    Hiring Manager Notes & Rationale
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter interview takeaway notes, level recommendations, or debrief feedback..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saveSuccess && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Verdict saved successfully!
                    </span>
                  )}
                  <div className="ml-auto">
                    <SpecularButton
                      size="sm"
                      radius={12}
                      tint="#10b981"
                      onClick={handleSaveDecision}
                    >
                      <FloppyDisk size={15} className="mr-1.5" />
                      {isSavingDecision ? "Saving..." : "Record Decision"}
                    </SpecularButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 px-6 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-white/40">
            <span>Interview Session ID: {candidate.id.slice(0, 8)}...</span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              >
                Close
              </button>
              <Link
                href={`/admin/candidates/${candidate.id}`}
                className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-medium flex items-center gap-1.5"
              >
                <span>Deep Dive Transcript</span>
                <ArrowSquareOut size={13} />
              </Link>
            </div>
          </div>
        </SpecularContainer>
      </div>
    </div>
  );
}
