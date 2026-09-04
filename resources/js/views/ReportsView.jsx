import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, DollarSign, Clock, Wrench, AlertTriangle, Boxes } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ReportsView() {
    const { showToast } = useAuth();
    const [activeReport, setActiveReport] = useState('inventory');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async (type) => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/${type}`);
            setReportData(res.data);
        } catch (e) {
            showToast('Failed to load report data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeReport);
    }, [activeReport]);

    const handleDownloadCsv = (type) => {
        window.open(`/api/reports/export/${type}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Executive Operational Reports & Analytics
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Audit inventory valuation, deployment velocity, equipment utilization, and service costs
                    </p>
                </div>

                <button
                    onClick={() => handleDownloadCsv(activeReport)}
                    className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-[#386642]/20 transition font-sans"
                >
                    <Download size={15} />
                    <span>Download CSV Report</span>
                </button>
            </div>

            {/* Report Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                    { id: 'inventory', label: 'Inventory Assets', icon: Boxes },
                    { id: 'deployment', label: 'Current Deployments', icon: Clock },
                    { id: 'overdue', label: 'Overdue Equipment', icon: AlertTriangle },
                    { id: 'utilization', label: 'Gear Utilization', icon: BarChart3 },
                    { id: 'maintenance', label: 'Maintenance Costs', icon: Wrench },
                    { id: 'damage', label: 'Incident Records', icon: AlertTriangle },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeReport === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id)}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 font-sans ${
                                active
                                    ? 'bg-[#386642]/20 border-[#386642]/60 text-[#FFEBCC]'
                                    : 'bg-[#1D2729] border-[#2D4044] text-[#CADEDF]/75 hover:bg-[#243336]'
                            }`}
                        >
                            <Icon size={18} className={active ? 'text-[#FFEBCC]' : 'text-[#829FA1]'} />
                            <span className="text-xs font-bold leading-tight">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Report Data Container */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl text-xs font-sans">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                        <div className="mt-2 text-xs">Aggregating report data...</div>
                    </div>
                ) : (
                    <div>
                        {activeReport === 'inventory' && reportData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="text-slate-400 uppercase text-[10px] font-bold">Total Assets</div>
                                        <div className="text-2xl font-black text-white font-mono mt-1">
                                            {reportData.total_assets}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="text-slate-400 uppercase text-[10px] font-bold">Vault Valuation</div>
                                        <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                                            ${parseFloat(reportData.total_valuation || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="text-slate-400 uppercase text-[10px] font-bold">Categories</div>
                                        <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                                            {Object.keys(reportData.by_category || {}).length}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                                        Inventory Distribution by Category
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {Object.entries(reportData.by_category || {}).map(([cat, count]) => (
                                            <div key={cat} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                                                <span className="text-slate-300 truncate pr-2">{cat}</span>
                                                <span className="font-mono font-bold text-amber-400">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeReport === 'deployment' && reportData && (
                            <div className="space-y-4">
                                <div className="font-bold text-sm text-white">
                                    Currently Checked Out Deployments ({reportData.total_deployed})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                                                <th className="py-2">Borrower</th>
                                                <th className="py-2">Project</th>
                                                <th className="py-2">Items</th>
                                                <th className="py-2">Checkout Date</th>
                                                <th className="py-2">Expected Return</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {reportData.checkouts?.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="py-2.5 font-bold text-white">{c.user?.name}</td>
                                                    <td className="py-2.5 text-slate-300">{c.request?.project_name}</td>
                                                    <td className="py-2.5 text-amber-400 font-mono">{c.items?.length} items</td>
                                                    <td className="py-2.5 font-mono text-slate-400">{new Date(c.checkout_date).toLocaleDateString()}</td>
                                                    <td className="py-2.5 font-mono text-slate-400">{new Date(c.expected_return_date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeReport === 'overdue' && reportData && (
                            <div className="space-y-4">
                                <div className="font-bold text-sm text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    <span>Overdue Deployments Requiring Intervention ({reportData.total_overdue})</span>
                                </div>
                                {reportData.total_overdue === 0 ? (
                                    <div className="text-slate-500 text-center py-8">
                                        No overdue deployments! All equipment returned on schedule.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {reportData.checkouts?.map((co) => (
                                            <div key={co.id} className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/40 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-white text-sm">
                                                        {co.request?.project_name} — {co.user?.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        Phone: {co.user?.phone || 'N/A'} • {co.items?.length} equipment items
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold font-mono text-xs">
                                                        {co.days_overdue} Days Overdue
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeReport === 'utilization' && reportData && (
                            <div className="space-y-4">
                                <div className="font-bold text-sm text-white">
                                    Equipment Utilization Leaderboard (Most Deployed)
                                </div>
                                <div className="space-y-2">
                                    {reportData.map((stat, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-amber-500 font-black text-sm">#{idx + 1}</span>
                                                <div>
                                                    <div className="font-bold text-white">
                                                        {stat.asset?.name} ({stat.asset?.asset_id})
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {stat.asset?.category?.name} • {stat.asset?.brand}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-amber-400 font-mono">
                                                    {stat.checkout_count}
                                                </span>
                                                <span className="text-[10px] text-slate-400 ml-1">deployments</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeReport === 'maintenance' && reportData && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="text-slate-400 uppercase text-[10px] font-bold">Total Service Records</div>
                                        <div className="text-2xl font-black text-white font-mono mt-1">{reportData.total_records}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="text-slate-400 uppercase text-[10px] font-bold">Total Maintenance Expenditure</div>
                                        <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                                            ${parseFloat(reportData.total_cost || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeReport === 'damage' && reportData && (
                            <div className="space-y-4">
                                <div className="font-bold text-sm text-white">
                                    Total Recorded Incidents: {reportData.total_incidents}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {Object.entries(reportData.by_severity || {}).map(([sev, cnt]) => (
                                        <div key={sev} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                                            <span className="capitalize text-slate-300">{sev}</span>
                                            <span className="font-mono font-bold text-red-400">{cnt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
