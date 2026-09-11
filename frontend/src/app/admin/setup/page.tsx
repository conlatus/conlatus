"use client";

import { useState } from "react";
import SpecularContainer from "@/components/SpecularContainer";
import SpecularButton from "@/components/SpecularButton";
import { AdminInput, AdminTextarea, TagInput } from "@/components/ui/AdminForms";
import { handleAuthError } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SetupInterviewPage() {
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [duration, setDuration] = useState("30");
  const [jobDescription, setJobDescription] = useState("");
  const [rubricTags, setRubricTags] = useState<string[]>(["React", "System Design"]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  
  // New State for Autonomous Generation
  const [mode, setMode] = useState<"manual" | "autonomous">("manual");
  const [seniorityLevel, setSeniorityLevel] = useState("Mid");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("admin_token") || localStorage.getItem("access_token");
    if (stored) return stored;
    const match = document.cookie.match(new RegExp("(^| )(admin_token|auth_token)=([^;]+)"));
    return match ? match[3] : "";
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          role_title: roleTitle || "Software Engineer",
          topics: rubricTags,
          seniority_level: seniorityLevel,
          job_description: jobDescription
        }),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Failed to synthesize questions (${response.status})`);
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions || []);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to synthesize questions. Check console or make sure backend is running.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          role_title: roleTitle || "Untitled Role",
          company_name: companyName || "Unknown Company",
          duration_minutes: parseInt(duration) || 30,
          job_description: jobDescription,
          rubric_tags: rubricTags,
          custom_questions: customQuestions,
          generated_questions: mode === "autonomous" && generatedQuestions.length > 0 ? generatedQuestions : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate link");
      }

      const data = await response.json();
      const code = data.interview_id;
      const link = `${window.location.origin}/interview/${code}`;
      setGeneratedCode(code);
      setGeneratedLink(link);
    } catch (error) {
      console.error(error);
      alert("Failed to generate interview link. Make sure the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getInvitationText = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `Hi Candidate,

You are invited to an AI Technical Interview for the position of ${roleTitle || "Software Engineer"} at ${companyName || "Conlatus"}.

⏱ Duration: ${duration || "30"} Minutes
🔑 Access Code: ${generatedCode}
🔗 Direct Link: ${generatedLink}

To begin your interview:
1. Click the direct link above, or go to ${origin}/interview and enter your access code.
2. Ensure your camera and microphone are connected and permitted in your browser.
3. Be ready to answer questions and discuss technical trade-offs.

