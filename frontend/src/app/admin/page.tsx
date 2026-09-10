"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Star,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Sparkle,
  WarningCircle,
  Info,
  Lightning,
  Eye,
} from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import MetricsCard from "@/components/admin/MetricsCard";
import ReportModal from "@/components/admin/ReportModal";
import {
  fetchAdminOverview,
  fetchCandidateDetail,
  AdminOverviewResponse,
  CandidateListItem,
  CandidateDetailResponse,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick report preview modal state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loadingCandidateId, setLoadingCandidateId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAdminOverview();
        setOverview(data);
      } catch (err: any) {
        if (err.message && (err.message.includes("Unauthorized") || err.message.includes("401"))) {
          return;
        }
        console.error("Failed to load overview data:", err);
        setError(err.message || "Failed to connect to backend service");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePreviewReport = async (candidateId: string) => {
    setLoadingCandidateId(candidateId);
    try {
      const details = await fetchCandidateDetail(candidateId);
      setSelectedCandidate(details);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      alert("Failed to load candidate report details.");
    } finally {
      setLoadingCandidateId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Autonomous Assessment Core
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95 mt-1">
            Talent Acquisition Command
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            {user?.full_name ? `Welcome back, ${user.full_name}.` : "Welcome back."} Real-time candidate evaluation telemetry and scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/candidates">
            <button className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              Candidate Tracker
            </button>
          </Link>
          <Link href="/admin/setup">
            <SpecularButton
              size="sm"
              radius={999}
              tint="#10b981"
              tintOpacity={0.15}
              textColor="#6ee7b7"
              lineColor="#34d399"
              baseColor="#064e3b"
              intensity={1.2}
            >
              <Plus size={14} weight="bold" className="mr-1.5" />
              Create Interview
            </SpecularButton>
          </Link>
        </div>
      </header>

      {/* Error Banner if backend fails */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="shrink-0 text-rose-400" />
            <span>{error}. Please ensure the backend server is running on port 8000.</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="underline hover:text-rose-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Interviews"
          value={overview?.total_interviews || 0}
          subtitle="All sessions orchestrated"
          trend="+18% this month"
          trendDirection="up"
          icon={<Users size={18} className="text-emerald-400" />}
          accentColor="#10b981"
        />
        <MetricsCard
          title="Average Assessment"
          value={overview?.average_score || 0}
          decimals={1}
          suffix=" / 5.0"
          subtitle="Rubric threshold 3.0"
          trend="+0.3 vs benchmark"
          trendDirection="up"
          icon={<Star size={18} className="text-amber-400" />}
          accentColor="#f59e0b"
        />
        <MetricsCard
          title="Completion Rate"
          value={
            overview && overview.total_interviews > 0
              ? Math.round((overview.completed_interviews / overview.total_interviews) * 100)
              : 0
          }
          suffix="%"
          subtitle={`${overview?.completed_interviews || 0} completed interviews`}
          trend={`${overview?.pass_rate || 0}% pass rate`}
          trendDirection="up"
          icon={<CheckCircle size={18} className="text-teal-400" />}
          accentColor="#14b8a6"
        />
        <MetricsCard
          title="Active Sessions"
          value={overview?.in_progress_interviews || 0}
          subtitle={`${overview?.pending_interviews || 0} pending links`}
          trend="Real-time"
          trendDirection="neutral"
          icon={<Clock size={18} className="text-indigo-400" />}
          accentColor="#6366f1"
        />
      </div>

      {/* Main Grid: Activity Feed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Candidate Stream */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Recent Candidate Assessments
            </h2>
            <Link
              href="/admin/candidates"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View all candidates</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <SpecularContainer
            radius={24}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-0 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-12 text-center text-xs text-white/40 animate-pulse">
                Loading candidate evaluations...
              </div>
            ) : overview && overview.recent_candidates.length > 0 ? (
              <div className="divide-y divide-white/5">
                {overview.recent_candidates.map((cand) => {
                  const isCompleted = cand.status === "completed";
                  const scoreVal = cand.overall_score || 0;
                  const isHire = scoreVal >= 3.0;

                  return (
                    <div
                      key={cand.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Candidate Avatar & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-semibold text-white/80 shrink-0">
                          {cand.candidate_name ? cand.candidate_name[0].toUpperCase() : "C"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white/90 truncate">
                              {cand.candidate_name}
                            </p>
                            {/* Status badge */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                cand.status === "completed"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : cand.status === "in-progress"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20 animate-pulse"
                                  : "bg-white/10 text-white/50 border border-white/10"
                              }`}
                            >
                              {cand.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 truncate">
                            {cand.role_title} • {cand.candidate_email}
                          </p>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isCompleted && cand.overall_score !== null ? (
                          <div className="text-right">
                            <span
                              className={`text-xs font-mono font-semibold px-2 py-1 rounded-lg ${
                                isHire
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {cand.overall_score.toFixed(1)} / 5.0
                            </span>
                            <p className="text-[10px] text-white/40 mt-1 capitalize">
                              {cand.recommendation || "Assessed"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-white/30 italic">
                            {cand.status === "in-progress" ? "Evaluating..." : "Pending invite"}
                          </span>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => handlePreviewReport(cand.id)}
                            disabled={loadingCandidateId === cand.id}
                            className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                            title="Quick Scorecard Preview"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-white/40">
                No candidate assessments found. Launch a new interview to begin telemetry!
              </div>
            )}
          </SpecularContainer>
        </div>

        {/* Right 1 Col: Intelligence Alerts & System Health */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Telemetry Alerts & Actions
          </h2>

          {/* Alerts Stack */}
          <div className="space-y-3">
            {overview?.alerts && overview.alerts.length > 0 ? (
              overview.alerts.map((alert) => (
                <SpecularContainer
                  key={alert.id}
                  radius={16}
                  tintOpacity={0.01}
                  className={`border glass-panel transition-all ${
                    alert.type === "warning"
                      ? "border-amber-500/25 bg-amber-950/10"
                      : alert.type === "success"
                      ? "border-emerald-500/25 bg-emerald-950/10"
                      : "border-white/10 bg-white/[0.01]"
                  }`}
                  contentClassName="p-4 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      {alert.type === "warning" && (
                        <WarningCircle size={15} className="text-amber-400" />
                      )}
                      {alert.type === "success" && (
                        <Sparkle size={15} className="text-emerald-400" />
                      )}
                      {alert.type === "info" && (
                        <Info size={15} className="text-indigo-400" />
                      )}
                      <span className="text-white/90">{alert.title}</span>
                    </div>
                    <span className="text-[10px] text-white/40">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {alert.message}
                  </p>
                </SpecularContainer>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/40 text-center">
                All systems nominal. No pending alerts.
              </div>
            )}
          </div>

          {/* Quick Launch Card */}
          <SpecularContainer
            radius={20}
            tintOpacity={0.02}
            className="border border-white/10 glass-panel mt-2"
            contentClassName="p-5 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lightning size={16} weight="fill" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                  AI Synthesis Engine
                </h3>
                <p className="text-[10px] text-white/40">Groq Whisper v3 + OpenAI GPT-OSS-120B Active</p>
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Every candidate interview utilizes deterministic Pass-1 turn evaluation and holistic Pass-2 multi-criteria report synthesis.
            </p>

            <Link href="/admin/settings" className="w-full">
              <button className="w-full py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-center">
                Configure Model & Rubric Thresholds →
              </button>
            </Link>
          </SpecularContainer>
        </div>
      </div>

      {/* Scorecard Quick Preview Modal */}
      <ReportModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDecisionUpdated={() => {
          // Re-fetch overview data so recent candidates reflect decision
          fetchAdminOverview().then(setOverview).catch(console.error);
        }}
      />
    </div>
  );
}
