"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Key,
  Sliders,
  Buildings,
  Bell,
  CheckCircle,
  FloppyDisk,
  Warning,
  Sparkle,
  ShieldCheck,
} from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import {
  fetchAdminSettings,
  updateAdminSettings,
  AdminSettingsPayload,
} from "@/lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsPayload>({
    model_provider: "groq",
    model_name: "openai/gpt-oss-120b",
    default_duration: 30,
    rubric_threshold: 3.0,
    company_name: "Conlatus AI Labs",
    company_logo: "",
    recruiter_email: "recruiter@conlatus.ai",
    email_notifications: true,
    alert_on_finish: true,
    groq_api_key_configured: true,
    anthropic_api_key_configured: false,
    openai_api_key_configured: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"models" | "keys" | "rubric" | "branding" | "notifications">("models");

  // API Key inputs (local state for editing)
  const [groqKey, setGroqKey] = useState<string>("••••••••••••••••••••••••••••••");
  const [anthropicKey, setAnthropicKey] = useState<string>("");
  const [openaiKey, setOpenaiKey] = useState<string>("");

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await fetchAdminSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateAdminSettings({
        ...settings,
        groq_api_key_configured: groqKey.length > 10,
        anthropic_api_key_configured: anthropicKey.length > 10 || settings.anthropic_api_key_configured,
        openai_api_key_configured: openaiKey.length > 10 || settings.openai_api_key_configured,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save configuration settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
            Admin & Organization Settings
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Configure LLM inference models, API credentials, evaluation thresholds, and notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-violet-400 flex items-center gap-1">
              <CheckCircle size={15} />
              Saved successfully!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <FloppyDisk size={14} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs">
        {[
          { key: "models", label: "Model Selection", icon: Cpu },
          { key: "keys", label: "API Credentials", icon: Key },
          { key: "rubric", label: "Evaluation & Duration", icon: Sliders },
          { key: "branding", label: "Company Profile", icon: Buildings },
          { key: "notifications", label: "Notifications & Alerts", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* TAB 1: Model Selection */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <SpecularContainer
              radius={24}
              tintOpacity={0.01}
              className="glass-panel border border-white/10"
              contentClassName="p-6 md:p-8 space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
                  <Cpu size={18} className="text-violet-400" />
                  Primary LLM Inference Provider
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  Choose the active model provider for real-time turn probe decisions and post-interview report synthesis.
                </p>
              </div>

              {/* Provider Radio Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "groq",
                    name: "Groq LPU (GPT-OSS-120B)",
                    model: "openai/gpt-oss-120b",
                    latency: "~450ms",
                    badge: "Recommended",
                    desc: "Flagship 120B reasoning model on Groq LPUs for real-time audio turns and synthesis.",
                  },
                  {
                    id: "anthropic",
                    name: "Anthropic Claude",
                    model: "claude-3-5-sonnet-latest",
                    latency: "~1200ms",
                    badge: "High Reasoning",
                    desc: "Deep cognitive synthesis for complex system design and code reasoning.",
                  },
                  {
                    id: "openai",
                    name: "OpenAI GPT-4o",
                    model: "gpt-4o",
                    latency: "~950ms",
                    badge: "Standard",
                    desc: "Balanced multi-modal intelligence for broad candidate assessment.",
                  },
                ].map((prov) => {
                  const isSelected = settings.model_provider === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          model_provider: prov.id,
                          model_name: prov.model,
                        })
                      }
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-violet-950/20 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "bg-white/10 text-white/50"
                            }`}
                          >
                            {prov.badge}
                          </span>
                          <span className="text-[10px] font-mono text-white/40">{prov.latency}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white/90">{prov.name}</h3>
                        <p className="text-xs text-white/50 leading-relaxed">{prov.desc}</p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/60">
                        <span>Model:</span>
                        <span className="text-violet-400 font-semibold">{prov.model}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Model Settings */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white/80">Active Model Identifier</span>
                  <input
                    type="text"
                    value={settings.model_name}
                    onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                    className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-violet-300 font-mono w-64 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </SpecularContainer>
          </div>
        )}

        {/* TAB 2: API Credentials */}
        {activeTab === "keys" && (
          <SpecularContainer
            radius={24}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Key size={18} className="text-violet-400" />
                Inference API Keys
              </h2>
              <p className="text-xs text-white/40 mt-1">
                API keys are stored securely on the backend server and never exposed in client payloads.
              </p>
            </div>

            <div className="space-y-4">
              {/* Groq Key */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                    Groq API Key (GROQ_API_KEY)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Active
                    </span>
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">Powers Whisper v3 & OpenAI GPT-OSS-120B</span>
                </div>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              {/* Anthropic Key */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                    Anthropic API Key (ANTHROPIC_API_KEY)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/40 border border-white/10">
                      Optional
                    </span>
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">Powers Claude 3.5 Sonnet</span>
                </div>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              {/* OpenAI Key */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                    OpenAI API Key (OPENAI_API_KEY)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/40 border border-white/10">
                      Optional
                    </span>
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">Powers GPT-4o</span>
                </div>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
            </div>
          </SpecularContainer>
        )}

        {/* TAB 3: Evaluation & Duration */}
        {activeTab === "rubric" && (
          <SpecularContainer
            radius={24}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Sliders size={18} className="text-violet-400" />
                Assessment Criteria & Durations
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Configure defaults applied to newly synthesized interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration Slider */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90">
                    Default Duration (Minutes)
                  </label>
                  <span className="text-xs font-mono font-bold text-violet-400">
                    {settings.default_duration} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={settings.default_duration}
                  onChange={(e) =>
                    setSettings({ ...settings, default_duration: parseInt(e.target.value) })
                  }
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[11px] text-white/40">
                  Target candidate session time. Dialogue engine paces turn transitions dynamically.
                </p>
              </div>

              {/* Passing Threshold Slider */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90">
                    Passing Verdict Benchmark
                  </label>
                  <span className="text-xs font-mono font-bold text-violet-400">
                    {settings.rubric_threshold.toFixed(1)} / 5.0
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.5"
                  step="0.1"
                  value={settings.rubric_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, rubric_threshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[11px] text-white/40">
                  Minimum composite score required to trigger an automatic "Hire" recommendation.
                </p>
              </div>
            </div>
          </SpecularContainer>
        )}

        {/* TAB 4: Company Profile */}
        {activeTab === "branding" && (
          <SpecularContainer
            radius={24}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Buildings size={18} className="text-violet-400" />
                Organization Branding & Profile
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Candidate-facing branding displayed on the interview interface and scorecard headers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Company / Workspace Name</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Acme Labs"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Primary Recruiter Email</label>
                <input
                  type="email"
                  value={settings.recruiter_email || ""}
                  onChange={(e) => setSettings({ ...settings, recruiter_email: e.target.value })}
                  placeholder="talent@company.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
            </div>
          </SpecularContainer>
        )}

        {/* TAB 5: Notifications & Alerts */}
        {activeTab === "notifications" && (
          <SpecularContainer
            radius={24}
            tintOpacity={0.01}
            className="glass-panel border border-white/10"
            contentClassName="p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Bell size={18} className="text-violet-400" />
                Notification & Alert Telemetry
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Control how and when your recruiting team receives interview updates.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <h3 className="text-xs font-semibold text-white/90">Email Summary on Completion</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Automatically dispatch evaluation scorecard and executive summary to the hiring team.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) =>
                    setSettings({ ...settings, email_notifications: e.target.checked })
                  }
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <h3 className="text-xs font-semibold text-white/90">High-Performer Priority Alerts</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Trigger an immediate dashboard notification when a candidate scores above 4.2 / 5.0.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.alert_on_finish}
                  onChange={(e) =>
                    setSettings({ ...settings, alert_on_finish: e.target.checked })
                  }
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                />
              </div>
            </div>
          </SpecularContainer>
        )}
      </div>
    </div>
  );
}
