"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  FileText,
  Briefcase,
  Globe,
  Trash2,
  TrendingUp,
  ExternalLink,
  Loader2,
  Lock,
  ChevronRight,
  TrendingDown,
  Check,
  ChevronDown,
  Github,
  Linkedin,
  GraduationCap,
  Sparkles,
  ScanSearch,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface CandidateDetailModalProps {
  candidate: any;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
  onDelete?: () => void;
  onUpdate?: (updatedCandidate: any) => void;
}

export function CandidateDetailModal({
  candidate,
  onClose,
  onStatusChange,
  onDelete,
  onUpdate,
}: CandidateDetailModalProps) {
  const [currentCandidate, setCurrentCandidate] = useState(candidate);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStage, setActiveStage] = useState<"resume" | "assessment" | "interview">("resume");

  useEffect(() => {
    setCurrentCandidate(candidate);
  }, [candidate]);

  useEffect(() => {
    if (!currentCandidate?.id) return;

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;

    const checkStatus = async () => {
      let needsPolling = false;
      try {
        const parsed =
          typeof currentCandidate.parsed_json === "string"
            ? JSON.parse(currentCandidate.parsed_json)
            : currentCandidate.parsed_json || {};
        
        // 1. Check Resume Evaluation Status
        if (!parsed.verdict && !parsed.summary && currentCandidate.match_score === 0) {
          needsPolling = true;
        }

        // 2. Check Assessment status
        if (currentCandidate.assessment_status === "ACTIVE") {
          needsPolling = true;
        }

        // 3. Check if report is missing on completion
        if (currentCandidate.assessment_status === "COMPLETED" && !currentCandidate.assessment_report) {
          needsPolling = true;
        }

        // 4. Fallback: if in screening stage but assessment data is null, fetch once
        if (currentCandidate.status === "screening" && !currentCandidate.assessment_status) {
          needsPolling = true;
        }
      } catch {
        needsPolling = true;
      }

      if (needsPolling && isMounted) {
        setIsAnalyzing(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${currentCandidate.id}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok && isMounted) {
            const data = await res.json();
            
            // Check if anything meaningful changed
            const hasResumeReport = (typeof data.parsed_json === 'string' ? JSON.parse(data.parsed_json) : data.parsed_json)?.verdict;
            const hasAssessmentReport = data.assessment_report;
            const statusChanged = data.assessment_status !== currentCandidate.assessment_status;
            
            if (hasResumeReport || hasAssessmentReport || statusChanged || data.match_score !== currentCandidate.match_score || data.status !== currentCandidate.status) {
              setCurrentCandidate(data);
              // Only stop analyzing if everything we care about for the current stage is done
              if (activeStage === 'resume' && hasResumeReport) setIsAnalyzing(false);
              if (activeStage === 'assessment' && hasAssessmentReport) setIsAnalyzing(false);
            }

            // Continue polling if still lacking critical stage data
            pollTimeout = setTimeout(checkStatus, 3000);
          } else if (isMounted) {
            pollTimeout = setTimeout(checkStatus, 5000);
          }
        } catch (e: any) {
          if (isMounted) {
            pollTimeout = setTimeout(checkStatus, 5000);
          }
        }
      } else if (isMounted) {
        // Even if no polling needed, we might want to refresh once more to be sure
        setIsAnalyzing(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      clearTimeout(pollTimeout);
    };
  }, [
    currentCandidate?.id, 
    currentCandidate?.parsed_json, 
    currentCandidate?.match_score, 
    currentCandidate?.assessment_status, 
    currentCandidate?.assessment_report,
    activeStage
  ]);

  const statusMap: Record<string, string> = {
    "new": "Unvetted",
    "screening": "Assessment",
    "interview": "Technical Interview",
    "offered": "Offered",
    "rejected": "Rejected"
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${currentCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentCandidate(data);
        if (onUpdate) onUpdate(data);
        // Pass the full updated candidate to the parent to prevent double-fetching
        onStatusChange(data);
      }
    } catch (e) {
      console.error("Status update error", e);
    }
  };


  if (!currentCandidate) return null;

  // Parse structured data if available
  let parsedData: any = {};
  try {
    parsedData =
      typeof currentCandidate.parsed_json === "string"
        ? JSON.parse(currentCandidate.parsed_json)
        : currentCandidate.parsed_json || {};
  } catch (e) {
    console.error("Failed to parse candidate JSON:", e);
  }

  const safeParse = (data: any) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Parse error", e);
      return null;
    }
  };

  const isAssessmentLocked = currentCandidate.status === "new";
  const isInterviewLocked = currentCandidate.status === "new" || currentCandidate.status === "screening";
  
  const assessmentReport = safeParse(currentCandidate.assessment_report);
  const assessmentVerdict = currentCandidate.assessment_verdict?.toUpperCase() || "";
  const resumeVerdict = parsedData.verdict?.toUpperCase() || "";

  const isNegative = (v: string) => ["REJECT", "NO_HIRE", "TERMINATE", "FAIL", "NOT_RECOMMENDED"].includes(v);
  const isPositive = (v: string) => ["ACCEPT", "HIRE", "STRONG_HIRE", "PROCEED"].includes(v);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#050505] border border-white/10 w-full max-w-6xl max-h-[95vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

        {/* === HEADER: HIGH-DENSITY PROFILE HERO === */}
        <div className="p-8 pb-6 border-b border-white/5 bg-gradient-to-b from-brand-accent/20 via-black/40 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-bg/50 flex items-center justify-center text-3xl font-bold text-brand-accent shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-brand-accent/20 transition-transform hover:scale-105 duration-300">
                {currentCandidate.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-display font-bold text-white tracking-tight">{currentCandidate.full_name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${currentCandidate.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    currentCandidate.status === 'offered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
                    }`}>
                    {currentCandidate.status}
                  </span>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-[0.2em] text-brand-success animate-pulse">
                      <Loader2 size={10} className="animate-spin" /> Analyzing
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm flex items-center gap-2 mb-3">
                  <Briefcase size={14} className="text-brand-accent" /> {currentCandidate.headline || "Talent Profile"}
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Mail size={12} className="text-brand-accent/60" /> {currentCandidate.email}
                  </div>
                  {currentCandidate.phone && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Phone size={12} className="text-brand-accent/60" /> {currentCandidate.phone}
                    </div>
                  )}
                  {parsedData.social_links?.length > 0 && (
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                      {parsedData.social_links.map((link: string, i: number) => {
                        const isLinkedIn = link.toLowerCase().includes("linkedin");
                        const isGitHub = link.toLowerCase().includes("github");
                        return (
                          <a
                            key={i}
                            href={link.startsWith("http") ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-brand-accent transition-all transform hover:scale-110"
                            title={isLinkedIn ? "LinkedIn" : isGitHub ? "GitHub" : "Personal Link"}
                          >
                            {isLinkedIn ? <Linkedin size={14} /> : isGitHub ? <Github size={14} /> : <Globe size={14} />}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${currentCandidate.id}/resume`, "_blank")} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all" title="View CV">
                  <FileText size={18} />
                </button>
                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${currentCandidate.id}/report`, "_blank")} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-brand-accent transition-all" title="Download Report">
                  <ExternalLink size={18} />
                </button>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button onClick={onDelete} className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all border border-white/10">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 transition-all border border-white/10">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* JOURNEY STEPPER NAVIGATION */}
          <div className="flex items-center p-1.5 bg-white/5 border border-white/10 rounded-2xl gap-2 mt-4 relative">
            <button
              onClick={() => setActiveStage("resume")}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${activeStage === "resume" ? "bg-brand-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <FileText size={14} className="mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Resume Evaluation</span>
            </button>

            <div className="flex items-center text-slate-700">
              <ChevronRight size={14} />
            </div>

            <button
              onClick={() => !isAssessmentLocked && setActiveStage("assessment")}
              disabled={isAssessmentLocked}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all relative ${activeStage === "assessment" ? "bg-brand-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" :
                isAssessmentLocked ? "text-slate-700 cursor-not-allowed opacity-40" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <TrendingUp size={14} className="mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Tech Assessment</span>
              {isAssessmentLocked && <Lock size={10} className="absolute top-2 right-2 opacity-50" />}
            </button>

            <div className="flex items-center text-slate-700">
              <ChevronRight size={14} />
            </div>

            <button
              onClick={() => !isInterviewLocked && setActiveStage("interview")}
              disabled={isInterviewLocked}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all relative ${activeStage === "interview" ? "bg-brand-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" :
                isInterviewLocked ? "text-slate-700 cursor-not-allowed opacity-40" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <Calendar size={14} className="mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Technical Interview</span>
              {isInterviewLocked && <Lock size={10} className="absolute top-2 right-2 opacity-50" />}
            </button>
          </div>
        </div>

        {/* === MAIN CONTENT AREA === */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] pb-48">

          {/* STAGE 1: RESUME ANALYSIS VIEW */}
          {activeStage === "resume" && (
            <div className="max-w-5xl mx-auto p-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Executive Rationale */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-brand-accent" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Professional Rationale</h3>
                  <div className="flex-1 h-px bg-white/5 ml-4" />
                </div>
                <div className="bg-brand-surface border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-brand-accent/20 transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                  {/* AI RATIONALE CARD */}
                  <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-3xl p-8 mb-12 relative overflow-hidden group hover:bg-brand-accent/10 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                      <Sparkles size={60} className="text-brand-accent" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-brand-accent/20 rounded-lg">
                        <ScanSearch size={18} className="text-brand-accent" />
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent">Executive AI Rationale</h3>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed font-display italic">
                      "{parsedData.rationale || parsedData.summary || "Synthesizing deep candidate insights..."}"
                    </p>
                  </div>
                </div>
              </section>

              {/* Competency Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  {/* Experience */}
                  <section>
                    <div className="flex items-center gap-2 mb-8">
                      <Briefcase size={16} className="text-brand-accent" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Career Trajectory</h3>
                    </div>
                    <div className="space-y-8 pl-4 border-l border-white/5">
                      {parsedData.experience?.map((exp: any, idx: number) => (
                        <div key={idx} className="relative pl-8 transition-all hover:translate-x-1 duration-300">
                          <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-brand-accent border-2 border-black" />
                          <h4 className="text-white font-bold text-base leading-none mb-2">{exp.job_title}</h4>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-brand-accent text-xs font-semibold">{exp.company}</span>
                            <span className="text-slate-600 font-bold">•</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{exp.duration}</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed font-light line-clamp-3 overflow-hidden">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Notable Projects */}
                  {parsedData.projects?.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-8">
                        <Globe size={16} className="text-brand-accent" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Notable Projects</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsedData.projects.map((project: any, idx: number) => (
                          <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-brand-accent/20 transition-all">
                            <h4 className="text-white font-bold text-sm mb-2">{project.title}</h4>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{project.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies?.map((tech: string, tidx: number) => (
                                <span key={tidx} className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 rounded text-[8px] text-brand-accent uppercase font-bold tracking-widest">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="space-y-12">
                  {/* Skills */}
                  <section>
                    <div className="flex items-center gap-2 mb-8">
                      <CheckCircle2 size={16} className="text-brand-accent" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Core Tech Stack</h3>
                    </div>
                    <div className="space-y-4">
                      {parsedData.scored_skills?.slice(0, 8).map((item: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                          <div className="flex justify-between items-baseline mb-2 text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">{item.skill}</span>
                            <span className="text-brand-accent font-bold">{item.score}/5</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-accent shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-1000"
                              style={{ width: `${(Number(item.score) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Education */}
                  {parsedData.education?.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-8">
                        <GraduationCap size={16} className="text-brand-accent" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Academic Background</h3>
                      </div>
                      <div className="space-y-4">
                        {parsedData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <h4 className="text-white font-bold text-sm mb-1">{edu.degree}</h4>
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                              <span className="text-brand-accent/80">{edu.institution}</span>
                              <span className="text-slate-500">{edu.year}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Alignment Matrix */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <Check size={16} className="text-brand-accent" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Requirement Alignment Matrix</h3>
                  <div className="flex-1 h-px bg-white/5 ml-4" />
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.03] text-slate-500 font-bold uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Role Requirement</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5">Candidate Qualifications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedData.comparison_matrix?.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6 w-1/3 text-white font-medium group-hover:text-brand-accent transition-colors">{row.requirement}</td>
                          <td className="px-8 py-6 text-center">
                            <span className={`inline-flex px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-widest ${row.alignment === 'Met' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              row.alignment === 'Partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                              {row.alignment}
                            </span>
                          </td>
                          <td className="px-8 py-6 w-1/2 text-slate-400 italic">"{row.candidate_qualification}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* STAGE 2: TECHNICAL ASSESSMENT VIEW */}
          {activeStage === "assessment" && (
            <div className="max-w-5xl mx-auto p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* DEBUG BADGE - REMOVE AFTER VERIFICATION */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[8px] font-mono text-slate-500 w-fit mx-auto">
                 <span>STATUS: {currentCandidate.assessment_status || 'NULL'}</span>
                 <span>SCORE: {currentCandidate.assessment_score || 0}</span>
                 <span>REPORT: {currentCandidate.assessment_report ? 'PRESENT' : 'MISSING'}</span>
                 <span>DETAILS: {currentCandidate.assessment_details ? 'PRESENT' : 'MISSING'}</span>
              </div>
              
              {/* === MAIN STATUS CARD === */}
              <div className="bg-brand-surface border border-white/5 rounded-[3rem] p-12 relative overflow-hidden ring-1 ring-white/10">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  
                  {/* Score Visualization */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-accent/20 blur-[50px] rounded-full group-hover:bg-brand-accent/30 transition-all duration-700" />
                    <div className="relative w-48 h-48 rounded-full border-4 border-white/5 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Overall Score</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-display font-black text-white">{currentCandidate.assessment_score !== null && currentCandidate.assessment_score !== undefined ? Math.round(currentCandidate.assessment_score) : "—"}</span>
                        <span className="text-sm font-bold text-brand-accent/60">/100</span>
                      </div>
                      <div className={`mt-3 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        currentCandidate.assessment_verdict === 'STRONG_HIRE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        currentCandidate.assessment_verdict === 'HIRE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        currentCandidate.assessment_verdict === 'NO_HIRE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {currentCandidate.assessment_verdict?.replace('_', ' ') || currentCandidate.assessment_status || "Awaiting Setup"}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-display font-bold text-white mb-4">Smart Assessment Engine</h3>
                    <p className="text-slate-400 max-w-sm mb-10 text-sm leading-relaxed">
                      {currentCandidate.assessment_status === "COMPLETED" 
                        ? "The assessment is complete. Review the dimension breakdown and AI report below."
                        : currentCandidate.magic_link
                        ? "Invitation has been deployed. The assessment engine is monitoring candidate progress live."
                        : "Stage 2: Assessment is ready. Deploy the interview invite to the candidate."
                      }
                    </p>

                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                      {currentCandidate.magic_link && currentCandidate.assessment_status !== "COMPLETED" && (
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                              <code className="text-[10px] text-brand-accent font-mono truncate max-w-[200px]">{currentCandidate.magic_link}</code>
                              <button 
                                onClick={() => navigator.clipboard.writeText(currentCandidate.magic_link)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all border border-white/5"
                              >
                                <Check size={14} />
                              </button>
                           </div>
                           <button onClick={() => window.open(currentCandidate.magic_link, "_blank")} className="p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl text-brand-accent hover:bg-brand-accent/20 transition-all">
                              <ExternalLink size={20} />
                           </button>
                        </div>
                      )}

                      {currentCandidate.assessment_status !== "COMPLETED" && !currentCandidate.magic_link && (
                        <button
                          onClick={() => handleUpdateStatus("screening")}
                          className="px-8 py-4 bg-brand-accent text-white rounded-2xl font-bold hover:brightness-110 shadow-lg shadow-brand-accent/20 transition-all border border-white/10 flex items-center gap-2"
                        >
                          <TrendingUp size={16} /> DEPLOY CODING CHALLENGE
                        </button>
                      )}

                      {currentCandidate.assessment_status === "COMPLETED" && (
                        <button 
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${currentCandidate.id}/assessment-report`, "_blank")}
                          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-lg shadow-emerald-900/20"
                        >
                          <FileText size={18} /> DOWNLOAD FULL PDF REPORT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* === PERFORMANCE BREAKDOWN === */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dimension Scores */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Dimension Scoring Breakdown</h4>
                    <TrendingUp size={14} className="text-brand-accent/40" />
                  </div>
                  
                  {assessmentReport ? (
                    <div className="space-y-6">
                      {assessmentReport.dimension_scores?.map((ds: any, idx: number) => (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <span className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{ds.dimension}</span>
                              <p className="text-[10px] text-slate-500 mt-0.5 max-w-md">{ds.rationale}</p>
                            </div>
                            <span className="text-sm font-mono font-bold text-brand-accent">{ds.score}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                ds.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                ds.score >= 50 ? 'bg-brand-accent shadow-[0_0_10px_rgba(139,92,246,0.3)]' :
                                'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              }`}
                              style={{ width: `${ds.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-2xl">
                       <Loader2 size={24} className="text-white/10 animate-spin mb-4" />
                       <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Awaiting candidate submission</p>
                    </div>
                  )}
                </div>

                {/* Verdict Justification */}
                <div className="bg-brand-accent/5 border border-brand-accent/10 rounded-3xl p-8 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={16} className="text-brand-accent" />
                    <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">AI Verdict Justification</h4>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300 leading-relaxed font-display italic">
                      "{assessmentReport ? assessmentReport.verdict_justification : "The AI engine will generate a holistic performance justification once the candidate completes all topics in their personalized syllabus."}"
                    </p>
                  </div>
                  {(assessmentReport || currentCandidate.assessment_status === "COMPLETED") && (
                    <div className="mt-8 pt-6 border-t border-brand-accent/10 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Session Status</span>
                      <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest">VERIFIED BY CRITIQUE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* === SYLLABUS LOG === */}
              {currentCandidate.assessment_details && currentCandidate.assessment_details.length > 0 && (
                 <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Personalized Syllabus Evaluation Log</h4>
                       <span className="text-[10px] text-brand-accent/60 font-mono tracking-widest">{currentCandidate.assessment_details.length} TOPICS</span>
                    </div>
                    <table className="w-full text-left text-[11px]">
                       <thead>
                          <tr className="text-slate-500 uppercase tracking-widest border-b border-white/5">
                             <th className="pb-4 font-bold">Topic Name</th>
                             <th className="pb-4 font-bold">Modality</th>
                             <th className="pb-4 font-bold">Residency</th>
                             <th className="pb-4 font-bold text-right">Raw Score</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {currentCandidate.assessment_details.map((item: any, i: number) => (
                                <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                                   <td className="py-4">
                                      <div className="flex flex-col">
                                         <span className="text-white font-medium group-hover:text-brand-accent transition-colors">{item.topic}</span>
                                         <span className="text-[9px] text-slate-600 uppercase tracking-tighter">AI Scenario Generated</span>
                                      </div>
                                   </td>
                                   <td className="py-4">
                                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                         {item.modality || "TEXT"}
                                      </span>
                                   </td>
                                   <td className="py-4 text-slate-400 italic text-[10px]">Candidate Resume</td>
                                   <td className="py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-accent/50" style={{ width: `${(item.score || 0) * 10}%` }} />
                                         </div>
                                         <span className={`font-mono font-bold ${item.score >= 7 ? 'text-emerald-400' : item.score >= 4 ? 'text-brand-accent' : 'text-rose-400'}`}>
                                            {item.score || 0}/10
                                         </span>
                                      </div>
                                   </td>
                                </tr>
                             )
                          )}
                       </tbody>
                    </table>
                 </div>
              )}
            </div>
          )}

          {/* STAGE 3: TECHNICAL INTERVIEW VIEW */}
          {activeStage === "interview" && (
            <div className="max-w-5xl mx-auto p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 hover:border-brand-accent/20 transition-all">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-brand-accent/10 rounded-2xl text-brand-accent ring-1 ring-brand-accent/20">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Interview Command</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Stakeholder Coordination</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateStatus("interview")}
                    className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                  >
                    <Calendar size={16} /> Schedule Tech Round
                  </button>

                  <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-600">Primary Interviewer</span>
                      <span className="text-slate-400">Not Assigned</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-600">Location</span>
                      <span className="text-slate-400">Virtual (Teams/Zoom)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 opacity-30 grayscale blur-[1px]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-brand-accent/10 rounded-2xl text-brand-accent">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">AI Performance Scorecard</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Behavioral & Tech Synthesis</p>
                    </div>
                  </div>
                  <div className="p-12 border border-dashed border-white/10 rounded-[2rem] text-center italic text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] leading-loose">
                    Awaiting Interview completion<br />to generate AI scorecard
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* === JOURNEY ACTION CENTER: FLOATING FOOTER === */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
            <div className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-brand-accent/40 rounded-[2.5rem] p-5 pr-8 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transform-gpu hover:scale-[1.01] transition-transform duration-500">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1.5">Candidate Lifecycle</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-brand-accent rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">{statusMap[currentCandidate.status] || currentCandidate.status}</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-brand-accent uppercase tracking-[0.2em] mb-1.5">Intelligence Verdict</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isPositive = (v: any) => v === 'STRONG_HIRE' || v === 'HIRE' || v === 'ACCEPT';
                      const isNegative = (v: any) => v === 'NO_HIRE' || v === 'REJECT';
                      const assessmentVerdict = currentCandidate.assessment_verdict;
                      const activeVerdict = assessmentVerdict || (parsedData ? parsedData.verdict : null);
                      
                      if (isPositive(activeVerdict)) {
                        return (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                            <CheckCircle2 size={12} /> RECOMMENDED: PROCEED
                          </span>
                        );
                      } else if (isNegative(activeVerdict)) {
                        return (
                          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-2 uppercase tracking-widest">
                            <XCircle size={12} /> NOT RECOMMENDED: TERMINATE
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-2 uppercase tracking-widest">
                            <AlertTriangle size={12} /> CAUTION: FURTHER VETTING
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Manual Stage Override</span>
                  <div className="relative">
                    <select
                      value={currentCandidate.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="appearance-none bg-white/[0.03] border border-white/10 rounded-2xl pl-5 pr-10 py-3.5 text-[10px] font-bold text-slate-300 outline-none hover:bg-white/[0.07] hover:border-brand-accent/30 transition-all uppercase tracking-widest cursor-pointer"
                    >
                      <option value="new">Phase: Unvetted</option>
                      <option value="screening">Phase: Assessment</option>
                      <option value="interview">Phase: Technical Interview</option>
                      <option value="offered">Decision: Extend Offer</option>
                      <option value="rejected">Decision: Terminate Pipeline</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Automated Suggestion Button */}
                {currentCandidate.status === 'new' && isPositive(resumeVerdict) && (
                  <button
                    onClick={() => handleUpdateStatus("screening")}
                    className="px-8 py-4 bg-brand-accent text-white rounded-[1.2rem] text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2 border border-white/10"
                  >
                    <CheckCircle2 size={14} /> Confirm & Promote
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
