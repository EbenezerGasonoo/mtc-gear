import React, { useEffect, useState } from 'react';
import {
    Boxes,
    FileSpreadsheet,
    Clock,
    ChevronRight,
    TrendingUp,
    Sparkles,
    AlertOctagon
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardView({ onNavigate, onNewRequest }) {
    const { user, canManageEquipment } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#386642]"></div>
            </div>
        );
    }

    const inv = stats?.inventory || {};
    const alerts = stats?.alerts || {};

    return (
        <div className="space-y-8 font-sans">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D2729] via-[#162224] to-[#121A1C] border border-[#386642]/40 p-6 sm:p-8 shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#386642]/20 border border-[#386642]/40 text-[#FFEBCC] text-xs font-semibold mb-3">
                            <Sparkles size={14} className="text-[#FFEBCC]" />
                            <span>Mountain Top Communications Production Ops</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide font-sans">
                            Welcome, {user?.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#CADEDF]/80 mt-1 max-w-xl leading-relaxed">
                            Real-time equipment tracking, deployment schedules, inspection protocols, and custody logs.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('inventory')}
                            className="px-4 py-2.5 rounded-xl bg-[#162224] hover:bg-[#243336] text-[#CADEDF] border border-[#2D4044] text-xs font-bold transition"
                        >
                            Browse Vault
                        </button>
                        {user?.role !== 'viewer' && (
                            <button
                                onClick={onNewRequest}
                                className="px-5 py-2.5 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] text-xs font-bold shadow-lg shadow-[#386642]/20 transition"
                            >
                                + Request Equipment
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Critical Operational Alerts */}
            {(alerts.overdue_count > 0 || alerts.damaged_count > 0 || alerts.pending_approvals_count > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.overdue_count > 0 && (
                        <div
                            onClick={() => onNavigate('checkouts')}
                            className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-950/60 transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-black">
                                    <Clock size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-red-200">
                                        {alerts.overdue_count} Overdue {alerts.overdue_count === 1 ? 'Item' : 'Items'}
                                    </div>
                                    <div className="text-[11px] text-red-300/80">Action required immediately</div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-red-400 group-hover:translate-x-1 transition" />
                        </div>
                    )}

                    {alerts.pending_approvals_count > 0 && canManageEquipment && (
                        <div
                            onClick={() => onNavigate('requests')}
                            className="bg-[#1D2729] border border-[#386642]/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#243336] transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#386642]/20 flex items-center justify-center text-[#FFEBCC] font-black">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#FFEBCC]">
                                        {alerts.pending_approvals_count} Pending Review
                                    </div>
                                    <div className="text-[11px] text-[#CADEDF]/80">Equipment requests awaiting sign-off</div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[#FFEBCC] group-hover:translate-x-1 transition" />
                        </div>
                    )}

                    {alerts.damaged_count > 0 && (
                        <div
                            onClick={() => onNavigate('incidents')}
                            className="bg-orange-950/40 border border-orange-500/40 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-950/60 transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-black">
                                    <AlertOctagon size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-orange-200">
                                        {alerts.damaged_count} Damaged Assets
                                    </div>
                                    <div className="text-[11px] text-orange-300/80">Pending repair inspection</div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-orange-400 group-hover:translate-x-1 transition" />
                        </div>
                    )}
                </div>
            )}

            {/* Inventory Overview Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#CADEDF]">
                        Equipment Inventory Status
                    </h3>
                    <button
                        onClick={() => onNavigate('inventory')}
                        className="text-xs text-[#FFEBCC] hover:underline font-semibold"
                    >
                        View Full Inventory →
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-[#829FA1] tracking-wider">Total</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">{inv.total || 0}</div>
                        <div className="text-[10px] text-[#829FA1] mt-1 font-medium">Vault Assets</div>
                    </div>

                    <div className="bg-[#1D2729] border border-[#386642]/50 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-[#A7F3D0] tracking-wider">Available</div>
                        <div className="text-2xl font-black text-[#A7F3D0] font-mono mt-1">{inv.available || 0}</div>
                        <div className="text-[10px] text-[#A7F3D0]/80 mt-1 font-medium">Ready for deployment</div>
                    </div>

                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-[#CADEDF] tracking-wider">Checked Out</div>
                        <div className="text-2xl font-black text-[#CADEDF] font-mono mt-1">{inv.checked_out || 0}</div>
                        <div className="text-[10px] text-[#CADEDF]/80 mt-1 font-medium">Active in field</div>
                    </div>

                    <div className="bg-[#1D2729] border border-[#FFEBCC]/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-[#FFEBCC] tracking-wider">Reserved</div>
                        <div className="text-2xl font-black text-[#FFEBCC] font-mono mt-1">{inv.reserved || 0}</div>
                        <div className="text-[10px] text-[#FFEBCC]/80 mt-1 font-medium">Upcoming bookings</div>
                    </div>

                    <div className="bg-[#1D2729] border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Maintenance</div>
                        <div className="text-2xl font-black text-amber-400 font-mono mt-1">{inv.maintenance || 0}</div>
                        <div className="text-[10px] text-amber-400/80 mt-1 font-medium">In servicing</div>
                    </div>

                    <div className="bg-[#1D2729] border border-red-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Damaged</div>
                        <div className="text-2xl font-black text-red-400 font-mono mt-1">{inv.damaged || 0}</div>
                        <div className="text-[10px] text-red-400/80 mt-1 font-medium">Flagged incident</div>
                    </div>

                    <div className="bg-[#1D2729] border border-rose-900/50 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Lost</div>
                        <div className="text-2xl font-black text-rose-400 font-mono mt-1">{inv.lost || 0}</div>
                        <div className="text-[10px] text-rose-400/80 mt-1 font-medium">Unrecovered</div>
                    </div>

                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-[#829FA1] tracking-wider">Retired</div>
                        <div className="text-2xl font-black text-[#829FA1] font-mono mt-1">{inv.retired || 0}</div>
                        <div className="text-[10px] text-[#829FA1] mt-1 font-medium">Decommissioned</div>
                    </div>
                </div>
            </div>

            {/* Split Row: Upcoming Returns & Recent System Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Returns */}
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-lg flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2D4044]">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                            <Clock size={16} className="text-[#FFEBCC]" />
                            Upcoming & Overdue Returns
                        </div>
                        <button
                            onClick={() => onNavigate('checkouts')}
                            className="text-xs text-[#FFEBCC] hover:underline font-semibold"
                        >
                            View All →
                        </button>
                    </div>

                    <div className="space-y-3 flex-1">
                        {stats?.upcoming_returns?.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-xs text-[#829FA1]">
                                No active deployments scheduled for return.
                            </div>
                        ) : (
                            stats?.upcoming_returns?.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onNavigate(`checkouts`)}
                                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                        item.is_overdue
                                            ? 'bg-red-950/20 border-red-500/40 hover:bg-red-950/40'
                                            : 'bg-[#162224] border-[#2D4044] hover:bg-[#243336]'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{item.project}</span>
                                            <span className="text-[11px] text-[#829FA1] font-medium">
                                                • {item.borrower}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[#CADEDF]/80 truncate max-w-sm">
                                            {item.items_summary}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                                                item.is_overdue
                                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                                    : 'bg-[#1D2729] text-[#CADEDF] border border-[#2D4044]'
                                            }`}
                                        >
                                            {item.days_remaining_text}
                                        </span>
                                        <div className="text-[10px] text-[#829FA1] font-mono mt-1">
                                            {item.expected_return_date}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent System Activity Stream */}
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-lg flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2D4044]">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                            <TrendingUp size={16} className="text-[#386642]" />
                            Recent System Activity & Audit
                        </div>
                        {canManageEquipment && (
                            <button
                                onClick={() => onNavigate('audit-logs')}
                                className="text-xs text-[#FFEBCC] hover:underline font-semibold"
                            >
                                Audit Logs →
                            </button>
                        )}
                    </div>

                    <div className="space-y-2.5 flex-1 max-h-[360px] overflow-y-auto pr-1">
                        {stats?.recent_activity?.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-xs text-[#829FA1]">
                                No recent activity recorded.
                            </div>
                        ) : (
                            stats?.recent_activity?.map((act) => (
                                <div
                                    key={act.id}
                                    className="p-3 rounded-xl bg-[#162224] border border-[#2D4044] flex items-start justify-between gap-3 text-xs"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-200">
                                            <span className="text-[#FFEBCC] font-bold">{act.user_name}</span>{' '}
                                            <span className="text-[#829FA1] font-normal">performed</span>{' '}
                                            <span className="font-mono text-white uppercase tracking-wider text-[11px] bg-[#1D2729] px-1.5 py-0.5 rounded border border-[#2D4044]">
                                                {act.action.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-[#829FA1] mt-1">
                                            Entity: <span className="font-mono text-[#CADEDF]">{act.entity_type}</span>{' '}
                                            {act.entity_id && `#${act.entity_id}`}
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-[#829FA1] font-mono shrink-0">
                                        {act.time_ago}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
