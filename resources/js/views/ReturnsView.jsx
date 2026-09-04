import React, { useEffect, useState } from 'react';
import {
    ArrowDownLeft,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Search,
    Boxes,
    FileCheck,
    Wrench,
    ShieldAlert
} from 'lucide-react';
import api from '../api';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function ReturnsView({ preselectedCheckout }) {
    const { user, canManageEquipment, showToast } = useAuth();

    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Return Check-in Modal
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [activeDeployments, setActiveDeployments] = useState([]);
    const [selectedCheckoutId, setSelectedCheckoutId] = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [returnNotes, setReturnNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/returns');
            setReturns(res.data.data);
        } catch (e) {
            showToast('Failed to load return records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadDeployments = async () => {
        try {
            const res = await api.get('/checkouts', { params: { status: 'checked_out' } });
            setActiveDeployments(res.data.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchReturns();
        loadDeployments();
    }, []);

    useEffect(() => {
        if (preselectedCheckout) {
            setSelectedCheckoutId(preselectedCheckout.id);
            setupReturnItems(preselectedCheckout);
            setShowReturnModal(true);
        }
    }, [preselectedCheckout]);

    const setupReturnItems = (co) => {
        const items = co.items.map((i) => ({
            asset_id: i.asset_id,
            asset_name: i.asset?.name,
            asset_code: i.asset?.asset_id,
            condition: i.condition_before || 'good',
            is_damaged: false,
            is_missing: false,
            requires_maintenance: false,
            notes: '',
        }));
        setReturnItems(items);
    };

    const handleSelectCheckout = (coId) => {
        setSelectedCheckoutId(coId);
        const co = activeDeployments.find((d) => d.id === parseInt(coId));
        if (co) setupReturnItems(co);
    };

    const handlePerformReturn = async (e) => {
        e.preventDefault();
        if (!selectedCheckoutId) {
            showToast('Please select a deployment to check in.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                checkout_id: selectedCheckoutId,
                notes: returnNotes,
                items: returnItems.map((item) => ({
                    asset_id: item.asset_id,
                    condition: item.condition,
                    is_damaged: item.is_damaged,
                    is_missing: item.is_missing,
                    requires_maintenance: item.requires_maintenance,
                    notes: item.notes,
                })),
            };

            await api.post('/returns', payload);
            showToast('Return inspection completed! Equipment processed and returned to vault.', 'success');
            setShowReturnModal(false);
            fetchReturns();
            loadDeployments();
        } catch (err) {
            showToast(err.response?.data?.message || 'Check-in failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Equipment Check-In & Return Inspections
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Perform return condition checks, flag damage incidents, and return assets to vault
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={() => {
                            loadDeployments();
                            setShowReturnModal(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <ArrowDownLeft size={16} className="stroke-[3]" />
                        <span>Perform Return Inspection</span>
                    </button>
                )}
            </div>

            {/* Returns History Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Return #</th>
                                <th className="py-3.5 px-4">Project & Borrower</th>
                                <th className="py-3.5 px-4">Receiver Inspector</th>
                                <th className="py-3.5 px-4">Return Date</th>
                                <th className="py-3.5 px-4">Inspection Result</th>
                                <th className="py-3.5 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading return history...</div>
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <Boxes size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No return records found</div>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                                            RET-{ret.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-white text-sm">
                                                {ret.checkout?.request?.project_name || 'Production Project'}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                Returned by: <span className="text-slate-200 font-semibold">{ret.user?.name}</span> ({ret.items?.length || 0} items)
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300">
                                            {ret.receiver?.name}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                                            {new Date(ret.return_date).toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {ret.status === 'damaged' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                                    <AlertTriangle size={12} />
                                                    Damage Flagged
                                                </span>
                                            ) : ret.status === 'missing_items' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                                                    <ShieldAlert size={12} />
                                                    Missing Assets
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                                    <CheckCircle2 size={12} />
                                                    Passed Good
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusBadge status={ret.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Check-In Modal */}
            <Modal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="Post-Return Equipment Inspection & Vault Restock"
                maxWidth="max-w-3xl"
            >
                <form onSubmit={handlePerformReturn} className="space-y-4 text-xs">
                    {/* Deployment Selector */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Select Active Deployment to Return *
                        </label>
                        <select
                            required
                            value={selectedCheckoutId}
                            onChange={(e) => handleSelectCheckout(e.target.value)}
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="">Select a deployment in the field</option>
                            {activeDeployments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    CHK-{d.id} — {d.request?.project_name} ({d.user?.name}, {d.items?.length} items)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Return Inspection items */}
                    {returnItems.length > 0 && (
                        <div>
                            <div className="font-bold uppercase tracking-wider text-slate-300 mb-2">
                                Individual Asset Return Verification ({returnItems.length} items)
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {returnItems.map((item, idx) => (
                                    <div
                                        key={item.asset_id}
                                        className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                                            item.is_damaged || item.is_missing
                                                ? 'bg-red-950/20 border-red-500/40'
                                                : 'bg-slate-950 border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-mono text-amber-400 font-bold mr-2">
                                                    {item.asset_code}
                                                </span>
                                                <span className="text-white font-bold">{item.asset_name}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-[10px]">Returned Condition:</span>
                                                <select
                                                    value={item.condition}
                                                    onChange={(e) => {
                                                        const updated = [...returnItems];
                                                        updated[idx].condition = e.target.value;
                                                        setReturnItems(updated);
                                                    }}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-[11px]"
                                                >
                                                    <option value="excellent">Excellent</option>
                                                    <option value="good">Good</option>
                                                    <option value="fair">Fair</option>
                                                    <option value="minor_damage">Minor Damage</option>
                                                    <option value="damaged">Damaged</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Status Options Toggles */}
                                        <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-4 text-[11px]">
                                            <label className="flex items-center gap-1.5 cursor-pointer text-red-300">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_damaged}
                                                    onChange={(e) => {
                                                        const updated = [...returnItems];
                                                        updated[idx].is_damaged = e.target.checked;
                                                        if (e.target.checked) updated[idx].condition = 'minor_damage';
                                                        setReturnItems(updated);
                                                    }}
                                                    className="rounded text-red-500 focus:ring-red-500 bg-slate-800 border-slate-700"
                                                />
                                                <span>Flag Damage (Auto-creates Incident)</span>
                                            </label>

                                            <label className="flex items-center gap-1.5 cursor-pointer text-rose-300">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_missing}
                                                    onChange={(e) => {
                                                        const updated = [...returnItems];
                                                        updated[idx].is_missing = e.target.checked;
                                                        setReturnItems(updated);
                                                    }}
                                                    className="rounded text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-700"
                                                />
                                                <span>Missing Asset</span>
                                            </label>

                                            <label className="flex items-center gap-1.5 cursor-pointer text-purple-300">
                                                <input
                                                    type="checkbox"
                                                    checked={item.requires_maintenance}
                                                    onChange={(e) => {
                                                        const updated = [...returnItems];
                                                        updated[idx].requires_maintenance = e.target.checked;
                                                        setReturnItems(updated);
                                                    }}
                                                    className="rounded text-purple-500 focus:ring-purple-500 bg-slate-800 border-slate-700"
                                                />
                                                <span>Requires Maintenance / Calibration</span>
                                            </label>
                                        </div>

                                        {/* Notes per item */}
                                        {(item.is_damaged || item.is_missing || item.requires_maintenance) && (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) => {
                                                        const updated = [...returnItems];
                                                        updated[idx].notes = e.target.value;
                                                        setReturnItems(updated);
                                                    }}
                                                    placeholder="Specify damage details, fault symptoms, or missing parts..."
                                                    className="w-full bg-slate-900 border border-red-500/40 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Overall Notes */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Overall Return Notes
                        </label>
                        <textarea
                            rows={2}
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                            placeholder="All gear accounted for and returned to vault shelf A-2..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowReturnModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || returnItems.length === 0}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Processing Return...' : 'Complete Check-In & Restock'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
