"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Settings,
    LogOut,
    BarChart3,
    ShieldCheck,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (status === "unauthenticated") {
        router.push("/auth/login");
        return null;
    }

    const role = (session?.user as any)?.role || "recruiter";

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "recruiter", "hiring_manager"] },
        { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, roles: ["super_admin", "recruiter", "hiring_manager"] },
        { name: "Candidates", href: "/dashboard/candidates", icon: Users, roles: ["super_admin", "recruiter", "hiring_manager", "interviewer"] },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["super_admin", "recruiter"] },
        { name: "Team", href: "/dashboard/team", icon: ShieldCheck, roles: ["super_admin"] },
        { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["super_admin"] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(role));

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } border-r border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 flex flex-col z-50`}
            >
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center glow-purple">
                                <span className="font-bold text-sm">H</span>
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight">HRX</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center glow-purple mx-auto">
                            <span className="font-bold text-sm">H</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {filteredNav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isActive
                                    ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? "text-brand-accent" : "group-hover:text-white"} />
                                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                                {isSidebarOpen && isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-3 p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Sign Out</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 className="text-sm font-medium text-slate-400 capitalize">
                            {pathname.split('/').pop() === 'dashboard' ? 'Overview' : pathname.split('/').pop()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-white">{session?.user?.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{role.replace('_', ' ')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            <Users size={18} className="text-slate-400" />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
