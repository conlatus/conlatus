"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  Funnel,
  Copy,
  Check,
  ArrowSquareOut,
  ArrowsClockwise,
  Eye,
  Plus,
  ChatCircleText,
} from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import ReportModal from "@/components/admin/ReportModal";
import {
  fetchCandidates,
  fetchCandidateDetail,
  retriggerCandidateReport,
  CandidateListItem,
  CandidateDetailResponse,
} from "@/lib/api";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retriggeringId, setRetriggeringId] = useState<string | null>(null);

  // Quick report modal preview state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loadingModalId, setLoadingModalId] = useState<string | null>(null);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCandidates(searchTerm, statusFilter);
      setCandidates(data);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleCopyLink = (token: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/interview/${id}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCandidateInviteText = (cand: CandidateListItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/interview/${cand.id}`;
    return `Hi ${cand.candidate_name || "Candidate"},

You are invited to an AI Technical Interview for the position of ${cand.role_title} at ${cand.company_name}.

🔑 Access Code: ${cand.id}
🔗 Direct Link: ${fullLink}

Click the link above to start your interview, or visit ${origin}/interview and enter your access code.
Please have your camera and microphone enabled.

Best of luck!
— ${cand.company_name} Hiring Team`;
  };

  const handlePreviewReport = async (id: string) => {
    setLoadingModalId(id);
    try {
      const details = await fetchCandidateDetail(id);
      setSelectedCandidate(details);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      alert("Failed to load report scorecard.");
    } finally {
      setLoadingModalId(null);
    }
  };

  const handleRetrigger = async (id: string) => {
    if (!confirm("Re-trigger assessment report synthesis for this candidate?")) return;
    setRetriggeringId(id);
    try {
      await retriggerCandidateReport(id);
      alert("Report synthesis re-triggered successfully!");
      await loadCandidates();
    } catch (err) {
      console.error("Failed to retrigger report:", err);
      alert("Failed to re-trigger report.");
    } finally {
      setRetriggeringId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/95">
            Candidate Pipeline & Evaluations
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Track interview sessions, verify AI scores, review transcripts, and record hiring verdicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>New Candidate Invite</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SpecularContainer
        radius={18}
        tintOpacity={0.01}
        className="glass-panel border border-white/10"
        contentClassName="p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search candidate, role, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5 self-stretch sm:self-auto overflow-x-auto">
          {[
            { key: "all", label: "All Sessions" },
            { key: "completed", label: "Completed" },
            { key: "in-progress", label: "In Progress" },
            { key: "pending", label: "Pending" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-white/10 text-white shadow"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </SpecularContainer>

      {/* Candidate Table */}
      <SpecularContainer
        radius={24}
        tintOpacity={0.01}
        className="glass-panel border border-white/10 overflow-hidden"
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-white/50">
                <th className="py-3.5 px-5">Candidate</th>
                <th className="py-3.5 px-4">Role & Organization</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">AI Assessment</th>
                <th className="py-3.5 px-4">Recruiter Verdict</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 animate-pulse">
                    Loading candidates database...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    No candidates found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => {
                  const isCompleted = cand.status === "completed";
                  const score = cand.overall_score || 0;
                  const isHire = score >= 3.0;

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Candidate Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-semibold text-white/80 shrink-0">
                            {cand.candidate_name ? cand.candidate_name[0].toUpperCase() : "C"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white/95 truncate">
                              {cand.candidate_name}
                            </p>
                            <p className="text-[11px] text-white/40 truncate">
                              {cand.candidate_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Org */}
                      <td className="py-4 px-4">
                        <p className="text-white/80 font-medium truncate">{cand.role_title}</p>
                        <p className="text-[11px] text-white/40 truncate">{cand.company_name}</p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            cand.status === "completed"
                              ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                              : cand.status === "in-progress"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                              : "bg-white/10 text-white/60 border border-white/10"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cand.status === "completed"
                                ? "bg-violet-400"
                                : cand.status === "in-progress"
                                ? "bg-amber-400"
                                : "bg-white/40"
                            }`}
                          />
                          {cand.status}
                        </span>
                      </td>

                      {/* AI Assessment Score */}
                      <td className="py-4 px-4">
                        {isCompleted && cand.overall_score !== null ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                                isHire
                                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {cand.overall_score.toFixed(1)} / 5.0
                            </span>
                            <p className="text-[10px] text-white/40 capitalize">
                              {cand.recommendation || "Assessed"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-white/30 italic">
                            {cand.status === "in-progress" ? "In interview..." : "Awaiting start"}
                          </span>
                        )}
                      </td>

                      {/* Recruiter Verdict */}
                      <td className="py-4 px-4">
                        {cand.human_decision ? (
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize border ${
                              cand.human_decision === "hired"
                                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                                : cand.human_decision === "next_round"
                                ? "bg-teal-500/10 text-teal-300 border-teal-500/30"
                                : cand.human_decision === "rejected"
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {cand.human_decision.replace("_", " ")}
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[11px] text-amber-400/80 font-medium">
                            Pending Review
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/20">—</span>
                        )}
                      </td>

                      {/* Action Menu */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Report Modal Button */}
                          {isCompleted && (
                            <button
                              onClick={() => handlePreviewReport(cand.id)}
                              disabled={loadingModalId === cand.id}
                              className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                              title="Quick Scorecard Preview"
                            >
                              <Eye size={15} />
                            </button>
                          )}

                          {/* Full Report Page Link */}
                          {isCompleted ? (
                            <Link
                              href={`/admin/candidates/${cand.id}`}
                              className="p-2 rounded-xl text-white/60 hover:text-violet-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                              title="View Full In-depth Report & Transcript"
                            >
                              <ArrowSquareOut size={15} />
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/candidates/${cand.id}`}
                              className="p-2 rounded-xl text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                              title="View Session Details"
                            >
                              <ChatCircleText size={15} />
                            </Link>
                          )}

                          {/* Copy Candidate Link */}
                          <button
                            onClick={() => handleCopyLink(cand.token, String(cand.id))}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              copiedId === String(cand.id)
                                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                            }`}
                            title="Copy Direct Interview Link"
                          >
                            {copiedId === String(cand.id) ? <Check size={15} /> : <Copy size={15} />}
                          </button>

                          {/* Share via WhatsApp */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getCandidateInviteText(cand))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-[#25D366] hover:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-colors cursor-pointer"
                            title="Share Invitation via WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                          </a>

                          {/* Re-trigger Assessment */}
                          {isCompleted && (
                            <button
                              onClick={() => handleRetrigger(cand.id)}
                              disabled={retriggeringId === cand.id}
                              className="p-2 rounded-xl text-white/40 hover:text-amber-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                              title="Re-trigger Report Synthesis"
                            >
                              <ArrowsClockwise
                                size={15}
                                className={retriggeringId === cand.id ? "animate-spin" : ""}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SpecularContainer>

      {/* Report Modal */}
      <ReportModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDecisionUpdated={() => {
          loadCandidates();
        }}
      />
    </div>
  );
}
