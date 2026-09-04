import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, CheckCircle, Search, ShieldAlert, Boxes } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function IncidentsView() {
    const { canManageEquipment, showToast } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [assets, setAssets] = useState([]);
    const [formData, setFormData] = useState({
        asset_id: '',
        type: 'damage',
        severity: 'medium',
        incident_date: new Date().toISOString().split('T')[0],
        project_name: '',
        description: '',
        set_asset_status: 'damaged',
    });

    // Resolve modal
    const [resolvingIncident, setResolvingIncident] = useState(null);
    const [resolutionText, setResolutionText] = useState('');
    const [restoreStatus, setRestoreStatus] = useState('available');
    const [assetCondition, setAssetCondition] = useState('good');
    const [submitting, setSubmitting] = useState(false);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/incidents');
            setIncidents(res.data.data);
        } catch (e) {
            showToast('Failed to load incident tickets.', 'error');
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
        fetchIncidents();
        loadAssets();
    }, []);

    const handleCreateIncident = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/incidents', formData);
            showToast('Incident ticket filed successfully.', 'success');
            setShowCreateModal(false);
            setFormData({
                asset_id: '',
                type: 'damage',
                severity: 'medium',
                incident_date: new Date().toISOString().split('T')[0],
                project_name: '',
                description: '',
                set_asset_status: 'damaged',
            });
            fetchIncidents();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to file incident.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/incidents/${resolvingIncident.id}/resolve`, {
                resolution: resolutionText,
                restore_asset_status: restoreStatus,
                asset_condition: assetCondition,
            });
            showToast('Incident marked as resolved.', 'success');
            setResolvingIncident(null);
            fetchIncidents();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to resolve incident.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Damage, Fault & Loss Incident Log
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Log equipment damage reports, investigate missing accessories, and resolve incidents
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                >
                    <Plus size={16} className="stroke-[3]" />
                    <span>Report Damage or Incident</span>
                </button>
            </div>

            {/* Incidents Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Incident #</th>
                                <th className="py-3.5 px-4">Asset Details</th>
                                <th className="py-3.5 px-4">Type & Severity</th>
                                <th className="py-3.5 px-4">Description & Project</th>
                                <th className="py-3.5 px-4">Reported By</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading incident tickets...</div>
                                    </td>
                                </tr>
                            ) : incidents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <ShieldAlert size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No incidents recorded</div>
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((inc) => (
                                    <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                                            {inc.incident_number}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-amber-400 font-bold mr-2">
                                                {inc.asset?.asset_id}
                                            </span>
                                            <span className="text-white font-semibold">{inc.asset?.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="capitalize font-semibold text-slate-200">
                                                {inc.type.replace('_', ' ')}
                                            </div>
                                            <span
                                                className={`inline-block text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                                                    inc.severity === 'critical'
                                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                                        : inc.severity === 'high'
                                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                }`}
                                            >
                                                {inc.severity}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <div className="text-slate-200 line-clamp-2">{inc.description}</div>
                                            {inc.project_name && (
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    Project: {inc.project_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400">
                                            <div>{inc.reported_by?.name}</div>
                                            <div className="text-[10px] font-mono text-slate-500">{inc.incident_date}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {inc.resolved_at ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                                    <CheckCircle size={12} />
                                                    Resolved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                                    <AlertTriangle size={12} />
                                                    Open Ticket
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {canManageEquipment && !inc.resolved_at && (
                                                <button
                                                    onClick={() => setResolvingIncident(inc)}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition"
                                                >
                                                    Resolve →
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

            {/* Create Incident Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Report Equipment Incident, Damage or Loss"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Damaged / Faulty Asset *
                        </label>
                        <select
                            required
                            value={formData.asset_id}
                            onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="">Select Equipment</option>
                            {assets.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.asset_id} — {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Incident Type *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="damage">Damage / Physical Impact</option>
                                <option value="missing">Missing In Action</option>
                                <option value="lost">Lost</option>
                                <option value="technical_fault">Internal Technical Fault</option>
                                <option value="accessory_missing">Accessory / Cable Missing</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Severity Level *
                            </label>
                            <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="low">Low (Cosmetic/Minor)</option>
                                <option value="medium">Medium (Impaired)</option>
                                <option value="high">High (Non-functional)</option>
                                <option value="critical">Critical (Destroyed/Lost)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Project / Assignment Name
                        </label>
                        <input
                            type="text"
                            value={formData.project_name}
                            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                            placeholder="e.g. Commercial Shoot Cape Coast"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Incident Description & Circumstances *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of what occurred, visible damage, or malfunction..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition disabled:opacity-50"
                        >
                            {submitting ? 'Reporting...' : 'Submit Incident Report'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Resolve Incident Modal */}
            <Modal
                isOpen={!!resolvingIncident}
                onClose={() => setResolvingIncident(null)}
                title="Resolve Incident Ticket"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleResolve} className="space-y-4 text-xs">
                    <p className="text-slate-300">
                        Resolving ticket <strong className="text-red-400 font-mono">{resolvingIncident?.incident_number}</strong> for asset{' '}
                        <strong className="text-amber-400">{resolvingIncident?.asset?.name}</strong>.
                    </p>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Resolution Action Taken *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="e.g. Replaced front element, tested autofocus and sensor alignment, restocked accessories..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Restore Asset Status
                            </label>
                            <select
                                value={restoreStatus}
                                onChange={(e) => setRestoreStatus(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="available">Available (In Vault)</option>
                                <option value="maintenance">Send to Maintenance</option>
                                <option value="retired">Retire / Scrap Asset</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Certified Condition
                            </label>
                            <select
                                value={assetCondition}
                                onChange={(e) => setAssetCondition(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setResolvingIncident(null)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Resolving...' : 'Confirm Resolution'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
