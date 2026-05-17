import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
    return (
        <section className="section-padding text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="text-6xl md:text-7xl mb-10 leading-tight text-white text-glow">
                    Ready to build your <br />
                    <span className="text-brand-accent italic">dream team?</span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/register" className="bg-brand-accent text-white px-10 py-5 rounded-full text-xl font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2 group glow-purple">
                        Start Free Trial
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/demo" className="bg-white/5 border border-white/10 text-center text-white px-10 py-5 rounded-full text-xl font-medium hover:bg-white/10 transition-all backdrop-blur-sm">
                        Book a Demo
                    </Link>
                </div>
                <p className="mt-8 text-slate-500 text-sm">
                    Join leading companies upgrading their hiring stack with HRX.
                </p>
            </div>
        </section>
    );
};
