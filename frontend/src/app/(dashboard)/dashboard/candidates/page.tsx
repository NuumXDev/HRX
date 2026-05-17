"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Search,
    Filter,
    User,
    Mail,
    Briefcase,
    Calendar,
    ChevronRight,
    Loader2,
    FileText,
    TrendingUp,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { CandidateDetailModal } from "@/components/dashboard/CandidateDetailModal";

export default function CandidatesDatabasePage() {
    const { data: session } = useSession();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

    const orgId = (session?.user as any)?.org_id;

    useEffect(() => {
        if (!orgId) return;

        const fetchCandidates = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}/candidates`);
                if (res.ok) {
                    setCandidates(await res.json());
                }
            } catch (err) {
                console.error("Error fetching candidates:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [orgId]);

    const handleStatusChange = async (candidateId: string, newStatus: string) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
                if (selectedCandidate?.id === candidateId) {
                    setSelectedCandidate({ ...selectedCandidate, status: newStatus });
                }
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const handleDeleteCandidate = async (candidateId: string) => {
        if (!confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}`, {
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

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-500" };
        if (score >= 50) return { bg: "bg-yellow-500", text: "text-yellow-500" };
        return { bg: "bg-rose-500", text: "text-rose-500" };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
                <p className="text-slate-500 font-display">Loading candidate database...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Stats Strip */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-glow mb-2">Candidate Database</h1>
                    <p className="text-slate-500">Manage and track all applicants across your organization.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Talent</p>
                        <p className="text-xl font-display font-bold text-white">{candidates.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-accent transition-all"
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New Applicants</option>
                        <option value="screening">Screening</option>
                        <option value="technical">Technical</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-slate-300">
                        <Filter size={16} /> Advanced
                    </button>
                </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">

                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Candidate</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Job Applied</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Score</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold">
                                            {candidate.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-brand-accent transition-colors">{candidate.full_name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {candidate.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Briefcase size={14} className="text-slate-600" />
                                        <span className="text-xs font-medium">{candidate.job_title || "Unknown Job"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${candidate.status === 'new' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        candidate.status === 'screening' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            candidate.status === 'technical' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                candidate.status === 'interview' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                    candidate.status === 'offered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {candidate.status === 'new' ? 'UNVETTED' : 
                                         candidate.status === 'screening' ? 'ASSESSMENT' : 
                                         candidate.status === 'interview' ? 'INTERVIEW' : 
                                         candidate.status === 'offered' ? 'OFFERED' : 
                                         candidate.status === 'rejected' ? 'REJECTED' : candidate.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {candidate.assessment_score !== null && candidate.assessment_score !== undefined ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className={`h-full ${getScoreColor(candidate.assessment_score).bg}`}
                                                        style={{ width: `${candidate.assessment_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-white">{Math.round(candidate.assessment_score)}%</span>
                                            </div>
                                            <span className={`text-[8px] ${getScoreColor(candidate.assessment_score).text} uppercase tracking-widest`}>Tech Assessment</span>
                                        </div>
                                    ) : candidate.match_score !== null ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full bg-brand-accent"
                                                        style={{ width: `${candidate.match_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-white">{Math.round(candidate.match_score)}%</span>
                                            </div>
                                            <span className="text-[8px] text-brand-accent uppercase tracking-widest">Resume Match</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 italic">Processing...</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => window.open(`http://127.0.0.1:8000/api/v1/candidates/${candidate.id}/resume`, '_blank')}
                                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                                            title="View Resume"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCandidate(candidate.id);
                                            }}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all"
                                            title="Delete Candidate"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedCandidate(candidate)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-brand-accent transition-all"
                                            title="View Details"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCandidates.length === 0 && (
                    <div className="p-24 text-center">
                        <User className="text-slate-600 mx-auto mb-4 opacity-20" size={60} />
                        <h3 className="text-lg font-medium text-slate-400">No candidates found</h3>
                        <p className="text-slate-600 text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onStatusChange={(newStatus) => handleStatusChange(selectedCandidate.id, newStatus)}
                    onDelete={() => handleDeleteCandidate(selectedCandidate.id)}
                />
            )}
        </div>
    );
}
