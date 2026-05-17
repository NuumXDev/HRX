"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, Sparkles, CheckCircle2 } from "lucide-react";

export default function JobDescriptionPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = use(params);
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [rawContext, setRawContext] = useState("");
    const [jobData, setJobData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [showRegenEditor, setShowRegenEditor] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchJD = async () => {
            try {
                // @ts-ignore
                const orgId = session?.user?.org_id;
                if (!orgId) return;

                const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}?org_id=${orgId}`;
                console.log(`HITTING URL: ${url}`);
                console.log(`Session OrgID: ${orgId}`);

                const res = await fetch(url);
                console.log(`Fetch status for JD: ${res.status}`);
                if (res.ok) {
                    const data = await res.json();
                    setJobData(data);
                    setContent(data.jd_final_content || "");
                    setRawContext(data.jd_raw_context || "");
                } else {
                    const errData = await res.json();
                    console.error("Job fetch failed:", errData);
                }
            } catch (err) {
                setError("Failed to load job description.");
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchJD();
    }, [jobId, session]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError("");

        try {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}?org_id=${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jd_final_content: content }),
            });

            if (!res.ok) throw new Error("Failed to save.");

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        setError("");

        try {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/${jobId}/regenerate?org_id=${orgId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: jobData?.title,
                    department: jobData?.department,
                    raw_context: rawContext,
                    tone: "professional"
                }),
            });

            if (!res.ok) throw new Error("Failed to regenerate.");

            const data = await res.json();
            setContent(data.content);
            setShowRegenEditor(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError("Failed to regenerate with AI.");
        } finally {
            setRegenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-black/40 border border-white/5 rounded-3xl p-10 md:p-14 min-h-[600px] flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-black/40 border border-white/5 rounded-3xl p-10 md:p-14 min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white mb-1">Job Description Editor</h2>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <Sparkles size={14} className="text-brand-accent" /> AI-powered content. Refine and publish.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {saved && (
                            <span className="text-emerald-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                <CheckCircle2 size={16} /> Updated
                            </span>
                        )}
                        <button
                            onClick={() => setShowRegenEditor(!showRegenEditor)}
                            className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                            <Sparkles size={16} className="text-brand-accent" /> {showRegenEditor ? "Cancel AI" : "Regenerate with AI"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || regenerating}
                            className="bg-brand-accent text-white px-6 py-2.5 rounded-xl text-sm font-medium glow-purple flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold">
                        {error}
                    </div>
                )}

                {showRegenEditor && (
                    <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-brand-accent uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={14} /> Refine Requirements
                            </h4>
                            <span className="text-[10px] text-brand-accent/60 font-medium">Gemini 3 Preview Active</span>
                        </div>
                        <p className="text-xs text-slate-400">Edit the core requirements below. AI will regenerate the full JD using these updates.</p>
                        <textarea
                            value={rawContext}
                            onChange={(e) => setRawContext(e.target.value)}
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-brand-accent transition-all resize-none"
                            placeholder="Engineering lead with 8+ years experience..."
                        />
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="w-full bg-brand-accent text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-brand-accent/20"
                        >
                            {regenerating ? <Loader2 className="animate-spin" size={16} /> : "Run AI Regeneration"}
                        </button>
                    </div>
                )}

                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="relative w-full h-[600px] bg-black/40 border border-white/10 rounded-2xl p-8 text-slate-300 font-serif leading-relaxed text-lg focus:outline-none focus:border-brand-accent transition-all resize-none overflow-y-auto whitespace-pre-wrap"
                        placeholder="Paste or write your job description here..."
                    />
                </div>
            </div>
        </div>
    );
}
