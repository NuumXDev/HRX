import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    Users,
    Briefcase,
    Clock,
    TrendingUp,
    FileText,
    Calendar,
    MessageSquare
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default async function DashboardPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    // @ts-ignore
    const role = session.user.role || "recruiter";
    // @ts-ignore
    const orgId = session.user.org_id;

    // Fetch organization details to ensure onboarding is completed
    const res = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}`, {
        cache: 'no-store'
    });

    if (res.ok) {
        const organization = await res.json();
        if (!organization.onboarding_completed) {
            redirect("/onboarding");
        }
    } else {
        redirect("/auth/login");
    }

    // Fetch organization stats
    const statsRes = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}/stats`, {
        cache: 'no-store'
    });

    const stats = statsRes.ok ? await statsRes.json() : {
        total_candidates: 0,
        active_jobs: 0,
        interviews_scheduled: 0,
        time_to_hire: "0d",
        my_active_jobs: 0,
        new_apps_24h: 0,
        pending_review: 0,
        phone_calls_today: 0,
        candidate_reviews_due: 0,
        interviews_today: 0,
        feedback_due: 0
    };

    // Fetch active jobs list
    const jobsRes = await fetch(`http://127.0.0.1:8000/api/v1/jobs/?org_id=${orgId}`, {
        cache: 'no-store'
    });
    const jobs = jobsRes.ok ? await jobsRes.json() : [];

    // Fetch AI Recommendations
    const recommendationsRes = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}/recommendations`, {
        cache: 'no-store'
    });
    const recommendations = recommendationsRes.ok ? await recommendationsRes.json() : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-display font-bold text-glow mb-2">
                    Welcome back, {session.user.name?.split(' ')[0]}
                </h1>
                <p className="text-slate-500">
                    Here's what's happening in your organization today.
                </p>
            </div>

            {/* Role-Based Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {role === "super_admin" && (
                    <>
                        <MetricCard title="Total Candidates" value={stats.total_candidates} trend="+0%" icon={Users} color="brand-accent" />
                        <MetricCard title="Active Workflows" value={stats.active_jobs} trend="+0" icon={Briefcase} color="emerald-500" />
                        <MetricCard title="Interviews Scheduled" value={stats.interviews_scheduled} trend="Today" icon={Clock} color="amber-500" />
                        <MetricCard title="Time to Hire" value={stats.time_to_hire} trend="0d" icon={TrendingUp} color="blue-500" />
                    </>
                )}
                {role === "recruiter" && (
                    <>
                        <MetricCard title="My Active Workflows" value={stats.my_active_jobs} trend="+0" icon={Briefcase} color="brand-accent" />
                        <MetricCard title="New Apps" value={stats.new_apps_24h} trend="Last 24h" icon={Users} color="emerald-500" />
                        <MetricCard title="Pending Review" value={stats.pending_review} trend="Total" icon={FileText} color="amber-500" />
                        <MetricCard title="Phone Calls" value={stats.phone_calls_today} trend="Today" icon={Clock} color="blue-500" />
                    </>
                )}
                {(role === "hiring_manager" || role === "interviewer") && (
                    <>
                        <MetricCard title="Candidate Reviews" value={stats.candidate_reviews_due} trend="Due Today" icon={FileText} color="amber-500" />
                        <MetricCard title="Interviews" value={stats.interviews_today} trend="Today" icon={Calendar} color="brand-accent" />
                        <MetricCard title="Feedback Due" value={stats.feedback_due} trend="Pending" icon={MessageSquare} color="emerald-500" />
                        <MetricCard title="Upcoming" value="None" trend="N/A" icon={Clock} color="blue-500" />
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-display font-bold text-white">Active Job Workflows</h2>
                        <a href="/dashboard/jobs" className="text-sm text-brand-accent hover:underline">View all</a>
                    </div>

                    {jobs.length > 0 ? (
                        <div className="grid gap-4">
                            {jobs.map((job: any) => (
                                <a
                                    key={job.id}
                                    href={`/dashboard/jobs/${job.id}`}
                                    className="bg-black/40 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-brand-accent/10 transition-all">
                                            <Briefcase className="text-slate-400 group-hover:text-brand-accent transition-all" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium mb-1">{job.title}</h4>
                                            <p className="text-slate-500 text-sm">{job.department || "No Department"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-white text-sm font-medium">{job.candidate_count || 0} Candidates</p>
                                            <p className="text-slate-500 text-xs">Recently added</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-8 h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <Briefcase className="text-slate-500" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-white mb-2">No active job workflows yet</h3>
                                <p className="text-slate-500 max-w-sm mx-auto text-sm">
                                    Start by creating your first AI-powered job description to begin your hiring process.
                                </p>
                            </div>
                            <a href="/dashboard/jobs" className="bg-brand-accent text-white px-6 py-2.5 rounded-xl text-sm font-medium glow-purple hover:brightness-110 transition-all">
                                Create First Job
                            </a>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                            <Sparkles className="text-brand-accent" size={20} /> AI Recommendations
                        </h3>
                        <div className="space-y-4">
                            {recommendations.length > 0 ? (
                                recommendations.map((rec: any, i: number) => (
                                    <a
                                        key={i}
                                        href={rec.job_id ? `/dashboard/jobs/${rec.job_id}` : "#"}
                                        className="block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-brand-accent/30 transition-all cursor-pointer group"
                                    >
                                        <p className="text-sm font-medium text-white mb-1 group-hover:text-brand-accent transition-colors">{rec.title}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{rec.message}</p>
                                    </a>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-xs italic">
                                    No new recommendations yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sparkles icon for the recommendations section
function Sparkles({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" />
        </svg>
    );
}
