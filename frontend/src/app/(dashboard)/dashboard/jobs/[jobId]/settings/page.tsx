"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function JobSettingsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const unwrappedParams = use(params);
    const jobId = unwrappedParams.jobId;
    const router = useRouter();
    const { data: session } = useSession();
    const [isArchiving, setIsArchiving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleArchive = async () => {
        const orgId = session?.user?.org_id;
        if (!orgId) return;

        if (!confirm("Are you sure you want to archive this job? It will no longer be visible to candidates.")) return;

        setIsArchiving(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/jobs/${jobId}?org_id=${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "closed" })
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                console.error("Failed to archive job");
                setIsArchiving(false);
            }
        } catch (error) {
            console.error("Failed to archive job", error);
            setIsArchiving(false);
        }
    };

    const handleDelete = async () => {
        const orgId = session?.user?.org_id;
        if (!orgId) return;

        if (!confirm("Are you critically sure you want to DELETE this job? All associated candidates and data will be permanently removed. This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/jobs/${jobId}?org_id=${orgId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                console.error("Failed to delete job");
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Failed to delete job", error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-black/40 border border-white/5 rounded-3xl p-10 md:p-14 min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-2xl space-y-12">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Job Settings</h2>
                    <p className="text-slate-500">Manage visibility, pipeline stages, and hiring team for this specific role.</p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div>
                            <p className="font-medium text-white mb-1">Job Status</p>
                            <p className="text-sm text-slate-500">Currently receiving new applications.</p>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">Active</div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div>
                            <p className="font-medium text-white mb-1">Public Access</p>
                            <p className="text-sm text-slate-500">Allow candidates to find this job through search engines.</p>
                        </div>
                        <div className="w-12 h-6 bg-brand-accent rounded-full relative">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleArchive}
                        disabled={isArchiving || isDeleting}
                        className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors disabled:opacity-50 px-4 py-2 border border-amber-500/30 rounded-lg hover:bg-amber-500/10"
                    >
                        {isArchiving ? "Archiving..." : "Archive this job"}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || isArchiving}
                        className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors disabled:opacity-50 px-4 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10"
                    >
                        {isDeleting ? "Deleting..." : "Delete this job"}
                    </button>
                </div>
            </div>
        </div>
    );
}
