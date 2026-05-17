"use client";

import { useState, use, useEffect } from "react";
import {
    MoreVertical,
    MessageSquare,
    Calendar,
    User,
    Search,
    Plus,
    Loader2,
    Link as LinkIcon,
    ExternalLink,
    LayoutList,
    Trello,
    ArrowUpDown,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronDown,
    Check,
    X
} from "lucide-react";
import { CandidateDetailModal } from "@/components/dashboard/CandidateDetailModal";

export default function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
    const unwrappedParams = use(params);
    const jobId = unwrappedParams.jobId;
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [sortConfig, setSortConfig] = useState({ key: 'match_score', direction: 'desc' });
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [verdictFilter, setVerdictFilter] = useState("all");
    const [isBatchUpdating, setIsBatchUpdating] = useState(false);
    const [activeStageModal, setActiveStageModal] = useState<string | null>(null);

    const stages = [
        { id: "new", name: "New Applicants" },
        { id: "screening", name: "Screening" },
        { id: "interview", name: "Technical Interview" },
        { id: "offered", name: "Offered" },
    ];

    // Initial fetch
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}/candidates`);
                if (res.ok) {
                    setCandidates(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch candidates:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, [jobId]);

    // Sequential Poller
    useEffect(() => {
        if (loading) return;

        let isMounted = true;
        let pollTimeout: NodeJS.Timeout;

        const poll = async () => {
            // Only poll if there are pending candidates
            const hasPending = candidates.some(c => {
                if (!c.parsed_json) return true;
                try {
                    const parsed = typeof c.parsed_json === 'string' ? JSON.parse(c.parsed_json) : c.parsed_json;
                    return !parsed.verdict && !parsed.summary;
                } catch { return true; }
            });

            if (hasPending && isMounted) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}/candidates`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok && isMounted) {
                        const data = await res.json();
                        // Only update if data actually changed to prevent render loops
                        if (JSON.stringify(data) !== JSON.stringify(candidates)) {
                            setCandidates(data);
                        }
                    }
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.warn("Pipeline polling timed out (backend busy)");
                    } else {
                        console.error("Polling fetch failed:", err);
                    }
                }
            }

            // Schedule next poll ONLY after this one finished
            if (isMounted) {
                pollTimeout = setTimeout(poll, 5000);
            }
        };

        pollTimeout = setTimeout(poll, 5000);
        return () => {
            isMounted = false;
            clearTimeout(pollTimeout);
        };
    }, [jobId, loading, candidates]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-500" };
        if (score >= 50) return { bg: "bg-yellow-500", text: "text-yellow-500" };
        return { bg: "bg-rose-500", text: "text-rose-500" };
    };

    const hasAnyNegativeVerdict = (c: any) => {
        const negatives = ["REJECT", "NO_HIRE", "TERMINATE", "FAIL", "NOT_RECOMMENDED"];
        
        // 1. Check Assessment Verdict
        if (c.assessment_verdict && negatives.includes(c.assessment_verdict.toUpperCase())) return true;
        
        // 2. Check Resume Analysis Verdict
        try {
            const parsed = typeof c.parsed_json === 'string' ? JSON.parse(c.parsed_json) : (c.parsed_json || {});
            const verdict = parsed.verdict?.toUpperCase();
            if (verdict && negatives.includes(verdict)) return true;
        } catch (e) {}
        
        return false;
    };

    const isPositiveVerdict = (v: string) => {
        const positives = ["ACCEPT", "HIRE", "STRONG_HIRE", "PROCEED"];
        return positives.includes(v?.toUpperCase());
    };

    const isNeutralVerdict = (v: string) => {
        const neutrals = ["BORDERLINE", "REVIEW", "CAUTION"];
        return neutrals.includes(v?.toUpperCase());
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.headline && c.headline.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesVerdict = true;
        if (verdictFilter !== "all") {
            // Check both assessment and resume
            const isNeg = hasAnyNegativeVerdict(c);
            const isPos = isPositiveVerdict(c.assessment_verdict) || isPositiveVerdict(JSON.parse(c.parsed_json || '{}').verdict);
            const isNeu = isNeutralVerdict(c.assessment_verdict) || isNeutralVerdict(JSON.parse(c.parsed_json || '{}').verdict);

            if (verdictFilter === "positive") {
                matchesVerdict = isPos && !isNeg;
            } else if (verdictFilter === "caution") {
                matchesVerdict = isNeu && !isNeg;
            } else if (verdictFilter === "negative") {
                matchesVerdict = isNeg;
            } else if (verdictFilter === "pending") {
                matchesVerdict = !c.assessment_verdict && !JSON.parse(c.parsed_json || '{}').verdict;
            }
        }
        return matchesSearch && matchesVerdict;
    });

    const toggleSelection = (id: string) => {
        setSelectedCandidates(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0) {
            setSelectedCandidates([]);
        } else {
            setSelectedCandidates(filteredCandidates.map(c => c.id));
        }
    };

    const handleBatchStatusUpdate = async (newStatus: string) => {
        if (selectedCandidates.length === 0) return;
        
        if (newStatus === 'rejected') {
            if (!confirm(`Are you sure you want to permanently delete ${selectedCandidates.length} candidates? This cannot be undone.`)) return;
            
            setIsBatchUpdating(true);
            try {
                await Promise.all(selectedCandidates.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${id}`, {
                        method: "DELETE"
                    })
                ));

                setCandidates(prev => prev.filter(c => !selectedCandidates.includes(c.id)));
                setSelectedCandidates([]);
            } catch (err) {
                console.error("Batch delete failed", err);
            } finally {
                setIsBatchUpdating(false);
            }
            return;
        }

        setIsBatchUpdating(true);
        try {
            await Promise.all(selectedCandidates.map(id =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                })
            ));

            setCandidates(prev => prev.map(c => selectedCandidates.includes(c.id) ? { ...c, status: newStatus } : c));
            setSelectedCandidates([]);
        } catch (err) {
            console.error("Batch update failed", err);
        } finally {
            setIsBatchUpdating(false);
        }
    };

    const handleRejectAllNotRecommended = async () => {
        const notRecommended = candidates.filter(c => hasAnyNegativeVerdict(c) || c.status === "rejected");
        
        if (notRecommended.length === 0) return;
        if (!confirm(`Are you sure you want to permanently delete ${notRecommended.length} "Not Recommended" candidates? This cannot be undone.`)) return;

        setIsBatchUpdating(true);
        try {
            await Promise.all(notRecommended.map(c =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${c.id}`, {
                    method: "DELETE"
                })
            ));
            const deletedIds = notRecommended.map(c => c.id);
            setCandidates(prev => prev.filter(c => !deletedIds.includes(c.id)));
        } catch (err) {
            console.error("Batch delete failed", err);
        } finally {
            setIsBatchUpdating(false);
        }
    };

    const notRecommendedCount = candidates.filter(c => hasAnyNegativeVerdict(c) || c.status === "rejected").length;

    const handleStatusChange = async (candidateId: string, updatedCandidateOrStatus: any) => {
        const newStatus = typeof updatedCandidateOrStatus === 'object' ? updatedCandidateOrStatus.status : updatedCandidateOrStatus;
        
        if (newStatus === 'rejected') {
            await handleDeleteCandidate(candidateId);
            return;
        }

        // If the modal already did the PATCH and passed us the full object, just update state
        if (typeof updatedCandidateOrStatus === 'object') {
            setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCandidateOrStatus : c));
            if (selectedCandidate?.id === candidateId) {
                setSelectedCandidate(updatedCandidateOrStatus);
            }
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${candidateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
                if (selectedCandidate?.id === candidateId) {
                    setSelectedCandidate(updated);
                }
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };


    const handleDeleteCandidate = async (candidateId: string) => {
        if (!confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/candidates/${candidateId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setCandidates(prev => prev.filter(c => c.id !== candidateId));
                if (selectedCandidate?.id === candidateId) {
                    setSelectedCandidate(null);
                }
            } else {
                console.error("Failed to delete candidate");
            }
        } catch (err) {
            console.error("Error deleting candidate:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
                <p className="text-slate-500">Loading pipeline candidates...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Pipeline Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-black/40 border border-white/5 p-4 rounded-2xl gap-4">
                    <div className="relative flex-1 max-w-2xl flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search candidates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent transition-all"
                            />
                        </div>

                        <select
                            value={verdictFilter}
                            onChange={(e) => setVerdictFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-accent transition-all whitespace-nowrap"
                        >
                            <option value="all">Any Verdict</option>
                            <option value="positive">Recommended</option>
                            <option value="caution">Caution</option>
                            <option value="negative">Not Recommended</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            value={sortConfig.key}
                            onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-accent transition-all whitespace-nowrap"
                        >
                            <option value="match_score">Sort: Highest Score</option>
                            <option value="newest">Sort: Newest</option>
                        </select>

                        {/* VIEW TOGGLE */}
                        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl flex-shrink-0">
                            <button
                                onClick={() => setViewMode("kanban")}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Board View"
                            >
                                <Trello size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Dossier List"
                            >
                                <LayoutList size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/p/jobs/${jobId}`;
                                navigator.clipboard.writeText(url);
                                alert("Job application link copied to clipboard!");
                            }}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2 group"
                        >
                            <LinkIcon size={16} className="text-brand-accent group-hover:scale-110 transition-transform" /> Copy Job Link
                        </button>
                        <a
                            href={`/p/jobs/${jobId}`}
                            target="_blank"
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <ExternalLink size={16} /> Preview Portal
                        </a>
                        {notRecommendedCount > 0 && (
                            <button
                                onClick={handleRejectAllNotRecommended}
                                disabled={isBatchUpdating}
                                className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                            >
                                <X size={16} /> Batch Reject {notRecommendedCount}
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === "list" && selectedCandidates.length > 0 && (
                    <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full text-xs font-bold">
                                {selectedCandidates.length} Selected
                            </div>
                            <span className="text-sm text-slate-300 font-medium hidden md:inline">Batch Actions:</span>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => handleBatchStatusUpdate('interview')}
                                disabled={isBatchUpdating}
                                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                <Check size={16} /> <span className="hidden md:inline">Proceed to Interview</span><span className="md:hidden">Proceed</span>
                            </button>
                            <button 
                                onClick={() => handleBatchStatusUpdate('rejected')}
                                disabled={isBatchUpdating}
                                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                <X size={16} /> <span className="hidden md:inline">Reject Candidates</span><span className="md:hidden">Reject</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* PIPELINE VIEWS */}
            {viewMode === "kanban" ? (
                <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar flex-1">
                    {stages.map((stage) => {
                        const stageCandidates = filteredCandidates.filter(c => c.status === stage.id);
                        return (
                            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-300">{stage.name}</h3>
                                        <span className="bg-white/10 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {stageCandidates.length}
                                        </span>
                                    </div>
                                    <button className="text-slate-600 hover:text-white transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-3 space-y-3 min-h-[400px] flex flex-col">
                                    <div className="flex-1 space-y-3">
                                        {stageCandidates.slice(0, 3).map(candidate => {
                                        let parsed: any = {};
                                        try {
                                            parsed = typeof candidate.parsed_json === 'string'
                                                ? JSON.parse(candidate.parsed_json)
                                                : (candidate.parsed_json || {});
                                        } catch (e) {
                                            console.error("Failed to parse candidate JSON:", e);
                                        }
                                        const isComplete = !!parsed.verdict && candidate.match_score !== null;

                                        return (
                                            <div
                                                key={candidate.id}
                                                onClick={() => {
                                                    if (isComplete) {
                                                        setSelectedCandidate(candidate);
                                                    }
                                                }}
                                                className={`bg-black/60 border p-4 rounded-xl shadow-lg transition-all group ${isComplete
                                                    ? "border-white/10 hover:border-brand-accent/50 cursor-pointer"
                                                    : "border-amber-500/20 cursor-not-allowed opacity-80"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs">
                                                        {candidate.full_name.charAt(0)}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {isComplete ? (
                                                            candidate.assessment_score !== null && candidate.assessment_score !== undefined ? (
                                                                <div className={`${getScoreColor(candidate.assessment_score).bg.replace('bg-', 'bg-').replace('500', '500/10')} ${getScoreColor(candidate.assessment_score).text} text-[10px] px-2 py-0.5 rounded-md font-bold`}>
                                                                    {Math.round(candidate.assessment_score)}%
                                                                </div>
                                                            ) : (
                                                                <div className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                                                    {Math.round(candidate.match_score)}%
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                                <Loader2 size={10} className="animate-spin" /> Processing
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <h4 className={`font-medium mb-1 transition-colors ${isComplete ? "text-white group-hover:text-brand-accent" : "text-slate-400"}`}>
                                                    {candidate.full_name}
                                                </h4>
                                                <p className="text-slate-500 text-[10px] mb-4 truncate">{candidate.headline || "Deep analysis in progress..."}</p>

                                                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-5 h-5 rounded-full border border-black bg-slate-800 flex items-center justify-center">
                                                            <User size={10} className="text-slate-500" />
                                                        </div>
                                                    </div>
                                                    {isComplete && (
                                                        <div className="flex items-center gap-3 text-slate-500">
                                                            <MessageSquare size={14} />
                                                            <Calendar size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {stageCandidates.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                            <p className="text-sm italic">No candidates</p>
                                        </div>
                                    )}
                                    </div>

                                    {stageCandidates.length > 3 && (
                                        <button 
                                            onClick={() => setActiveStageModal(stage.id)}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-slate-500 hover:text-brand-accent hover:border-brand-accent/50 uppercase tracking-[0.2em] transition-all mt-2 group flex items-center justify-center gap-2"
                                        >
                                            View All {stageCandidates.length} Candidates <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* HIGH-VELOCITY DOSSIER LIST VIEW */
                <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden flex-1 flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-white/10 bg-white/5 text-brand-accent focus:ring-brand-accent/50 cursor-pointer"
                                            checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-8 py-5">Candidate Name</th>
                                    <th className="px-8 py-5">Role/Headline</th>
                                    <th className="px-8 py-5">Current Stage</th>
                                    <th className="px-8 py-5">
                                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                                            AI Match Score <ArrowUpDown size={12} />
                                        </button>
                                    </th>
                                    <th className="px-8 py-5 text-center">Intelligence Verdict</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCandidates.sort((a, b) => {
                                    if (sortConfig.key === 'newest') return 0; // Default order
                                    const scoreA = a.assessment_score !== null && a.assessment_score !== undefined ? a.assessment_score : (a.match_score || 0);
                                    const scoreB = b.assessment_score !== null && b.assessment_score !== undefined ? b.assessment_score : (b.match_score || 0);
                                    return scoreB - scoreA;
                                }).map((candidate) => {
                                    let parsed: any = {};
                                    try {
                                        parsed = typeof candidate.parsed_json === 'string'
                                            ? JSON.parse(candidate.parsed_json)
                                            : (candidate.parsed_json || {});
                                    } catch (e) { }
                                    const isComplete = !!parsed.verdict;

                                    return (
                                        <tr
                                            key={candidate.id}
                                            className="hover:bg-white/[0.02] transition-all group"
                                        >
                                            <td className="px-8 py-6">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-white/10 bg-white/5 text-brand-accent focus:ring-brand-accent/50 cursor-pointer"
                                                    checked={selectedCandidates.includes(candidate.id)}
                                                    onChange={() => toggleSelection(candidate.id)}
                                                />
                                            </td>
                                            <td className="px-8 py-6 cursor-pointer" onClick={() => isComplete && setSelectedCandidate(candidate)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-sm">
                                                        {candidate.full_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold group-hover:text-brand-accent transition-colors">{candidate.full_name}</span>
                                                        <span className="text-[10px] text-slate-600 font-medium">{candidate.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-slate-400 text-xs font-medium italic">
                                                    {candidate.headline || "Unvetted Profile"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {candidate.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {candidate.assessment_score !== null && candidate.assessment_score !== undefined ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                                <div
                                                                    className={`h-full ${getScoreColor(candidate.assessment_score).bg}`}
                                                                    style={{ width: `${candidate.assessment_score}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{Math.round(candidate.assessment_score)}%</span>
                                                        </div>
                                                        <span className={`text-[8px] ${getScoreColor(candidate.assessment_score).text} uppercase tracking-widest`}>Tech Assessment</span>
                                                    </div>
                                                ) : candidate.match_score !== null ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                                <div
                                                                    className="h-full bg-brand-accent"
                                                                    style={{ width: `${candidate.match_score}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{Math.round(candidate.match_score)}%</span>
                                                        </div>
                                                        <span className="text-[8px] text-brand-accent uppercase tracking-widest">Resume Match</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 italic">Processing...</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {isComplete ? (
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${parsed.verdict === 'ACCEPT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' :
                                                            parsed.verdict === 'REJECT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/40' :
                                                                'bg-amber-500/10 text-amber-400 border-amber-500/40'
                                                        }`}>
                                                        {parsed.verdict === 'ACCEPT' ? <CheckCircle2 size={12} /> :
                                                            parsed.verdict === 'REJECT' ? <XCircle size={12} /> :
                                                                <AlertTriangle size={12} />}
                                                        {parsed.verdict === 'ACCEPT' ? 'Recommended' :
                                                            parsed.verdict === 'REJECT' ? 'Terminate' : 'Caution'}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest animate-pulse">Processing...</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    {candidate.status !== 'interview' && candidate.status !== 'offered' && candidate.status !== 'rejected' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(candidate.id, 'interview'); }}
                                                            className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-500 transition-all"
                                                            title="Advance to Interview"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                                        className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-all"
                                                        title="Delete Candidate"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); isComplete && setSelectedCandidate(candidate); }}
                                                        className="p-2 hover:bg-brand-accent/20 rounded-lg text-slate-500 hover:text-brand-accent transition-all"
                                                        title="View Details"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Candidate Detail Modal */}
            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onStatusChange={(status) => handleStatusChange(selectedCandidate.id, status)}
                    onDelete={() => handleDeleteCandidate(selectedCandidate.id)}
                    onUpdate={(updated) => {
                        setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
                        setSelectedCandidate(updated);
                    }}
                />
            )}

            {/* STAGE MODAL: HIGH-DENSITY MANAGEMENT */}
            {activeStageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveStageModal(null)} />
                    
                    <div className="relative bg-[#050505] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-brand-accent/10 via-transparent to-transparent">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                                        <Trello size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                                            {stages.find(s => s.id === activeStageModal)?.name}
                                        </h2>
                                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            <span>Stage Management</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-brand-accent">{filteredCandidates.filter(c => c.status === activeStageModal).length} TOTAL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveStageModal(null)}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Search & Actions inside Modal */}
                        <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input 
                                    type="text"
                                    placeholder="Search in this stage..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-accent/50 transition-all"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    value={searchTerm}
                                />
                            </div>
                        </div>

                        {/* Candidate List */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                            {filteredCandidates.filter(c => c.status === activeStageModal).length > 0 ? (
                                filteredCandidates.filter(c => c.status === activeStageModal).map(candidate => {
                                    return (
                                        <div 
                                            key={candidate.id} 
                                            className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 flex items-center justify-between group hover:bg-white/[0.05] hover:border-brand-accent/30 transition-all cursor-pointer shadow-lg hover:shadow-brand-accent/5"
                                            onClick={() => setSelectedCandidate(candidate)}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-white/10 flex items-center justify-center text-xl font-bold text-brand-accent group-hover:scale-105 transition-transform duration-300">
                                                    {candidate.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white group-hover:text-brand-accent transition-colors">{candidate.full_name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">{candidate.headline || "Deep analysis pending..."}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                {/* Score Display */}
                                                <div className="text-right hidden sm:block">
                                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                                        <span className={`text-xl font-black font-display ${getScoreColor(candidate.assessment_score || candidate.match_score || 0).text}`}>
                                                            {Math.round(candidate.assessment_score || candidate.match_score || 0)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">Platform Match</p>
                                                </div>

                                                {/* Interaction Cluster */}
                                                <div className="flex items-center gap-3 border-l border-white/10 pl-10">
                                                    {activeStageModal !== 'interview' && activeStageModal !== 'offered' && activeStageModal !== 'rejected' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(candidate.id, 'interview'); }}
                                                            className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl border border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/20"
                                                            title="Advance to Interview"
                                                        >
                                                            <Check size={20} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                                        className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl border border-rose-500/20 transition-all shadow-lg hover:shadow-rose-500/20"
                                                        title="Permanently Delete"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30">
                                    <Search size={48} className="mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-sm">No results in this stage</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
