import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: string;
    icon: LucideIcon;
    color: string;
}

export function MetricCard({ title, value, trend, icon: Icon, color }: MetricCardProps) {
    return (
        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-${color}/20 transition-all`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-2 bg-${color}/10 rounded-lg text-${color}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-display font-bold text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
}
