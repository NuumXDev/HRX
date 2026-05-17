"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Palette, Upload, CheckCircle2, Globe, MapPin, Users, Info, Sparkles, UserPlus, X } from "lucide-react";

export default function OnboardingWizard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        website_url: "",
        hq_location: "",
        company_size: "",
        description: "",
        industry: "",
        brand_color: "#8b5cf6",
        recruitment_tone: "professional",
        logo_file: "",
    });

    // Fetch current org name on mount
    useEffect(() => {
        const fetchOrg = async () => {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            if (orgId) {
                try {
                    const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFormData(prev => ({ ...prev, name: data.name }));
                    }
                } catch (err) {
                    console.error("Failed to fetch organization:", err);
                }
            }
        };
        if (status === "authenticated") fetchOrg();
    }, [session, status]);

    const [teamInvites, setTeamInvites] = useState<{ email: string; role: string }[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("recruiter");

    if (status === "unauthenticated") {
        router.push("/auth/login");
        return null;
    }

    if (status === "loading") {
        return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 className="animate-spin text-brand-accent" /></div>;
    }

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const addInvite = () => {
        if (newEmail && !teamInvites.find(i => i.email === newEmail)) {
            setTeamInvites([...teamInvites, { email: newEmail, role: newRole }]);
            setNewEmail("");
        }
    };

    const removeInvite = (email: string) => {
        setTeamInvites(teamInvites.filter(i => i.email !== email));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            // @ts-ignore
            const orgId = session?.user?.org_id;
            if (!orgId) throw new Error("No organization ID found in session.");

            // 1. Save Organization Data
            const orgRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/onboarding`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!orgRes.ok) {
                const data = await orgRes.json();
                throw new Error(data.detail || "Failed to save organization data.");
            }

            // 2. Send Team Invites (if any)
            if (teamInvites.length > 0) {
                const inviteRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/invites`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invites: teamInvites }),
                });
                if (!inviteRes.ok) console.error("Some invitations failed to send.");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] grid-bg flex items-center justify-center p-6 text-white selection:bg-brand-accent selection:text-white">
            <div className="max-w-3xl w-full">
                {/* Progress System */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-medium border-2 transition-all ${step >= s ? 'border-brand-accent bg-brand-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 text-slate-500 bg-white/5'}`}>
                                {step > s ? <CheckCircle2 size={18} /> : s}
                            </div>
                        ))}
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Step {step} of 4: {
                        step === 1 ? 'Corporate Identity' :
                            step === 2 ? 'Operating Context' :
                                step === 3 ? 'AI & Branding' : 'Team Setup'
                    }</p>
                </div>

                <div className="glass p-10 md:p-14 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-8 text-center animate-in fade-in zoom-in duration-300">
                                {error}
                            </div>
                        )}

                        {/* STEP 1: IDENTITY */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <h1 className="text-3xl font-display font-medium text-glow mb-3">Establish your Backbone</h1>
                                    <p className="text-slate-400">These details will serve as the foundation for your hiring portal.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1 flex items-center gap-2">
                                            <Users size={16} className="text-brand-accent" /> Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Acme Corp"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1 flex items-center gap-2">
                                            <Globe size={16} className="text-brand-accent" /> Company Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website_url}
                                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                            placeholder="https://company.com"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1 flex items-center gap-2">
                                            <Info size={16} className="text-brand-accent" /> About the Company
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Briefly describe what your company does..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <button onClick={handleNext} className="w-full bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple mt-6">Continue</button>
                            </div>
                        )}

                        {/* STEP 2: CONTEXT */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <h1 className="text-3xl font-display font-medium text-white mb-3">Operating Context</h1>
                                    <p className="text-slate-400">Define your scale and business environment.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1 flex items-center gap-2">
                                            <MapPin size={16} className="text-brand-accent" /> HQ Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.hq_location}
                                            onChange={(e) => setFormData({ ...formData, hq_location: e.target.value })}
                                            placeholder="e.g. San Francisco, US"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1 flex items-center gap-2">
                                            <Users size={16} className="text-brand-accent" /> Company Size
                                        </label>
                                        <select
                                            value={formData.company_size}
                                            onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent appearance-none transition-all"
                                        >
                                            <option value="" disabled>Select size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="200+">200+ employees</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Industry</label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent appearance-none transition-all"
                                    >
                                        <option value="" disabled>Select industry</option>
                                        <option value="SaaS & Technology">SaaS & Technology</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance & Fintech">Finance & Fintech</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Web3 & Crypto">Web3 & Crypto</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button onClick={handleBack} className="w-1/3 bg-white/5 border border-white/10 text-slate-400 py-4 rounded-xl font-medium hover:bg-white/10 transition-all">Back</button>
                                    <button onClick={handleNext} className="w-2/3 bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple">Next Step</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: BRANDING */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <h1 className="text-3xl font-display font-medium text-white mb-3">AI & Branding</h1>
                                    <p className="text-slate-400">How should HRX represent you?</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 text-center border-2 border-dashed border-white/10 p-6 rounded-2xl bg-black/40">
                                            <Upload size={24} className="mx-auto text-slate-500" />
                                            <p className="text-xs text-slate-500">Logo Upload</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500 ml-1">Primary Color</p>
                                            <div className="flex gap-2">
                                                <input type="color" value={formData.brand_color} onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })} className="h-16 w-16 bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer" />
                                                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-xl bg-black/40 text-xs font-mono">{formData.brand_color.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-4 ml-1 flex items-center gap-2">
                                            <Sparkles size={16} className="text-brand-accent" /> Recruitment Tone
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['professional', 'bold'].map((t) => (
                                                <div
                                                    key={t}
                                                    onClick={() => setFormData({ ...formData, recruitment_tone: t })}
                                                    className={`p-4 rounded-xl border capitalize cursor-pointer transition-all ${formData.recruitment_tone === t ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                                >
                                                    {t}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-10">
                                    <button onClick={handleBack} className="w-1/3 bg-white/5 border border-white/10 text-slate-400 py-4 rounded-xl font-medium hover:bg-white/10 transition-all">Back</button>
                                    <button onClick={handleNext} className="w-2/3 bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple">Confirm Branding</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: TEAM SETUP */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <h1 className="text-3xl font-display font-medium text-white mb-3">Invite your Team</h1>
                                    <p className="text-slate-400">Add your collaborators and assign their permissions.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="colleague@company.com"
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-accent transition-all"
                                        />
                                        <select
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            className="w-40 bg-black/40 border border-white/10 rounded-xl px-4 text-slate-300 focus:outline-none focus:border-brand-accent appearance-none capitalize"
                                        >
                                            <option value="recruiter">Recruiter</option>
                                            <option value="hiring_manager">Hiring Manager</option>
                                            <option value="interviewer">Interviewer</option>
                                        </select>
                                        <button onClick={addInvite} className="bg-white/5 border border-white/10 hover:bg-white/10 p-3.5 rounded-xl transition-all">
                                            <UserPlus size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {teamInvites.map((invite) => (
                                            <div key={invite.email} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group animate-in slide-in-from-right-4">
                                                <div>
                                                    <p className="text-sm font-medium">{invite.email}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{invite.role.replace('_', ' ')}</p>
                                                </div>
                                                <button onClick={() => removeInvite(invite.email)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {teamInvites.length === 0 && (
                                            <div className="text-center py-8 border border-dashed border-white/5 rounded-xl text-slate-600 italic text-sm">
                                                No team members added yet. You can also add them later from settings.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-10">
                                    <button onClick={handleBack} className="w-1/3 bg-white/5 border border-white/10 text-slate-400 py-4 rounded-xl font-medium hover:bg-white/10 transition-all">Back</button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-2/3 bg-brand-accent text-white py-4 rounded-xl font-medium hover:brightness-110 transition-all glow-purple flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <>Finish Setup <Sparkles size={18} /></>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
