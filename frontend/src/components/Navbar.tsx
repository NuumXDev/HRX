import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Menu, X } from 'lucide-react';
import Link from 'next/link';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/#hero" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center glow-purple group-hover:scale-110 transition-transform">
                        <Cpu className="text-white" size={18} />
                    </div>
                    <span className="text-2xl font-display font-bold tracking-tighter text-white text-glow">HRX</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <Link href="/#features" className="text-slate-400 hover:text-brand-accent transition-colors">Features</Link>
                    <Link href="/#how-it-works" className="text-slate-400 hover:text-brand-accent transition-colors">How it works</Link>
                    <Link href="/auth/login" className="text-slate-400 hover:text-brand-accent transition-colors">Log in</Link>
                    <Link href="/demo" className="bg-brand-accent text-white px-6 py-2.5 rounded-full hover:brightness-110 transition-all glow-purple">
                        Book a Demo
                    </Link>
                </div>

                <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden absolute top-20 left-0 right-0 bg-brand-surface border-b border-white/5 p-6 flex flex-col gap-4 shadow-2xl"
                >
                    <Link href="/#features" onClick={() => setIsOpen(false)} className="text-lg font-display text-white">Features</Link>
                    <Link href="/#how-it-works" onClick={() => setIsOpen(false)} className="text-lg font-display text-white">How it works</Link>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)} className="text-left text-lg font-display text-slate-400">Log in</Link>
                    <Link href="/demo" onClick={() => setIsOpen(false)} className="bg-brand-accent text-white px-6 py-3 rounded-full w-full text-center glow-purple">
                        Book a Demo
                    </Link>
                </motion.div>
            )}
        </nav>
    );
};
