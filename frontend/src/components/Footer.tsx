import { Cpu } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-12 px-6 border-t border-white/5 bg-brand-bg">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-accent rounded flex items-center justify-center glow-purple">
                        <Cpu className="text-white" size={14} />
                    </div>
                    <span className="text-xl font-display font-bold tracking-tighter text-white">HRX</span>
                </div>

                <div className="flex gap-8 text-sm text-slate-500">
                    <a href="#" className="hover:text-brand-accent transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-brand-accent transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-brand-accent transition-colors">Contact</a>
                </div>

                <div className="text-sm text-slate-600">
                    © 2026 HRX AI. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
