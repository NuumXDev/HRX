"use client";

import { useState, useEffect } from "react";
import {
    X,
    Calendar as CalendarIcon,
    Clock,
    Video,
    MapPin,
    User as UserIcon,
    FileText,
    Loader2
} from "lucide-react";

interface ScheduleInterviewModalProps {
    candidate: any;
    onClose: () => void;
    onScheduled: (interview: any) => void;
}

export function ScheduleInterviewModal({ candidate, onClose, onScheduled }: ScheduleInterviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [team, setTeam] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        type: "technical",
        start_time: "",
        interviewer_id: "",
        meeting_link: "",
        location: "",
        notes: ""
    });

    useEffect(() => {
        // Fetch team members for the interviewer dropdown
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${candidate.org_id}/users`);
                if (res.ok) {
                    setTeam(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch team:", err);
            }
        };
        fetchTeam();
    }, [candidate.org_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/interviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    candidate_id: candidate.id,
                    job_id: candidate.job_id,
                    org_id: candidate.org_id,
                    start_time: new Date(formData.start_time).toISOString(),
                })
            });

            if (res.ok) {
                const interview = await res.json();
                onScheduled(interview);
                onClose();
            } else {
                const err = await res.json();
                alert(`Failed to schedule: ${err.detail || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Scheduling error:", err);
            alert("An error occurred while scheduling the interview.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="text-brand-accent" size={20} /> Schedule Interview
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Interview Type */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Interview Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-accent transition-all"
                            >
                                <option value="screening">Initial Screening</option>
                                <option value="technical">Technical Interview</option>
                                <option value="behavioral">Behavioral Interview</option>
                                <option value="cultural">Culture Fit</option>
                                <option value="final">Final Round</option>
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Date & Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                        </div>

                        {/* Interviewer */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Assign Interviewer</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <select
                                    value={formData.interviewer_id}
                                    onChange={(e) => setFormData({ ...formData, interviewer_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-accent transition-all"
                                >
                                    <option value="">Select Interviewer</option>
                                    {team.map(member => (
                                        <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Meeting Link */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Meeting Link (Zoom/Google Meet)</label>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Notes for Interviewer</label>
                            <textarea
                                placeholder="Focus on system design and React patterns..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-accent transition-all h-24 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all text-slate-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-brand-accent text-white rounded-2xl text-sm font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Schedule Interview"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
