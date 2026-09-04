import React, { useEffect, useState } from 'react';
import { Wrench, Plus, CheckCircle, Clock, Calendar, DollarSign, Boxes } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function MaintenanceView() {
    const { canManageEquipment, showToast } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Schedule modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [assets, setAssets] = useState([]);
    const [scheduleData, setScheduleData] = useState({
        asset_id: '',
        status: 'scheduled',
        issue_description: '',
        provider_name: '',
        cost: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        set_asset_in_maintenance: true,
        notes: '',
    });

    // Complete modal
    const [completingRecord, setCompletingRecord] = useState(null);
    const [completeCost, setCompleteCost] = useState('');
    const [completeCondition, setCompleteCondition] = useState('excellent');
    const [completeNotes, setCompleteNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get('/maintenance');
            setRecords(res.data.data);
        } catch (e) {
            showToast('Failed to load maintenance records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAssets = async () => {
        try {
            const res = await api.get('/assets', { params: { per_page: 100 } });
            setAssets(res.data.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchRecords();
        loadAssets();
    }, []);

    const handleSchedule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/maintenance', scheduleData);
            showToast('Maintenance service scheduled.', 'success');
            setShowScheduleModal(false);
            setScheduleData({
                asset_id: '',
                status: 'scheduled',
                issue_description: '',
                provider_name: '',
                cost: '',
                scheduled_date: new Date().toISOString().split('T')[0],
                set_asset_in_maintenance: true,
                notes: '',
            });
            fetchRecords();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to schedule maintenance.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/maintenance/${completingRecord.id}/complete`, {
                cost: completeCost || undefined,
                condition: completeCondition,
                notes: completeNotes,
            });
            showToast('Maintenance marked complete. Equipment restored to AVAILABLE.', 'success');
            setCompletingRecord(null);
            fetchRecords();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to complete maintenance.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Equipment Maintenance & Servicing
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Track routine maintenance, calibrations, firmware updates, and repair logs
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Schedule Service</span>
                    </button>
                )}
            </div>

            {/* Maintenance Records Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Asset ID & Name</th>
                                <th className="py-3.5 px-4">Issue / Service Scope</th>
                                <th className="py-3.5 px-4">Provider</th>
                                <th className="py-3.5 px-4">Cost</th>
                                <th className="py-3.5 px-4">Schedule Date</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading maintenance records...</div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Wrench size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No active maintenance records</div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-amber-400 font-bold mr-2">
                                                {r.asset?.asset_id}
                                            </span>
                                            <span className="text-white font-semibold">{r.asset?.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-200">
                                            {r.issue_description}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400">
                                            {r.provider_name || 'In-House QC'}
                                        </td>
                                        <td className="py-3.5 px-4 text-amber-300 font-mono">
                                            {r.cost ? `$${parseFloat(r.cost).toFixed(2)}` : '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                            {r.scheduled_date}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                                    r.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        : r.status === 'in_progress'
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                }`}
                                            >
                                                {r.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {canManageEquipment && r.status !== 'completed' && (
                                                <button
                                                    onClick={() => {
                                                        setCompletingRecord(r);
                                                        setCompleteCost(r.cost || '');
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition"
                                                >
                                                    Complete →
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Schedule Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title="Schedule Equipment Maintenance"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleSchedule} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Equipment Asset *
                        </label>
                        <select
                            required
                            value={scheduleData.asset_id}
                            onChange={(e) => setScheduleData({ ...scheduleData, asset_id: e.target.value })}
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="">Select Equipment</option>
                            {assets.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.asset_id} — {a.name} ({a.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Issue Description / Service Scope *
                        </label>
                        <textarea
                            required
                            rows={2}
                            value={scheduleData.issue_description}
                            onChange={(e) => setScheduleData({ ...scheduleData, issue_description: e.target.value })}
                            placeholder="e.g. Sensor cleaning, back-focus calibration, firmware update..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Service Provider
                            </label>
                            <input
                                type="text"
                                value={scheduleData.provider_name}
                                onChange={(e) => setScheduleData({ ...scheduleData, provider_name: e.target.value })}
                                placeholder="e.g. Sony Service Center / In-house"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Scheduled Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={scheduleData.scheduled_date}
                                onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                            type="checkbox"
                            checked={scheduleData.set_asset_in_maintenance}
                            onChange={(e) =>
                                setScheduleData({ ...scheduleData, set_asset_in_maintenance: e.target.checked })
                            }
                            className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 w-4 h-4"
                        />
                        <span className="text-slate-300 font-medium">
                            Lock asset in MAINTENANCE status immediately
                        </span>
                    </label>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowScheduleModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Saving...' : 'Save Maintenance'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Complete Modal */}
            <Modal
                isOpen={!!completingRecord}
                onClose={() => setCompletingRecord(null)}
                title="Mark Maintenance Complete & Restore to Vault"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleComplete} className="space-y-4 text-xs">
                    <p className="text-slate-300">
                        Confirm completion of maintenance for{' '}
                        <strong className="text-amber-400 font-mono">{completingRecord?.asset?.asset_id}</strong> (
                        {completingRecord?.asset?.name}). The equipment will be marked as{' '}
                        <strong className="text-emerald-400">AVAILABLE</strong> in the vault inventory.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Final Cost ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={completeCost}
                                onChange={(e) => setCompleteCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Restored Condition
                            </label>
                            <select
                                value={completeCondition}
                                onChange={(e) => setCompleteCondition(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Technical QC Notes
                        </label>
                        <textarea
                            rows={2}
                            value={completeNotes}
                            onChange={(e) => setCompleteNotes(e.target.value)}
                            placeholder="Cleaned, calibrated, tested OK on test bench..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setCompletingRecord(null)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Completing...' : 'Mark Complete & Available'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
