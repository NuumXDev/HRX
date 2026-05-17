import { MessageSquare, ShieldCheck, Users } from 'lucide-react';

export const ValueProps = () => {
    const props = [
        {
            title: "Not a form — a conversation.",
            desc: "The AI interview isn't a static test. It's an adaptive conversation that responds to candidate answers just like a human engineer would. No two interviews are the same.",
            icon: <MessageSquare />
        },
        {
            title: "AI that explains itself.",
            desc: "Every score, every shortlist, every rejection comes with a plain-English explanation. No black box. You retain ultimate control and visibility over every decision.",
            icon: <ShieldCheck />
        },
        {
            title: "Built for human teams.",
            desc: "The AI handles the volume, speed, and consistency of the top-of-funnel. You handle the judgment, nuance, and relationship building. HRX keeps the human in HR.",
            icon: <Users />
        }
    ];

    return (
        <section id="features-detail" className="section-padding">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-12">
                    {props.map((prop, i) => (
                        <div key={i} className="flex flex-col gap-6 p-8 rounded-3xl bg-brand-surface border border-white/5 hover:border-brand-accent/30 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-brand-accent text-white flex items-center justify-center glow-purple">
                                {prop.icon}
                            </div>
                            <h3 className="text-3xl leading-tight text-white">{prop.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {prop.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
