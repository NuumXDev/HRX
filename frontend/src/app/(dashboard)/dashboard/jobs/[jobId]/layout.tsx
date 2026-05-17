"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, FileText, Settings, ArrowLeft } from "lucide-react";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";

export default function JobWorkspaceLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ jobId: string }>;
}) {
    const unwrappedParams = use(params);
    const jobId = unwrappedParams.jobId;
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [jobTitle, setJobTitle] = useState("Loading...");

    // In a real app, we'd fetch this from a shared state or server component
    // Here we'll fetch briefly to show the real title in breadcrumbs
    useEffect(() => {
        const fetchJob = async () => {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            if (!orgId) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}?org_id=${orgId}`);
                // Note: For now, we'll keep it simple, if it fails we use a placeholder
                if (res.ok) {
                    const data = await res.json();
                    setJobTitle(data.title);
                } else {
                    setJobTitle("Job Details");
                }
            } catch {
                setJobTitle("Job Workspace");
            }
        };
        if (session) fetchJob();
    }, [jobId, session]);

    const tabs = [
        { name: "Pipeline", icon: LayoutDashboard, path: `/dashboard/jobs/${jobId}` },
        { name: "Description", icon: FileText, path: `/dashboard/jobs/${jobId}/jd` },
        { name: "Settings", icon: Settings, path: `/dashboard/jobs/${jobId}/settings` },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumbs & Title Context */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard/jobs" className="hover:text-brand-accent transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> Jobs
                    </Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-300 font-medium">{jobTitle}</span>
                </div>

                <div className="flex justify-between items-end">
                    <h1 className="text-4xl font-display font-bold text-white tracking-tight">{jobTitle}</h1>
                    <div className="flex gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.path || (tab.name === "Pipeline" && pathname.endsWith(jobId));
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Workspace Content */}
            <div className="min-h-[600px]">
                {children}
            </div>
        </div>
    );
}