Best of luck!
— ${companyName || "Conlatus"} Hiring Team`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleUpdateGeneratedQuestion = (index: number, newText: string) => {
    const updated = [...generatedQuestions];
    updated[index].text = newText;
    setGeneratedQuestions(updated);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">
            Setup New Interview
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Configure the AI persona, job description, and evaluation rubric.
          </p>
        </div>
        <SpecularButton
          size="sm"
          radius={999}
          tint="#10b981"
          tintOpacity={0.15}
          textColor="#6ee7b7"
          lineColor="#34d399"
          baseColor="#064e3b"
          intensity={1.2}
          onClick={handleGenerateLink}
        >
          {isGenerating ? "Generating..." : "Generate Link"}
        </SpecularButton>
      </header>

      {generatedLink && (
        <SpecularContainer
          radius={20}
          tintOpacity={0.06}
          className="mb-6 border border-emerald-500/30 glass-panel shadow-2xl"
          contentClassName="p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <p className="text-sm text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Interview Created & Ready to Share!
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Share this direct URL or candidate code via WhatsApp, Email, or Slack.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">Code:</span>
              <code className="text-xs bg-black/60 px-2.5 py-1 rounded text-emerald-300 font-mono border border-white/10">
                {generatedCode}
              </code>
              <button
                onClick={() => handleCopy(generatedCode || "", "code")}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-1"
              >
                {copiedType === "code" ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <span className="text-xs text-white/40 font-mono">Link:</span>
              <span className="text-xs text-emerald-300 font-mono truncate select-all">
                {generatedLink}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SpecularButton
                size="sm"
                radius={8}
                onClick={() => handleCopy(generatedLink, "link")}
              >
                {copiedType === "link" ? "Copied Link!" : "Copy Link"}
              </SpecularButton>
            </div>
          </div>

          {/* Sharing Actions Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* WhatsApp Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-semibold transition-all shadow-sm group"
            >
              <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Share Invite via WhatsApp</span>
            </a>

            {/* Zoom-Style Invitation Text Copy */}
            <button
              type="button"
              onClick={() => handleCopy(getInvitationText(), "invitation")}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-all shadow-sm"
            >
              <span>{copiedType === "invitation" ? "✓ Invitation Copied!" : "📋 Copy Full Invitation (Zoom Style)"}</span>
            </button>
          </div>
        </SpecularContainer>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-4 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "manual" ? "bg-white/10 text-white shadow" : "text-white/50 hover:text-white/80"
          }`}
        >
          Manual Setup
        </button>
        <button
          onClick={() => setMode("autonomous")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            mode === "autonomous" ? "bg-emerald-500/20 text-emerald-300 shadow border border-emerald-500/30" : "text-white/50 hover:text-white/80"
          }`}
        >
          AI Autonomous Synthesis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SpecularContainer radius={24} tintOpacity={0.01} className="glass-panel" contentClassName="p-6 md:p-8 flex flex-col gap-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-2">
              Role Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Job Title"
                placeholder="e.g. Frontend Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
              <AdminInput
                label="Company Name"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Interview Duration (Minutes)"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              
              {mode === "autonomous" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70 pl-1">Seniority Level</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Staff">Staff / Principal</option>
                  </select>
                </div>
              )}
            </div>
          </SpecularContainer>

          <SpecularContainer radius={24} tintOpacity={0.01} className="glass-panel h-full" contentClassName="p-6 md:p-8 flex flex-col gap-6 h-full">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-2">
              Job Description
            </h2>
            <AdminTextarea
              label="Paste Full JD"
              placeholder="The AI will use this to generate relevant technical and behavioral questions..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </SpecularContainer>

          {/* Autonomous Questions Preview */}
          {mode === "autonomous" && (
            <SpecularContainer radius={24} tintOpacity={0.01} className="glass-panel" contentClassName="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                  Synthesized Curriculum
                </h2>
                <SpecularButton
                  size="sm"
                  radius={8}
                  tint="#10b981"
                  onClick={handleSynthesize}
                >
                  {isSynthesizing ? "Synthesizing..." : "✨ Synthesize Questions"}
                </SpecularButton>
              </div>

              {generatedQuestions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-white/40 text-sm">
                  Click 'Synthesize Questions' to let the AI generate a tailored curriculum based on the topics and JD.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {generatedQuestions.map((q, index) => (
                    <div key={q.id || index} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                          {q.competency_tag}
                        </span>
                        <span className="text-xs text-white/40">Diff: {q.difficulty}/5</span>
                      </div>
                      <textarea
                        className="w-full bg-transparent border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-y"
                        rows={3}
                        value={q.text}
                        onChange={(e) => handleUpdateGeneratedQuestion(index, e.target.value)}
                      />
                      <div className="text-xs text-white/50 flex gap-2">
                        <span className="font-semibold text-white/70">Signals:</span> {q.expected_signals}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SpecularContainer>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">
          <SpecularContainer radius={24} tintOpacity={0.01} className="glass-panel" contentClassName="p-6 md:p-8 flex flex-col gap-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-2">
              {mode === "autonomous" ? "Focus Topics" : "Evaluation Rubric"}
            </h2>
            <p className="text-xs text-white/40 leading-relaxed mb-[-12px]">
              {mode === "autonomous" 
                ? "What technical areas should the AI focus on when synthesizing questions?" 
                : "Add skills/criteria for evaluation."}
            </p>
            <TagInput
              label={mode === "autonomous" ? "Topics" : "Skills & Criteria"}
              placeholder="Type & press enter..."
              tags={rubricTags}
              setTags={setRubricTags}
            />
          </SpecularContainer>

          {mode === "manual" && (
            <SpecularContainer radius={24} tintOpacity={0.01} className="glass-panel flex-1" contentClassName="p-6 md:p-8 flex flex-col gap-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-2">
                Custom Questions
              </h2>
              <p className="text-xs text-white/40 leading-relaxed">
                Add specific questions the AI must ask during the interview. (Press Enter to add)
              </p>
              <TagInput
                label="Mandatory Questions"
                placeholder="e.g. Why do you want to work here?"
                tags={customQuestions}
                setTags={setCustomQuestions}
              />
            </SpecularContainer>
          )}
        </div>
      </div>
    </div>
  );
}
