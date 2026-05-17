import { motion } from 'motion/react';
import { Search, MessageSquare, UserCheck, Zap, ChevronRight } from 'lucide-react';

export const HowItWorks = () => {
    const steps = [
        {
            title: "Smart Resume Screening",
            desc: "HRX reads every resume and scores candidates against your custom rubric. You get a ranked list with AI-written summaries explaining every score.",
            icon: <Search className="text-brand-accent" />,
            tag: "Stage 01"
        },
        {
            title: "Conversational AI Interview",
            desc: "Shortlisted candidates enter a live, adaptive text chat. The AI probes gaps, explores contradictions, and records everything for your review.",
            icon: <MessageSquare className="text-brand-accent" />,
            tag: "Stage 02"
        },
        {
            title: "Human Interview Round",
            desc: "We prepare a detailed briefing for your human interviewers—suggested questions, red flags, and a summary of prior stages.",
            icon: <UserCheck className="text-brand-accent" />,
            tag: "Stage 03"
        },
        {
            title: "Offer & Onboarding",
            desc: "HRX auto-drafts the offer and manages the e-signature. Once accepted, onboarding begins automatically.",
            icon: <Zap className="text-brand-accent" />,
            tag: "Stage 04"
        }
    ];

    return (
        <section id="how-it-works" className="section-padding bg-brand-bg relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-6xl mb-6 text-white text-glow">Your New Hiring Workflow</h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        A seamless, intelligent, 4-stage flow designed to operate on autopilot until your judgment is required.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="p-8 bg-brand-surface rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-brand-accent/30 transition-all"
                        >
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 flex justify-between items-center">
                                <span>{step.tag}</span>
                                <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                                    {step.icon}
                                </div>
                            </div>
                            <h3 className="text-2xl mb-4 leading-tight text-white">{step.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {step.desc}
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-brand-accent font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                Discover {step.tag} <ChevronRight size={16} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
