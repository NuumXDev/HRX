import { CheckCircle2, Zap, ShieldCheck, Users, FileText } from 'lucide-react';

export const Problem = () => {
    return (
        <section id="features" className="section-padding bg-brand-surface relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-4xl md:text-5xl mb-8 text-white">
                    Hiring is broken because your <span className="text-brand-accent italic">tools are relics.</span>
                </h2>
                <p className="text-xl md:text-2xl text-slate-400 leading-relaxed">
                    Resumes in email, status updates in spreadsheets, interviews scheduled manually. Most companies run hiring across a mess of disconnected tools. HRX replaces all of that with a unified intelligence layer.
                </p>
            </div>
        </section>
    );
};

export const Solution = () => {
    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <div>
                        <h2 className="text-5xl md:text-6xl mb-8 leading-tight text-white">
                            Not just an ATS. <br />
                            <span className="text-brand-accent italic">A neural network for HR.</span>
                        </h2>
                        <p className="text-xl text-slate-400 leading-relaxed mb-8">
                            HRX doesn't just store data. It thinks, adapts, and acts. Every step of the hiring process is handled by AI—but every AI decision is transparent, explainable, and overridable by your team.
                        </p>
                        <div className="space-y-6">
                            {[
                                "AI that explains its reasoning in detail",
                                "Human-in-the-loop control at every stage",
                                "Built to scale up your top-of-funnel capacity"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent border border-brand-accent/30">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <span className="font-medium text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 mt-12">
                            <div className="aspect-[4/5] bg-brand-surface rounded-3xl border border-white/5 p-6 flex flex-col justify-end group hover:border-brand-accent/50 transition-colors">
                                <Zap className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-2xl mb-2 text-white">Speed</h3>
                                <p className="text-sm text-slate-500">Reduce time-to-hire by 60% with automated screening.</p>
                            </div>
                            <div className="aspect-square bg-brand-accent text-white rounded-3xl p-6 flex flex-col justify-end glow-purple">
                                <ShieldCheck className="mb-4" size={32} />
                                <h3 className="text-2xl mb-2">Trust</h3>
                                <p className="text-sm text-white/80">Explainable AI decisions you can actually rely on.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="aspect-square bg-brand-surface rounded-3xl border border-white/5 p-6 flex flex-col justify-end group hover:border-brand-success/50 transition-colors">
                                <Users className="text-brand-success mb-4 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-2xl mb-2 text-white">Scale</h3>
                                <p className="text-sm text-slate-500">Process thousands of inbound applications seamlessly.</p>
                            </div>
                            <div className="aspect-[4/5] bg-brand-surface rounded-3xl border border-white/5 p-6 flex flex-col justify-end group hover:border-brand-accent/50 transition-colors">
                                <FileText className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-2xl mb-2 text-white">Unified</h3>
                                <p className="text-sm text-slate-500">One connected B2B platform from JD to Day 1.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
