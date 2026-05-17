import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Briefcase, Plus, MapPin, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function JobsPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/auth/login");

    // @ts-ignore
    const orgId = session.user.org_id;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/?org_id=${orgId}`, {
        cache: 'no-store'
    });

    const jobs = res.ok ? await res.json() : [];
    // Absolute path write for debugging
    try {
        require('fs').writeFileSync('/tmp/hrx_debug.json', JSON.stringify(jobs, null, 2));
    } catch (e) { }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-glow mb-2">Jobs</h1>
                    <p className="text-slate-500">Manage your active job postings and AI-powered workflows.</p>
                </div>
                <Link
                    href="/dashboard/jobs/new"
                    className="bg-brand-accent text-white px-6 py-3 rounded-xl font-medium hover:brightness-110 transition-all glow-purple flex items-center gap-2"
                >
                    <Plus size={20} /> Create New Job
                </Link>
            </div>

            {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job: any) => {
                        const jobIdentifier = job.id;
                        return (
                            <div key={job.id} className="bg-black/40 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/10 transition-all" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                        <Briefcase size={20} className="text-slate-400" />
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-display font-bold text-white mb-2">{job.title}</h3>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} /> {job.department || 'General'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <Link href={`/dashboard/jobs/${jobIdentifier}`} className="block w-full">
                                        <span className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                            Open Dashboard <ArrowUpRight size={14} />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-black/40 border border-white/5 rounded-2xl p-24 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                        <Briefcase className="text-slate-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-display font-medium text-white">No active jobs found</h2>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        You haven't created any hiring pipelines yet. Start by building your first AI-assisted job description.
                    </p>
                    <Link
                        href="/dashboard/jobs/new"
                        className="mt-6 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-xl transition-all text-sm font-medium"
                    >
                        Create First Role
                    </Link>
                </div>
            )}
        </div>
    );
}
