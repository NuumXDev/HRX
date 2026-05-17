"use client";

import { useEffect, useState } from "react";
import { Settings, Building2, Palette, Globe, MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orgData, setOrgData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        website_url: "",
        hq_location: "",
        industry: "",
        brand_color: "#8b5cf6",
        recruitment_tone: "professional"
    });

    const orgId = (session?.user as any)?.org_id;
    const role = (session?.user as any)?.role;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && role !== "super_admin") {
            router.push("/dashboard");
        }
    }, [status, role, router]);

    useEffect(() => {
        if (orgId) {
            fetchOrg();
        }
    }, [orgId]);

    const fetchOrg = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setOrgData(data);
                const brand = JSON.parse(data.brand_colors || '{"primary": "#8b5cf6"}');
                const rec = JSON.parse(data.recruitment_settings || '{"tone": "professional"}');
                setFormData({
                    name: data.name,
                    website_url: data.website_url || "",
                    hq_location: data.hq_location || "",
                    industry: data.industry || "",
                    brand_color: brand.primary,
                    recruitment_tone: rec.tone
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/organizations/${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-glow mb-2">Settings</h1>
                    <p className="text-slate-500">Manage your organization's identity and platform preferences.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="text-brand-accent" size={20} />
                            <h2 className="text-xl font-bold text-white">General Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Organization Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        value={formData.website_url}
                                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all"
                                        placeholder="https://"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">HQ Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        value={formData.hq_location}
                                        onChange={(e) => setFormData({ ...formData, hq_location: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Industry</label>
                                <input
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-brand-accent" size={20} />
                            <h2 className="text-xl font-bold text-white">AI & Recruitment Tone</h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 max-w-lg">
                                This setting influences how Gemini generates your Job Descriptions and candidate emails.
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                {["professional", "creative", "casual"].map((tone) => (
                                    <button
                                        key={tone}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, recruitment_tone: tone })}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${formData.recruitment_tone === tone
                                            ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                                            }`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="text-brand-accent" size={20} />
                            <h2 className="text-lg font-bold text-white">Branding</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-400">Primary Brand Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.brand_color}
                                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                                    className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.brand_color}
                                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                />
                            </div>
                            <div
                                className="h-24 w-full rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter"
                                style={{ backgroundColor: formData.brand_color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                            >
                                Preview Color
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? "Saving Changes..." : saved ? <><CheckCircle2 size={18} /> Settings Saved</> : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}
