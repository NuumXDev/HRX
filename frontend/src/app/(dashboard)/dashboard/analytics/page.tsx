"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
    Users, 
    TrendingUp, 
    Award, 
    Layers, 
    ChevronDown, 
    ArrowLeft, 
    Sparkles, 
    Loader2, 
    CheckCircle2, 
    XCircle,
    UserCheck,
    Cpu
} from "lucide-react";
import Link from "next/link";

interface GlobalMetrics {
    total_candidates: number;
    assessment_pass_rate: number;
    average_score: number;
    pipelines_count: number;
}

interface FunnelItem {
    stage: string;
    count: number;
    percentage: number;
}

interface JobPipeline {
    id: string;
    title: string;
    total: number;
    counts: {
        new: number;
        screening: number;
        interview: number;
        offered: number;
    };
}

interface TopSkill {
    skill: string;
    count: number;
}

interface ScoreDistribution {
    range: string;
    count: number;
}

interface LeaderboardCandidate {
    id: string;
    full_name: string;
    score: number;
    status: string;
    email: string;
    job_title: string;
}

interface AnalyticsData {
    global_metrics: GlobalMetrics;
    funnel_data: FunnelItem[];
    job_pipelines: JobPipeline[];
    top_skills: TopSkill[];
    score_distribution: ScoreDistribution[];
    top_candidates: LeaderboardCandidate[];
    ai_summary: string;
}

