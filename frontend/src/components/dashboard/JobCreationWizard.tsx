"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Briefcase,
    FileText,
    Zap,
    CheckCircle2,
    Type
} from "lucide-react";

export default function JobCreationWizard() {
    const { data: session } = useSession();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        department: "",
        seniority: "Mid-level",
        raw_context: "",
        tone: "professional",
        jd_content: ""
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const generateAIJD = async () => {
        setGenerating(true);
        setError("");
        try {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            const res = await fetch(`http://127.0.0.1:8000/api/v1/jobs/generate-jd?org_id=${orgId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    department: formData.department,
                    seniority: formData.seniority,
                    raw_context: formData.raw_context,
                    tone: formData.tone
                }),
            });

            if (!res.ok) throw new Error("Failed to generate job description.");

            const data = await res.json();
            setFormData({ ...formData, jd_content: data.content });
            setStep(3); // Move to review step
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            // @ts-ignore
            const orgId = session?.user?.org_id;

            // 1. Create the job record
            const jobRes = await fetch(`http://localhost:8000/api/v1/jobs/?org_id=${orgId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    department: formData.department,
                    seniority: formData.seniority
                }),
            });

            if (!jobRes.ok) throw new Error("Failed to create job.");
            const job = await jobRes.json();

            // 2. Update with the generated content and set to active
            await fetch(`http://localhost:8000/api/v1/jobs/${job.id}?org_id=${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jd_raw_context: formData.raw_context,
                    jd_final_content: formData.jd_content,
                    status: "active"
                }),
            });

            router.push("/dashboard/jobs");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-12 px-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium border-2 transition-all ${step >= s ? 'border-brand-accent bg-brand-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 text-slate-500 bg-white/5'}`}>
                            {step > s ? <CheckCircle2 size={18} /> : s}
                        </div>
                        {s < 3 && <div className={`h-[2px] flex-1 mx-4 ${step > s ? 'bg-brand-accent' : 'bg-white/10'}`} />}
                    </div>
                ))}
            </div>

            <div className="glass p-10 md:p-14 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-8 text-center">
                        {error}
                    </div>
                )}

                {/* STEP 1: JOB IDENTITY */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                        <div className="mb-8">
                            <h1 className="text-3xl font-display font-medium text-white mb-3 flex items-center gap-3">
                                <Briefcase className="text-brand-accent" /> Job Identity
                            </h1>
                            <p className="text-slate-400 text-lg">Tell us about the role you're looking to fill.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Job Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="e.g. Engineering"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Seniority Level</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Junior', 'Mid-level', 'Senior', 'Lead/Principal'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setFormData({ ...formData, seniority: level })}
                                            className={`py-3 px-4 rounded-xl border text-sm transition-all ${formData.seniority === level ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-10">
                            <button
                                onClick={handleNext}
                                disabled={!formData.title}
                                className="w-full bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple flex items-center justify-center gap-2"
                            >
                                Next: AI Generation <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: AI SPARK */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                        <div className="mb-8">
                            <h1 className="text-3xl font-display font-medium text-white mb-3 flex items-center gap-3">
                                <Sparkles className="text-brand-accent" /> The AI Spark
                            </h1>
                            <p className="text-slate-400 text-lg">Input your requirements, and our AI will build a premium JD.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Type size={16} /> Job Context & Requirements
                                </label>
                                <textarea
                                    rows={8}
                                    value={formData.raw_context}
                                    onChange={(e) => setFormData({ ...formData, raw_context: e.target.value })}
                                    placeholder="Tell the AI what you're looking for. Bullet points or paragraphs work great! e.g. 'Must have 5 years React experience, experience with Tailwind, and great communication skills. Team player is key.'"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-slate-300">Desired Content Tone</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['professional', 'bold', 'friendly'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setFormData({ ...formData, tone: t })}
                                            className={`py-3 px-4 rounded-xl border text-sm capitalize transition-all ${formData.tone === t ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-10 flex gap-4">
                            <button onClick={handleBack} className="w-1/3 py-4 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                <ChevronLeft size={18} /> Back
                            </button>
                            <button
                                onClick={generateAIJD}
                                disabled={generating || !formData.raw_context}
                                className="flex-1 bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple flex items-center justify-center gap-2"
                            >
                                {generating ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Generate JD with AI</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & PUBLISH */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                        <div className="mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-3 flex items-center gap-3">
                                    <FileText className="text-brand-accent" /> Review JD
                                </h1>
                                <p className="text-slate-400 text-lg">AI has generated your description. Review and finalize.</p>
                            </div>
                            <button onClick={() => setStep(2)} className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                                <Sparkles size={12} /> Regenerate
                            </button>
                        </div>

                        <div className="flex-1 space-y-4">
                            <textarea
                                value={formData.jd_content}
                                onChange={(e) => setFormData({ ...formData, jd_content: e.target.value })}
                                className="w-full h-[400px] bg-black/40 border border-white/10 rounded-2xl px-6 py-8 text-slate-300 font-serif leading-relaxed focus:outline-none focus:border-brand-accent transition-all resize-none overflow-y-auto whitespace-pre-wrap"
                            />
                        </div>

                        <div className="mt-auto pt-10 flex gap-4">
                            <button onClick={handleBack} className="w-1/3 py-4 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-medium">
                                Edit Requirements
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-brand-accent text-white py-4 rounded-xl font-bold hover:brightness-110 transition-all glow-purple flex items-center justify-center gap-2 text-lg"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Launch Job Pipeline <RocketIcon size={20} /></>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RocketIcon({ className, size }: { className?: string, size?: number }) {
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
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.62 5-2.5 5-2.5" />
            <path d="M12 15v5s3.03-.55 4.5-2c1.62-1.62 2.5-5 2.5-5" />
        </svg>
    );
}
