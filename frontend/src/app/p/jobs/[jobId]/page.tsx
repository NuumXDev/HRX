"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Upload, CheckCircle2, AlertCircle, Briefcase, MapPin, Building2, Globe } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function PublicJobPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = use(params);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [resume, setResume] = useState<File | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/v1/public/jobs/${jobId}`);
                if (res.ok) {
                    setJob(await res.json());
                } else {
                    setError("Job posting not found or has been closed.");
                }
            } catch (err) {
                setError("Failed to load job details. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resume) {
            alert("Please upload your resume.");
            return;
        }

        setSubmitting(true);
        setError("");

        const formData = new FormData();
        formData.append("full_name", fullName);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("resume", resume);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/public/jobs/${jobId}/apply`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to submit application.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
                <p className="text-slate-400 font-display">Loading job details...</p>
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center max-w-md w-full">
                    <AlertCircle className="text-red-500 mx-auto mb-6" size={60} />
                    <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <Link href="/" className="inline-block w-full bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-12 text-center max-w-md w-full animate-in zoom-in-95 duration-500">
                    <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={80} />
                    <h1 className="text-3xl font-display font-bold text-white mb-4">Application Received!</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Thank you for applying to <span className="text-white font-bold">{job?.org_name}</span>.
                        Our AI is currently analyzing your profile. You'll receive an update soon at <span className="text-white font-medium">{email}</span>.
                    </p>
                    <Link href="/" className="inline-block w-full bg-brand-accent text-white py-4 rounded-2xl font-bold glow-purple hover:brightness-110 transition-all">
                        Explore Other Roles
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
            </div>

            {/* Header / Navbar */}
            <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white font-black italic">H</div>
                        <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">HRX Talent</span>
                    </div>
                    <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        All Jobs
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-5 gap-16">
                {/* Job Content */}
                <div className="lg:col-span-3 space-y-12 animate-in slide-in-from-left-4 duration-700">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Globe size={12} /> Remote Friendly
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={12} /> {job?.org_name}
                            </span>
                        </div>
                        <h1 className="text-5xl font-display font-bold text-white leading-tight">{job?.title}</h1>
                        <div className="flex items-center gap-6 text-slate-400">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-slate-500" />
                                <span>{job?.department || "General"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase size={18} className="text-slate-500" />
                                <span>Full-Time</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => (
                                    <div className="mt-12 mb-6 first:mt-0">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-1.5 h-8 bg-brand-accent rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
                                            <h2 className="text-2xl font-display font-bold text-white tracking-tight">{children}</h2>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-brand-accent/30 via-white/5 to-transparent ml-6" />
                                    </div>
                                ),
                                h2: ({ children }) => (
                                    <div className="mt-12 mb-6 first:mt-0">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-1.5 h-8 bg-brand-accent rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
                                            <h2 className="text-2xl font-display font-bold text-white tracking-tight">{children}</h2>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-brand-accent/30 via-white/5 to-transparent ml-6" />
                                    </div>
                                ),
                                h3: ({ children }) => (
                                    <div className="mt-10 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-brand-accent/60 rounded-full" />
                                            <h3 className="text-lg font-display font-semibold text-white/90">{children}</h3>
                                        </div>
                                    </div>
                                ),
                                p: ({ children }) => (
                                    <p className="text-slate-400 text-base leading-[1.85] ml-6">{children}</p>
                                ),
                                strong: ({ children }) => (
                                    <strong className="text-white font-semibold">{children}</strong>
                                ),
                                ul: ({ children }) => (
                                    <ul className="space-y-3 ml-6 mt-3">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="space-y-3 ml-6 mt-3 list-decimal list-inside">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="flex items-start gap-3 text-slate-400 text-base leading-relaxed">
                                        <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-accent/60 flex-shrink-0" />
                                        <span>{children}</span>
                                    </li>
                                ),
                                hr: () => (
                                    <div className="my-10 flex items-center gap-4">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent/40" />
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    </div>
                                ),
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline underline-offset-4 transition-colors">
                                        {children}
                                    </a>
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="ml-6 pl-5 border-l-2 border-brand-accent/30 italic text-slate-500">
                                        {children}
                                    </blockquote>
                                ),
                            }}
                        >
                            {job?.description || ""}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Application Sidebar */}
                <div className="lg:col-span-2 animate-in slide-in-from-right-4 duration-700">
                    <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-10 shadow-2xl sticky top-32 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-2">Apply for this position</h2>
                            <p className="text-slate-500 text-sm">Join the hiring process at {job?.org_name}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                <input
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Resume / CV</label>
                                <div className={`relative border-2 border-dashed rounded-2xl transition-all ${resume ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'}`}>
                                    <input
                                        type="file"
                                        onChange={(e) => e.target.files && setResume(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".pdf,.doc,.docx"
                                    />
                                    <div className="p-8 text-center flex flex-col items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${resume ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-slate-400'}`}>
                                            {resume ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">{resume ? resume.name : "Choose file"}</p>
                                            <p className="text-[10px] text-slate-500">PDF, DOC up to 5MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-brand-accent text-white py-5 rounded-2xl font-bold text-lg glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? (
                                    <><Loader2 className="animate-spin" size={24} /> Submitting...</>
                                ) : (
                                    "Submit Application"
                                )}
                            </button>

                            <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                                By applying, you agree to our Terms of Service and Privacy Policy.
                                Your data will be processed securely by HRX AI.
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
