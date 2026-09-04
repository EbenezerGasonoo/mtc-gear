import React, { useEffect, useState } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    Search,
    User,
    Calendar,
    Boxes,
    FileCheck,
    AlertCircle,
    Shield
} from 'lucide-react';
import api from '../api';
import { StatusBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import DigitalSignatureModal from '../components/DigitalSignatureModal';

export default function CheckoutsView({ onInitiateReturn, preselectedRequest }) {
    const { user, canManageEquipment, showToast } = useAuth();

    const [checkouts, setCheckouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    // Pre-checkout Modal State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [selectedReqId, setSelectedReqId] = useState('');
    const [inspectedItems, setInspectedItems] = useState([]);
    const [checkoutNotes, setCheckoutNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Digital Signature Modal State
    const [signingCheckout, setSigningCheckout] = useState(null);

    const fetchCheckouts = async () => {
        setLoading(true);
        try {
            const params = {
                status: statusFilter || undefined,
            };
            const res = await api.get('/checkouts', { params });
            setCheckouts(res.data.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load checkouts.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadApprovedRequests = async () => {
        try {
            const res = await api.get('/requests', { params: { status: 'approved' } });
            setApprovedRequests(res.data.data.filter((r) => !r.checkout));
        } catch (e) {}
    };

    useEffect(() => {
        fetchCheckouts();
        loadApprovedRequests();
    }, [statusFilter]);

    useEffect(() => {
        if (preselectedRequest) {
            setSelectedReqId(preselectedRequest.id);
            setupPrecheckoutItems(preselectedRequest);
            setShowCheckoutModal(true);
        }
    }, [preselectedRequest]);

    const setupPrecheckoutItems = (req) => {
        const items = req.items.map((i) => ({
            asset_id: i.asset_id,
            asset_name: i.asset?.name,
            asset_code: i.asset?.asset_id,
            condition: i.asset?.condition || 'excellent',
            accessories: {
                battery: true,
                charger: true,
                memory_card: true,
                body_cap: true,
                case: true,
            },
            notes: '',
        }));
        setInspectedItems(items);
    };

    const handleSelectRequest = (reqId) => {
        setSelectedReqId(reqId);
        const req = approvedRequests.find((r) => r.id === parseInt(reqId));
        if (req) setupPrecheckoutItems(req);
    };

    const handlePerformCheckout = async (e) => {
        e.preventDefault();
        if (!selectedReqId) {
            showToast('Please select an approved request.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                gear_request_id: selectedReqId,
                notes: checkoutNotes,
                items: inspectedItems.map((item) => ({
                    asset_id: item.asset_id,
                    condition: item.condition,
                    accessories_included: Object.keys(item.accessories).filter((k) => item.accessories[k]),
                    notes: item.notes,
                })),
            };

            const res = await api.post('/checkouts', payload);
            showToast('Pre-checkout inspection completed and equipment deployed!', 'success');
            setShowCheckoutModal(false);
            fetchCheckouts();
            loadApprovedRequests();

            // Prompt digital signature if current user is borrower
            if (res.data.checkout.user_id === user.id) {
                setSigningCheckout(res.data.checkout);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Checkout failed.', 'error');
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
                        Active Equipment Deployments & Custody
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Track field checkouts, digital handover signatures, and inspection records
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={() => {
                            loadApprovedRequests();
                            setShowCheckoutModal(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <ArrowUpRight size={16} className="stroke-[3]" />
                        <span>Perform Equipment Check-Out</span>
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-[#2D4044] pb-2 font-sans">
                {[
                    { id: '', label: 'All Checkouts' },
                    { id: 'checked_out', label: 'Active In Field' },
                    { id: 'overdue', label: 'Overdue Deployments' },
                    { id: 'returned', label: 'Returned History' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            statusFilter === tab.id
                                ? 'bg-[#386642]/20 text-[#FFEBCC] border border-[#386642]/50'
                                : 'text-[#CADEDF]/75 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Checkouts Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Deployment #</th>
                                <th className="py-3.5 px-4">Project & Borrower</th>
                                <th className="py-3.5 px-4">Overseer Inspector</th>
                                <th className="py-3.5 px-4">Checkout & Return Dates</th>
                                <th className="py-3.5 px-4">Digital Signature</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading checkouts...</div>
                                    </td>
                                </tr>
                            ) : checkouts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Boxes size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No checkouts found</div>
                                    </td>
                                </tr>
                            ) : (
                                checkouts.map((co) => (
                                    <tr key={co.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                                            CHK-{co.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-white text-sm">
                                                {co.request?.project_name}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                Borrower: <span className="text-slate-200 font-semibold">{co.user?.name}</span> ({co.items?.length || 0} items)
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300">
                                            {co.inspector?.name || 'Overseer'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                                            <div>{new Date(co.checkout_date).toLocaleDateString()}</div>
                                            <div className="text-slate-500">
                                                Due: {new Date(co.expected_return_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {co.handover_signed_at ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A7F3D0] bg-[#386642]/20 px-2 py-0.5 rounded border border-[#386642]/40">
                                                    <CheckCircle2 size={12} />
                                                    Signed
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setSigningCheckout(co)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FFEBCC] bg-[#386642]/20 px-2 py-0.5 rounded border border-[#386642]/50 hover:bg-[#386642]/30 transition"
                                                >
                                                    <FileCheck size={12} />
                                                    Sign Now
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusBadge status={co.status} />
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-2">
                                            {canManageEquipment && co.status !== 'returned' && (
                                                <button
                                                    onClick={() => onInitiateReturn(co)}
                                                    className="px-3 py-1 rounded-lg bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] text-[11px] font-bold shadow-sm transition"
                                                >
                                                    Check In →
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

            {/* Perform Check-out & Pre-inspection Modal */}
            <Modal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                title="Pre-Checkout Inspection & Handover Preparation"
                maxWidth="max-w-3xl"
            >
                <form onSubmit={handlePerformCheckout} className="space-y-4 text-xs">
                    {/* Request Selector */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Select Approved Gear Request *
                        </label>
                        <select
                            required
                            value={selectedReqId}
                            onChange={(e) => handleSelectRequest(e.target.value)}
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="">Select an approved request</option>
                            {approvedRequests.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.request_number} — {r.project_name} ({r.user?.name}, {r.items?.length} items)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pre-checkout inspection list */}
                    {inspectedItems.length > 0 && (
                        <div>
                            <div className="font-bold uppercase tracking-wider text-slate-300 mb-2">
                                Pre-Checkout Inspection & Accessory Checklist ({inspectedItems.length} items)
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {inspectedItems.map((item, idx) => (
                                    <div
                                        key={item.asset_id}
                                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-mono text-amber-400 font-bold mr-2">
                                                    {item.asset_code}
                                                </span>
                                                <span className="text-white font-bold">{item.asset_name}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-[10px]">Condition:</span>
                                                <select
                                                    value={item.condition}
                                                    onChange={(e) => {
                                                        const updated = [...inspectedItems];
                                                        updated[idx].condition = e.target.value;
                                                        setInspectedItems(updated);
                                                    }}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-[11px]"
                                                >
                                                    <option value="excellent">Excellent</option>
                                                    <option value="good">Good</option>
                                                    <option value="fair">Fair</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Accessories Included Checklist */}
                                        <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-4 text-[11px]">
                                            <span className="text-slate-500 font-semibold">Included:</span>
                                            {['battery', 'charger', 'memory_card', 'body_cap', 'case'].map((acc) => (
                                                <label key={acc} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.accessories[acc]}
                                                        onChange={(e) => {
                                                            const updated = [...inspectedItems];
                                                            updated[idx].accessories[acc] = e.target.checked;
                                                            setInspectedItems(updated);
                                                        }}
                                                        className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                                                    />
                                                    <span className="capitalize text-slate-300">
                                                        {acc.replace('_', ' ')}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Pre-Deployment Inspection Notes
                        </label>
                        <textarea
                            rows={2}
                            value={checkoutNotes}
                            onChange={(e) => setCheckoutNotes(e.target.value)}
                            placeholder="Cleaned sensors, battery fully charged, packed in flight cases..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowCheckoutModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || inspectedItems.length === 0}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Processing Checkout...' : 'Confirm Handover & Deploy'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Digital Signature Modal */}
            <DigitalSignatureModal
                isOpen={!!signingCheckout}
                onClose={() => setSigningCheckout(null)}
                checkout={signingCheckout}
                onSuccess={fetchCheckouts}
            />
        </div>
    );
}
