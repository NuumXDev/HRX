"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Cpu, Loader2 } from "lucide-react";
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        company_name: "",
        admin_name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create the company and user via FastAPI
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Registration failed");
            }

            const authRes = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (!authRes || authRes.error) {
                throw new Error("Login failed after registration. Please try logging in manually.");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-6 py-20 selection:bg-brand-accent selection:text-white">
            <div className="max-w-xl w-full glass p-10 sm:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">

                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <Link href="/" className="w-12 h-12 bg-brand-accent rounded-xl flex items-center justify-center glow-purple transition-transform hover:scale-105">
                            <Cpu className="text-white" size={24} />
                        </Link>
                    </div>

                    <h1 className="text-3xl font-display font-medium text-white mb-2 text-center text-glow">Start your Free Trial</h1>
                    <p className="text-slate-400 text-center mb-8">Create your company workspace and start hiring faster.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Your Full Name</label>
                                <input
                                    type="text"
                                    name="admin_name"
                                    required
                                    value={formData.admin_name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                    placeholder="Jane Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Work Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                placeholder="jane@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-slate-500 mt-2 ml-1">Must be at least 8 characters long.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent text-white py-3.5 rounded-xl font-medium hover:brightness-110 transition-all glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-8">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-brand-accent hover:text-white transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
