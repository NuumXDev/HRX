"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Building2, Shield, UserPlus, Loader2 } from "lucide-react";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [inviteData, setInviteData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (token) {
            verifyToken();
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/auth/verify-invite/${token}`);
            if (res.ok) {
                setInviteData(await res.json());
            } else {
                setError("This invitation is invalid or has expired.");
            }
        } catch (err) {
            setError("Failed to verify invitation. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoining(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/auth/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email: inviteData.email,
                    password: password,
                    token: token
                })
            });

            if (res.ok) {
                // Success - Redirect to login
                router.push("/auth/login?joined=true");
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to join team.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="text-brand-accent animate-spin mb-4" size={40} />
                <p className="text-slate-400 font-display">Verifying your invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center max-w-md w-full">
                    <XCircle className="text-red-500 mx-auto mb-6" size={60} />
                    <h1 className="text-2xl font-bold text-white mb-2">Invitation Error</h1>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-accent/10 via-slate-950 to-slate-950">
            <div className="w-full max-w-lg">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-sm font-bold mb-6">
                        <UserPlus size={16} /> YOU'VE BEEN INVITED
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white mb-4">
                        Join <span className="text-glow">{inviteData.org_name}</span>
                    </h1>
                    <p className="text-slate-400">
                        You've been invited to join the hiring team as a <span className="text-white font-bold">{inviteData.role.replace('_', ' ')}</span>.
                    </p>
                </div>

                <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                            <input
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
                            <input
                                disabled
                                value={inviteData.email}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">Set Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a secure password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-accent transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={joining}
                            className="w-full bg-brand-accent text-white py-5 rounded-2xl font-bold text-lg glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {joining ? "Joining..." : "Accept & Create Account"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
