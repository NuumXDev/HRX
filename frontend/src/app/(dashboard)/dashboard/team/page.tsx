"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Mail, Shield, Clock, MoreVertical, CheckCircle2, Trash2, UserCog, X } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TeamPage() {
    const { data: session } = useSession();
    const [team, setTeam] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("recruiter");
    const [inviting, setInviting] = useState(false);
    const [invited, setInvited] = useState(false);

    // Member Management State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [newRole, setNewRole] = useState("");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const orgId = (session?.user as any)?.org_id;
    const sessionRole = (session?.user as any)?.role;
    const isSuperAdmin = sessionRole === "super_admin";

    useEffect(() => {
        if (orgId) {
            fetchTeam();
        }
    }, [orgId]);

    const fetchTeam = async () => {
        try {
            const [usersRes, invitesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/users`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/invites`)
            ]);

            if (usersRes.ok) setTeam(await usersRes.json());
            if (invitesRes.ok) setInvites(await invitesRes.json());
        } catch (error) {
            console.error("Failed to fetch team data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/invites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invites: [{ email: inviteEmail, role: inviteRole }]
                })
            });

            if (res.ok) {
                setInvited(true);
                setInviteEmail("");
                await fetchTeam(); // Refresh the list
                setTimeout(() => {
                    setInvited(false);
                    setShowInviteModal(false);
                }, 1500);
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to send invitation. Please try again.");
            }
        } catch (error) {
            console.error("Invitation failed:", error);
            alert("Network error. Please check if the backend is running.");
        } finally {
            setInviting(false);
        }
    };

    const handleRevoke = async (inviteId: string) => {
        if (!confirm("Are you sure you want to revoke this invitation?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/invites/${inviteId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchTeam();
            } else {
                alert("Failed to revoke invitation.");
            }
        } catch (error) {
            console.error("Revoke failed:", error);
            alert("Network error.");
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedMember) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/users/${selectedMember.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setShowRoleModal(false);
                setSelectedMember(null);
                await fetchTeam();
            } else {
                alert("Failed to update role.");
            }
        } catch (error) {
            console.error("Update role failed:", error);
            alert("Network error.");
        }
    };

    const handleRemoveMember = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/organizations/${orgId}/users/${userId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchTeam();
            } else {
                alert("Failed to remove member.");
            }
        } catch (error) {
            console.error("Remove member failed:", error);
            alert("Network error.");
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading team...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-glow mb-2">Team Management</h1>
                    <p className="text-slate-500">Manage your organization's members and their access roles.</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-brand-accent text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 glow-purple hover:brightness-110"
                >
                    <UserPlus size={20} /> Invite Member
                </button>
            </div>

            <div className="grid gap-6">
                {/* Active Members */}
                <div className="bg-black/40 border border-white/5 rounded-2xl">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShieldCheck size={20} className="text-brand-accent" />
                            Active Members
                        </h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {team.map((member) => (
                            <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-accent/20 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{member.full_name}</h3>
                                        <p className="text-slate-500 text-sm">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Active</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                        <Shield size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                            {member.role.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {isSuperAdmin && member.id !== (session?.user as any)?.id && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                                                className="text-slate-500 hover:text-white transition-colors p-1"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {activeMenuId === member.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setNewRole(member.role);
                                                            setShowRoleModal(true);
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"
                                                    >
                                                        <UserCog size={16} /> Change Role
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleRemoveMember(member.id, member.full_name);
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/5 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} /> Remove Member
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Invites */}
                {(invites.filter(i => i.status === 'pending').length > 0) && (
                    <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Mail size={20} className="text-amber-500" />
                                Pending Invitations
                            </h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {invites.filter(i => i.status === 'pending').map((invite) => (
                                <div key={invite.id} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <Mail size={24} className="text-amber-500/50" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{invite.email}</h3>
                                            <p className="text-slate-500 text-sm flex items-center gap-1">
                                                <Clock size={12} /> Status: <span className="text-amber-500 font-bold uppercase text-[10px] tracking-widest">{invite.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/invite/${invite.token}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Invite link copied to clipboard!");
                                            }}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                                        >
                                            Copy Link
                                        </button>
                                        <div className="flex items-center gap-6">
                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-500/80 bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/10">
                                                Role: {invite.role}
                                            </span>
                                            <button
                                                onClick={() => handleRevoke(invite.id)}
                                                className="text-red-500/70 hover:text-red-400 text-xs font-medium transition-colors"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">Invite Collaborator</h2>
                        <p className="text-slate-400 mb-8">Send an invitation to join your hiring team.</p>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Access Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all appearance-none"
                                >
                                    <option value="recruiter">Recruiter (Full Access)</option>
                                    <option value="hiring_manager">Hiring Manager</option>
                                    <option value="interviewer">Interviewer (Review Only)</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-6 py-3 border border-white/10 rounded-xl text-white font-medium hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting || invited}
                                    className="flex-1 bg-brand-accent text-white px-6 py-3 rounded-xl font-bold transition-all glow-purple hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {inviting ? "Sending..." : invited ? <><CheckCircle2 size={20} /> Invited</> : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role Update Modal */}
            {showRoleModal && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Change Role</h2>
                                <p className="text-sm text-slate-400">Updating role for {selectedMember.full_name}</p>
                            </div>
                            <button onClick={() => setShowRoleModal(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Select New Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-all appearance-none"
                                >
                                    <option value="super_admin">Super Admin (Full Access)</option>
                                    <option value="recruiter">Recruiter</option>
                                    <option value="hiring_manager">Hiring Manager</option>
                                    <option value="interviewer">Interviewer</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    className="flex-1 px-6 py-3 border border-white/10 rounded-xl text-white font-medium hover:bg-white/5 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateRole}
                                    className="flex-1 bg-brand-accent text-white px-6 py-3 rounded-xl font-bold transition-all glow-purple hover:brightness-110 text-sm"
                                >
                                    Save Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
