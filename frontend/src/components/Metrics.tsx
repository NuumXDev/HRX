export const Metrics = () => {
    return (
        <section className="py-20 border-y border-white/5 bg-brand-surface/30">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-12">
                    Trusted by forward-thinking engineering teams
                </p>
                <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale brightness-200">
                    {['NUUMX', 'VELOCITY', 'ORBIT', 'LUMINA', 'AXIS'].map(name => (
                        <span key={name} className="text-2xl font-display font-bold tracking-tighter text-white">{name}</span>
                    ))}
                </div>
            </div>
        </section>
    );
};
