import React, { useEffect, useState } from 'react';
import { History, Search, Shield, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function AuditLogsView() {
    const { showToast } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/audit-logs', {
                params: {
                    page: p,
                    search: search || undefined,
                },
            });
            setLogs(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
        } catch (e) {
            showToast('Failed to load audit logs.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        <Shield className="text-amber-400" size={22} />
                        <span>Immutable System Audit Trail</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Permanent tamper-evident cryptographic log of all state modifications, approvals, and custody transfers
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-4 shadow-lg font-sans">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829FA1]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search audit trail by User, Action, Entity, IP address..."
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642] transition"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Timestamp</th>
                                <th className="py-3.5 px-4">User</th>
                                <th className="py-3.5 px-4">Action</th>
                                <th className="py-3.5 px-4">Target Entity</th>
                                <th className="py-3.5 px-4">IP Address</th>
                                <th className="py-3.5 px-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs font-mono">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#829FA1] font-sans">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#386642]"></div>
                                        <div className="mt-2 text-xs">Querying audit trail...</div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                                        <History size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No audit records found</div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 font-sans">
                                            <div className="font-bold text-white text-xs">
                                                {log.user?.name || 'System / CLI'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {log.user?.email || 'system@mtc.local'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 text-[11px] uppercase font-bold">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-200">
                                            {log.entity_type} {log.entity_id && `#${log.entity_id}`}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                                            {log.ip_address || '127.0.0.1'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-sans">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="p-4 border-t border-[#243249] bg-[#0F1626] flex items-center justify-between text-xs text-slate-400">
                        <div>
                            Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} records)
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.current_page === 1}
                                onClick={() => fetchLogs(pagination.current_page - 1)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white hover:bg-slate-700 transition flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => fetchLogs(pagination.current_page + 1)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white hover:bg-slate-700 transition flex items-center gap-1"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Details Modal */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title={`Audit Record #${selectedLog?.id} — ${selectedLog?.action}`}
                maxWidth="max-w-2xl"
            >
                {selectedLog && (
                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                            <div>
                                <span className="text-slate-500">Initiator:</span>{' '}
                                <span className="text-slate-200">{selectedLog.user?.name || 'System'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">IP:</span>{' '}
                                <span className="text-slate-200">{selectedLog.ip_address}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Target:</span>{' '}
                                <span className="text-slate-200">{selectedLog.entity_type} #{selectedLog.entity_id}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Timestamp:</span>{' '}
                                <span className="text-slate-200">{new Date(selectedLog.created_at).toISOString()}</span>
                            </div>
                        </div>

                        {selectedLog.old_values && (
                            <div>
                                <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Previous State (Old Values):
                                </div>
                                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                                    {JSON.stringify(selectedLog.old_values, null, 2)}
                                </pre>
                            </div>
                        )}

                        {selectedLog.new_values && (
                            <div>
                                <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Committed Mutation (New Values):
                                </div>
                                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-40">
                                    {JSON.stringify(selectedLog.new_values, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
