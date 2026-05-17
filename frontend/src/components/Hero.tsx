import { motion } from 'motion/react';
import { ArrowRight, Activity, MessageSquare, UserCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export const Hero = () => {
    return (
        <section id="hero" className="relative pt-40 pb-20 overflow-hidden grid-bg">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-bg/50 to-brand-bg pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-bold uppercase tracking-widest mb-6 border border-brand-accent/30">
                        <Zap size={14} />
                        AI-Native Hiring Engine
                    </div>
                    <h1 className="text-6xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] text-white text-glow">
                        Automate <span className="text-brand-accent italic">your hiring.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                        Replace point solutions with a single intelligent platform. Screen resumes, conduct AI interviews, and send offers. Automatically.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/auth/register" className="bg-brand-accent text-white px-8 py-4 rounded-full text-lg font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2 group glow-purple">
                            Start Free Trial
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/demo" className="bg-white/5 border border-white/10 text-center text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all backdrop-blur-sm">
                            Book a Demo
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative"
                >
                    <div className="aspect-square bg-brand-accent/10 rounded-[40px] relative overflow-hidden border border-brand-accent/20 glow-purple">
                        {/* Abstract UI Mockup */}
                        <div className="absolute inset-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center">
                                        <Activity className="text-brand-accent" size={20} />
                                    </div>
                                    <div>
                                        <div className="h-3 w-32 bg-slate-700 rounded mb-1" />
                                        <div className="h-2 w-20 bg-slate-800 rounded" />
                                    </div>
                                </div>
                                <div className="px-3 py-1 text-right">
                                    <div className="text-xs text-slate-400">Time-to-hire</div>
                                    <div className="text-sm font-bold text-brand-success glow-green">
                                        - 60%
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 italic text-sm text-slate-400">
                                    "Candidate Jay Patel matches your criteria with 92% confidence. Evaluated on system design, frontend architecture, and core CS fundamentals. Ready for human review."
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {[85, 92, 88, 95].map((width, i) => (
                                        <div key={i} className="h-16 bg-slate-800/30 rounded-lg border border-white/5 flex items-center px-4">
                                            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-accent" style={{ width: `${width}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-2">
                                <div className="flex-1 h-10 bg-brand-success rounded-lg glow-green flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                                    Advance to Offer
                                </div>
                                <div className="w-10 h-10 border border-white/10 rounded-lg bg-slate-800" />
                            </div>
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="absolute top-1/4 -right-4 bg-brand-accent text-white p-4 rounded-2xl shadow-xl z-10 glow-purple"
                        >
                            <MessageSquare size={20} />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                            className="absolute bottom-1/4 -left-4 bg-brand-success text-white p-4 rounded-2xl shadow-xl z-10 glow-green"
                        >
                            <UserCheck size={20} />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