export default function AnalyticsPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [selectedJobId, setSelectedJobId] = useState<string>("all");
    const [jobs, setJobs] = useState<any[]>([]);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const orgId = session?.user?.org_id;

    // Fetch jobs list
    useEffect(() => {
        if (!orgId) return;
        const fetchJobs = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs?org_id=${orgId}`);
                if (res.ok) {
                    setJobs(await res.json());
                }
            } catch (e) {
                console.error("Error fetching jobs for analytics", e);
            }
        };
        fetchJobs();
    }, [orgId]);

    // Fetch analytics summary
    useEffect(() => {
        if (!orgId) return;
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const jobParam = selectedJobId !== "all" ? `&job_id=${selectedJobId}` : "";
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/analytics/summary?org_id=${orgId}${jobParam}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (e) {
                console.error("Error fetching analytics stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [orgId, selectedJobId]);

    if (sessionStatus === "loading" || loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-accent" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">Assembling strategic recruitment dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-slate-400 font-semibold">No recruitment intelligence loaded.</p>
            </div>
        );
    }

    // Helper to calculate coordinates for radar chart points
    const getRadarPoints = (skills: TopSkill[], center: number, rMax: number) => {
        const pointsCount = 6;
        const maxCount = Math.max(...skills.map(s => s.count), 1);
        
        return skills.slice(0, pointsCount).map((skill, i) => {
            const angle = (i * 2 * Math.PI) / pointsCount - Math.PI / 2;
            const valueRatio = skill.count / maxCount;
            const r = rMax * (0.2 + 0.8 * valueRatio); // Prevent shrinking to absolute zero center
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return { x, y, angle, label: skill.skill, value: skill.count };
        });
    };

    const radarCenter = 120;
    const radarMaxR = 80;
    const radarPoints = getRadarPoints(data.top_skills, radarCenter, radarMaxR);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Header Control Tower */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
                <div className="space-y-1">
                    <h1 className="text-3xl font-display font-bold text-glow">Recruitment Control Tower</h1>
                    <p className="text-slate-500 text-sm">Strategic cohort insights and pipeline analytics across your organization.</p>
                </div>
                <div className="relative">
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="appearance-none bg-white/[0.03] border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-semibold text-slate-300 outline-none hover:bg-white/[0.07] hover:border-brand-accent/30 transition-all cursor-pointer min-w-[240px] shadow-lg"
                    >
                        <option value="all">📊 All Pipelines (Aggregate)</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>💼 {job.title}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown size={18} />
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-accent/30 transition-all duration-300 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-4 group-hover:scale-105 transition-transform duration-300">
                        <Users size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Candidates</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{data.global_metrics.total_candidates}</h2>
                    <span className="text-xs text-slate-400 mt-2 block">Aggregated in database</span>
                </div>

                {/* Metric 2 */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                        <TrendingUp size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Assessment Pass Rate</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{data.global_metrics.assessment_pass_rate}%</h2>
                    <span className="text-xs text-slate-400 mt-2 block">Scored as HIRE/ACCEPT</span>
                </div>

                {/* Metric 3 */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                        <Award size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Average Match Score</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{data.global_metrics.average_score}%</h2>
                    <span className="text-xs text-slate-400 mt-2 block">AI alignment average</span>
                </div>

                {/* Metric 4 */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform duration-300">
                        <Layers size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Workflows</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{data.global_metrics.pipelines_count}</h2>
                    <span className="text-xs text-slate-400 mt-2 block">Roles with candidates</span>
                </div>
            </div>

            {/* Strategic Visualization Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recruitment Funnel Card */}
                <div className="bg-gradient-to-br from-[#060606] to-[#010101] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Pipeline Throughput</h3>
                        <p className="text-xs text-slate-500">Cumulative funnel and conversion drop-offs between stages.</p>
                    </div>

                    <div className="space-y-6 my-auto flex flex-col justify-center">
                        {data.funnel_data.map((item, index) => {
                            // Render sleek stacked horizontal polygon funnel
                            const widthPercent = item.percentage;
                            const colors = [
                                "from-brand-accent/30 to-brand-accent",
                                "from-violet-500/30 to-violet-500",
                                "from-indigo-500/30 to-indigo-500",
                                "from-emerald-500/30 to-emerald-500"
                            ];
                            return (
                                <div key={item.stage} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-slate-300">{item.stage}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-slate-400">{item.count} Candidates</span>
                                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono font-bold text-[10px] text-brand-accent">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/[0.02] border border-white/5 h-6 rounded-full overflow-hidden relative shadow-inner">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(139,92,246,0.3)]`}
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Skill DNA Radar Map */}
                <div className="bg-gradient-to-br from-[#060606] to-[#010101] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Skill Coverage Matrix</h3>
                        <p className="text-xs text-slate-500">Aggregated technical strengths profile of the applicant pool.</p>
                    </div>

                    {data.top_skills.length === 0 ? (
                        <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">
                            No skill metrics parsed from resumes yet.
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                            {/* RADAR SVG GRAPH */}
                            <svg width="240" height="240" className="overflow-visible">
                                <defs>
                                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                                    </radialGradient>
                                </defs>
                                {/* Background Web Grid (concentric polygons) */}
                                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                                    const pathPoints = radarPoints.map(p => {
                                        const angle = p.angle;
                                        const r = radarMaxR * ratio;
                                        const x = radarCenter + r * Math.cos(angle);
                                        const y = radarCenter + r * Math.sin(angle);
                                        return `${x},${y}`;
                                    }).join(" ");
                                    return (
                                        <polygon 
                                            key={ratio}
                                            points={pathPoints}
                                            className="fill-none stroke-white/5 stroke-[1]"
                                        />
                                    );
                                })}

                                {/* Axis lines */}
                                {radarPoints.map((p, i) => (
                                    <line
                                        key={i}
                                        x1={radarCenter}
                                        y1={radarCenter}
                                        x2={radarCenter + radarMaxR * Math.cos(p.angle)}
                                        y2={radarCenter + radarMaxR * Math.sin(p.angle)}
                                        className="stroke-white/5 stroke-[1]"
                                    />
                                ))}

                                {/* Glowing Match Area Polygon */}
                                <polygon
                                    points={radarPoints.map(p => `${p.x},${p.y}`).join(" ")}
                                    className="stroke-brand-accent stroke-[2] fill-[url(#radarGlow)] transition-all duration-1000"
                                />

                                {/* Skill Points Circles */}
                                {radarPoints.map((p, i) => (
                                    <g key={i} className="group cursor-pointer">
                                        <title>{p.label}</title>
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="4"
                                            className="fill-brand-accent stroke-white stroke-[1] shadow-[0_0_10px_#8B5CF6]"
                                        />
                                        {/* Skill text labels */}
                                        <text
                                            x={radarCenter + (radarMaxR + 15) * Math.cos(p.angle)}
                                            y={radarCenter + (radarMaxR + 15) * Math.sin(p.angle) + 4}
                                            textAnchor={Math.cos(p.angle) > 0.1 ? "start" : Math.cos(p.angle) < -0.1 ? "end" : "middle"}
                                            className="fill-slate-400 font-mono text-[9px] font-bold tracking-wider"
                                        >
                                            {p.label.length > 12 ? p.label.substring(0, 12) + "..." : p.label} ({p.value})
                                        </text>
                                    </g>
                                ))}
                            </svg>

                            {/* LEGEND TABLE */}
                            <div className="flex-1 space-y-3 w-full">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Top Skills Count</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {data.top_skills.slice(0, 6).map((item, idx) => (
                                        <div key={item.skill} className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                                            <span className="font-mono text-[10px] text-slate-300 truncate max-w-[80px]">{item.skill}</span>
                                            <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-md">
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Score & Job Pipelines Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Score Distribution Bell curve */}
                <div className="bg-gradient-to-br from-[#060606] to-[#010101] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl lg:col-span-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Quality Distribution Curve</h3>
                        <p className="text-xs text-slate-500">Distribution of candidate match scores.</p>
                    </div>

                    <div className="h-[220px] flex items-end gap-3 mt-6">
                        {data.score_distribution.map((item, idx) => {
                            const maxVal = Math.max(...data.score_distribution.map(d => d.count), 1);
                            const hRatio = item.count / maxVal;
                            return (
                                <div key={item.range} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                                    <div className="relative w-full flex flex-col justify-end items-center h-[160px]">
                                        {/* Hover Tooltip tooltip */}
                                        <span className="absolute -top-6 text-[10px] font-bold font-mono text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {item.count}
                                        </span>
                                        {/* Column bar */}
                                        <div 
                                            className="w-full bg-gradient-to-t from-brand-accent/20 to-brand-accent border border-brand-accent/30 rounded-2xl group-hover:brightness-110 shadow-lg group-hover:shadow-brand-accent/20 transition-all duration-1000"
                                            style={{ height: `${hRatio * 140}px` }}
                                        />
                                    </div>
                                    <span className="font-mono text-[9px] text-slate-500 font-bold">{item.range}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Global Pipelines Comparison */}
                <div className="bg-gradient-to-br from-[#060606] to-[#010101] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl lg:col-span-7 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Active Pipelines</h3>
                        <p className="text-xs text-slate-500">Candidate loading density comparison across open jobs.</p>
                    </div>

                    <div className="space-y-4 mt-6 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                        {data.job_pipelines.length === 0 ? (
                            <div className="text-slate-500 text-sm h-full flex items-center justify-center">
                                No active hiring pipelines found.
                            </div>
                        ) : (
                            data.job_pipelines.map((pipe) => {
                                const newW = pipe.total > 0 ? (pipe.counts.new / pipe.total) * 100 : 0;
                                const scrW = pipe.total > 0 ? (pipe.counts.screening / pipe.total) * 100 : 0;
                                const intW = pipe.total > 0 ? (pipe.counts.interview / pipe.total) * 100 : 0;
                                const offW = pipe.total > 0 ? (pipe.counts.offered / pipe.total) * 100 : 0;

                                return (
                                    <div key={pipe.id} className="space-y-1.5 bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-200 truncate max-w-[200px]">{pipe.title}</span>
                                            <span className="font-mono text-slate-400 text-[10px] font-bold">{pipe.total} Candidates</span>
                                        </div>
                                        {/* Segmented Progress Bar */}
                                        <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/[0.03] border border-white/5">
                                            {pipe.counts.new > 0 && <div className="bg-slate-500 h-full" style={{ width: `${newW}%` }} title={`New: ${pipe.counts.new}`} />}
                                            {pipe.counts.screening > 0 && <div className="bg-violet-500 h-full" style={{ width: `${scrW}%` }} title={`Screening: ${pipe.counts.screening}`} />}
                                            {pipe.counts.interview > 0 && <div className="bg-indigo-500 h-full" style={{ width: `${intW}%` }} title={`Interview: ${pipe.counts.interview}`} />}
                                            {pipe.counts.offered > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${offW}%` }} title={`Offered: ${pipe.counts.offered}`} />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* AI Strategic synthesis panel */}
            <div className="bg-gradient-to-r from-brand-accent/10 via-[#0A0A0A] to-brand-accent/5 border border-brand-accent/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.1),transparent_70%)] pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0 relative animate-pulse">
                    <div className="absolute inset-0 rounded-2xl bg-brand-accent/15 blur-md" />
                    <Cpu size={26} className="relative z-10" />
                </div>
                <div className="space-y-2 relative z-10 flex-1">
                    <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={12} /> Executive AI Intelligence Summary
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">
                        "{data.ai_summary}"
                    </p>
                </div>
            </div>

            {/* Top Talent Leaderboard Table */}
            <div className="bg-[#050505] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">Top Elite Talent</h3>
                        <p className="text-xs text-slate-500">Highest-performing candidates across active roles.</p>
                    </div>
                    <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        Ranked by AI Score
                    </span>
                </div>

                <div className="overflow-x-auto w-full">
                    {data.top_candidates.length === 0 ? (
                        <div className="text-slate-500 text-center py-8 text-sm">
                            No evaluated candidates found yet.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4">Candidate</th>
                                    <th className="py-4">Assigned Role</th>
                                    <th className="py-4">Current Phase</th>
                                    <th className="py-4 text-right">Alignment Match</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {data.top_candidates.map((cand) => (
                                    <tr key={cand.id} className="group hover:bg-white/[0.01] transition-all">
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-white group-hover:text-brand-accent transition-colors">{cand.full_name}</span>
                                                <span className="text-xs text-slate-500 font-mono">{cand.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-xs font-semibold text-slate-300">
                                            {cand.job_title}
                                        </td>
                                        <td className="py-4">
                                            <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                {cand.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                                                {cand.score}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
