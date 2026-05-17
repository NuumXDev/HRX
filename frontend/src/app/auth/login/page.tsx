"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Cpu, Loader2 } from "lucide-react";
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (!res || res.error) {
                setError("Invalid email or password");
                setLoading(false);
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Login failure:", err);
            setError("A network error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-6 selection:bg-brand-accent selection:text-white">
            <div className="max-w-md w-full glass p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">

                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <Link href="/" className="w-12 h-12 bg-brand-accent rounded-xl flex items-center justify-center glow-purple transition-transform hover:scale-105">
                            <Cpu className="text-white" size={24} />
                        </Link>
                    </div>

                    <h1 className="text-3xl font-display font-medium text-white mb-2 text-center text-glow">Welcome Back</h1>
                    <p className="text-slate-400 text-center mb-8">Sign in to your HRX dashboard</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Work Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent text-white py-3.5 rounded-xl font-medium hover:brightness-110 transition-all glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-8">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="text-brand-accent hover:text-white transition-colors">
                            Start your free trial
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
