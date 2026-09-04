import React, { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Calendar,
    ChevronRight,
    Boxes,
    Package,
    ArrowUpRight,
    Eye,
    Trash2,
    Filter
} from 'lucide-react';
import api from '../api';
import { StatusBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function RequestsView({ onCheckoutRequest, initialAssetToRequest }) {
    const { user, canManageEquipment, showToast } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    // Request Creation Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [gearKits, setGearKits] = useState([]);
    const [formProject, setFormProject] = useState('');
    const [formPurpose, setFormPurpose] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [formReturnDate, setFormReturnDate] = useState(
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [adminOverrideReason, setAdminOverrideReason] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Request Details & Review Modal
    const [activeRequest, setActiveRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [changeNotes, setChangeNotes] = useState('');
    const [selectedForPartial, setSelectedForPartial] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = {
                status: statusFilter || undefined,
                search: search || undefined,
            };
            const res = await api.get('/requests', { params });
            setRequests(res.data.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load gear requests.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadModalDependencies = async () => {
        try {
            const [assetsRes, kitsRes] = await Promise.all([
                api.get('/assets', { params: { per_page: 100 } }),
                api.get('/kits'),
            ]);
            setAvailableAssets(assetsRes.data.data);
            setGearKits(kitsRes.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, search]);

    useEffect(() => {
        if (initialAssetToRequest) {
            setSelectedAssetIds([initialAssetToRequest.id]);
            setShowCreateModal(true);
        }
        loadModalDependencies();
    }, [initialAssetToRequest]);

    // Live Availability Check
    useEffect(() => {
        if (selectedAssetIds.length > 0 && formStartDate && formReturnDate) {
            setCheckingAvailability(true);
            api.post('/requests/check-availability', {
                start_date: formStartDate,
                expected_return_date: formReturnDate,
                asset_ids: selectedAssetIds,
            })
                .then((res) => {
                    setAvailabilityMap(res.data.availability || {});
                })
                .catch(() => {})
                .finally(() => setCheckingAvailability(false));
        } else {
            setAvailabilityMap({});
        }
    }, [selectedAssetIds, formStartDate, formReturnDate]);

    const handleAddKitItems = (kit) => {
        const itemIds = kit.items.map((i) => i.asset_id);
        const merged = Array.from(new Set([...selectedAssetIds, ...itemIds]));
        setSelectedAssetIds(merged);
        showToast(`Added ${itemIds.length} items from '${kit.name}'.`, 'info');
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (selectedAssetIds.length === 0) {
            showToast('Please select at least one equipment item.', 'warning');
            return;
        }

        const hasConflicts = Object.values(availabilityMap).some((r) => !r.is_available);
        if (hasConflicts && (!canManageEquipment || !adminOverrideReason.trim())) {
            showToast('One or more items are conflicting. Overseer override reason is required.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/requests', {
                project_name: formProject,
                purpose: formPurpose,
                destination_location: formLocation,
                start_date: formStartDate,
                expected_return_date: formReturnDate,
                asset_ids: selectedAssetIds,
                admin_override_reason: adminOverrideReason || null,
                notes: formNotes || null,
            });

            showToast('Equipment request submitted successfully!', 'success');
            setShowCreateModal(false);
            setFormProject('');
            setFormPurpose('');
            setFormLocation('');
            setSelectedAssetIds([]);
            setAdminOverrideReason('');
            setFormNotes('');
            fetchRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to submit gear request.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenReview = async (reqId) => {
        try {
            const res = await api.get(`/requests/${reqId}`);
            setActiveRequest(res.data);
            setSelectedForPartial(res.data.items.map((i) => i.asset_id));
        } catch (err) {
            showToast('Failed to load request details.', 'error');
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.post(`/requests/${activeRequest.id}/approve`);
            showToast(`Request ${activeRequest.request_number} approved!`, 'success');
            setActiveRequest(null);
            fetchRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Approval failed.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePartiallyApprove = async () => {
        if (selectedForPartial.length === 0) {
            showToast('Please select at least one item to approve.', 'warning');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/requests/${activeRequest.id}/partially-approve`, {
                approved_asset_ids: selectedForPartial,
            });
            showToast(`Request partially approved with ${selectedForPartial.length} items.`, 'success');
            setActiveRequest(null);
            fetchRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Partial approval failed.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            showToast('Please provide a rejection reason.', 'warning');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/requests/${activeRequest.id}/reject`, {
                rejection_reason: rejectReason,
            });
            showToast(`Request ${activeRequest.request_number} rejected.`, 'info');
            setActiveRequest(null);
            setRejectReason('');
            fetchRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Rejection failed.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async (reqId) => {
        if (!confirm('Are you sure you want to cancel this equipment request?')) return;
        try {
            await api.post(`/requests/${reqId}/cancel`);
            showToast('Request cancelled.', 'info');
            fetchRequests();
        } catch (e) {
            showToast('Failed to cancel request.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Equipment Requests & Approvals
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage project bookings, schedule conflict verification, and overseer reviews
                    </p>
                </div>

                {user?.role !== 'viewer' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Submit Equipment Request</span>
                    </button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829FA1]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by Request #, Project, Requester..."
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642] transition"
                    />
                </div>

                <div className="w-full sm:w-56">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-xs text-[#CADEDF] focus:outline-none focus:border-[#386642]"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="partially_approved">Partially Approved</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="returned">Returned</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Request #</th>
                                <th className="py-3.5 px-4">Project & Purpose</th>
                                <th className="py-3.5 px-4">Requester</th>
                                <th className="py-3.5 px-4">Dates</th>
                                <th className="py-3.5 px-4">Items</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading requests...</div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Boxes size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
                                        <div className="text-sm font-semibold text-slate-300">No requests found</div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-slate-800/40 transition cursor-pointer"
                                        onClick={() => handleOpenReview(req.id)}
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                                            {req.request_number}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-white text-sm">
                                                {req.project_name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                                {req.purpose}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-200">
                                            <div className="font-semibold">{req.user?.name}</div>
                                            <div className="text-[10px] text-slate-500">{req.user?.department}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                                            <div>{req.start_date}</div>
                                            <div className="text-slate-500">to {req.expected_return_date}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            <span className="font-bold text-white">{req.items?.length || 0}</span> items
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td
                                            className="py-3 px-4 text-right space-x-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {canManageEquipment && req.status === 'approved' && !req.checkout && (
                                                <button
                                                    onClick={() => onCheckoutRequest(req)}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition"
                                                >
                                                    Check Out →
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleOpenReview(req.id)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-[11px] font-semibold transition"
                                            >
                                                Details
                                            </button>

                                            {req.user_id === user?.id && req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancel(req.id)}
                                                    title="Cancel Request"
                                                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition"
                                                >
                                                    <Trash2 size={14} />
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

            {/* Submit Request Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Submit Equipment Gear Request"
                maxWidth="max-w-3xl"
            >
                <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                    {/* Project & Venue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Project / Event Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formProject}
                                onChange={(e) => setFormProject(e.target.value)}
                                placeholder="e.g. Wildlife Documentary Shoot - Mole National Park"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Deployment Location / Venue *
                            </label>
                            <input
                                type="text"
                                required
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                                placeholder="e.g. Savanna Region, Ghana"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Production Purpose & Brief *
                        </label>
                        <textarea
                            required
                            rows={2}
                            value={formPurpose}
                            onChange={(e) => setFormPurpose(e.target.value)}
                            placeholder="Explain the production scope, filming conditions, and technical requirements..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Deployment Start Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formStartDate}
                                onChange={(e) => setFormStartDate(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Expected Return Date *
                            </label>
                            <input
                                type="date"
                                required
                                min={formStartDate}
                                value={formReturnDate}
                                onChange={(e) => setFormReturnDate(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* Quick Add Gear Kits */}
                    {gearKits.length > 0 && (
                        <div>
                            <div className="font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Package size={14} className="text-amber-400" />
                                <span>Quick Add Pre-Packaged Gear Kits</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {gearKits.map((kit) => (
                                    <button
                                        type="button"
                                        key={kit.id}
                                        onClick={() => handleAddKitItems(kit)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <span>+ {kit.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">({kit.items?.length} items)</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment Selection & Real-Time Availability Check */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="font-semibold text-slate-300 uppercase tracking-wider">
                                Select Production Assets ({selectedAssetIds.length} chosen) *
                            </label>
                            {checkingAvailability && (
                                <span className="text-[10px] text-amber-400 animate-pulse">
                                    Checking date collisions...
                                </span>
                            )}
                        </div>

                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950 p-2">
                            {availableAssets.map((a) => {
                                const isSelected = selectedAssetIds.includes(a.id);
                                const avail = availabilityMap[a.id];
                                const hasConflict = avail && !avail.is_available;

                                return (
                                    <label
                                        key={a.id}
                                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                                            isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedAssetIds([...selectedAssetIds, a.id]);
                                                    } else {
                                                        setSelectedAssetIds(selectedAssetIds.filter((id) => id !== a.id));
                                                    }
                                                }}
                                                className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 w-4 h-4"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-amber-400 font-bold">{a.asset_id}</span>
                                                    <span className="text-white font-semibold">{a.name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    {a.brand} {a.model} • {a.category?.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            {hasConflict ? (
                                                <div className="text-right">
                                                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold">
                                                        COLLISION
                                                    </span>
                                                    <div className="text-[9px] text-red-400 max-w-[200px] truncate mt-0.5">
                                                        {avail.reason}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Admin Override Reason if conflict detected */}
                    {Object.values(availabilityMap).some((r) => !r.is_available) && (
                        <div className="bg-red-950/30 border border-red-500/40 p-3.5 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-red-300 flex items-center gap-2">
                                <AlertCircle size={16} />
                                Schedule Collision Detected
                            </div>
                            <p className="text-[11px] text-slate-300">
                                One or more selected assets are reserved or checked out during this interval.
                                Authorized overseers may force-deploy by supplying a recorded override reason.
                            </p>
                            {canManageEquipment ? (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-amber-400 mb-1">
                                        Mandatory Administrator Override Reason:
                                    </label>
                                    <input
                                        type="text"
                                        value={adminOverrideReason}
                                        onChange={(e) => setAdminOverrideReason(e.target.value)}
                                        placeholder="e.g. Emergency VIP South Africa assignment - authorized by Executive Producer"
                                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 focus:outline-none"
                                    />
                                </div>
                            ) : (
                                <div className="text-xs text-red-400 font-semibold">
                                    Please adjust your dates or pick alternative available equipment.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Additional Project Notes
                        </label>
                        <input
                            type="text"
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Special rigging or packaging requests..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {/* Actions */}
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
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Review & Approval Modal */}
            <Modal
                isOpen={!!activeRequest}
                onClose={() => setActiveRequest(null)}
                title={`Request Review: ${activeRequest?.request_number || ''}`}
                maxWidth="max-w-2xl"
            >
                {activeRequest && (
                    <div className="space-y-5 text-xs">
                        {/* Request Summary Card */}
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-bold text-white">
                                        {activeRequest.project_name}
                                    </h4>
                                    <div className="text-slate-400">
                                        Requested by: <strong className="text-slate-200">{activeRequest.user?.name}</strong> ({activeRequest.user?.department})
                                    </div>
                                </div>
                                <StatusBadge status={activeRequest.status} />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
                                <div>
                                    <span className="text-slate-500">Destination:</span>{' '}
                                    <span className="text-slate-200 font-medium">{activeRequest.destination_location}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Dates:</span>{' '}
                                    <span className="text-slate-200 font-mono">
                                        {activeRequest.start_date} to {activeRequest.expected_return_date}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-1">
                                <span className="text-slate-500 block">Brief & Purpose:</span>
                                <span className="text-slate-300">{activeRequest.purpose}</span>
                            </div>
                        </div>

                        {/* Requested Items with Availability Checks */}
                        <div>
                            <div className="font-bold uppercase tracking-wider text-slate-300 mb-2">
                                Requested Equipment Items ({activeRequest.items?.length || 0})
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {activeRequest.items?.map((item) => {
                                    const avail = item.availability;
                                    const isAvailable = avail?.is_available;
                                    const isChecked = selectedForPartial.includes(item.asset_id);

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                {activeRequest.status === 'pending' && canManageEquipment && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedForPartial([...selectedForPartial, item.asset_id]);
                                                            } else {
                                                                setSelectedForPartial(
                                                                    selectedForPartial.filter((id) => id !== item.asset_id)
                                                                );
                                                            }
                                                        }}
                                                        className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                                                    />
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-amber-400 font-bold">
                                                            {item.asset?.asset_id}
                                                        </span>
                                                        <span className="text-white font-semibold">
                                                            {item.asset?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {item.asset?.brand} {item.asset?.model}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                {isAvailable ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                                        Available
                                                    </span>
                                                ) : (
                                                    <div className="text-right">
                                                        <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold">
                                                            Conflict
                                                        </span>
                                                        <div className="text-[9px] text-red-400 max-w-xs truncate">
                                                            {avail?.reason}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions for Gear Overseer */}
                        {canManageEquipment && activeRequest.status === 'pending' && (
                            <div className="pt-4 border-t border-slate-800 space-y-3">
                                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                                    Overseer Review Actions:
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-[#386642]/20 font-sans"
                                    >
                                        <CheckCircle2 size={16} />
                                        Approve All
                                    </button>

                                    <button
                                        onClick={handlePartiallyApprove}
                                        disabled={actionLoading}
                                        className="py-2.5 px-4 rounded-xl bg-[#162224] border border-[#2D4044] hover:bg-[#243336] text-[#CADEDF] font-bold transition"
                                    >
                                        Partially Approve Selected ({selectedForPartial.length})
                                    </button>
                                </div>

                                {/* Rejection box */}
                                <div className="pt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="flex-1 bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                                    />
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading || !rejectReason}
                                        className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-40 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* If approved, button to directly proceed to Checkout */}
                        {activeRequest.status === 'approved' && canManageEquipment && !activeRequest.checkout && (
                            <div className="pt-3 border-t border-[#2D4044]">
                                <button
                                    onClick={() => {
                                        const r = activeRequest;
                                        setActiveRequest(null);
                                        onCheckoutRequest(r);
                                    }}
                                    className="w-full py-3 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#386642]/20 transition font-sans"
                                >
                                    <ArrowUpRight size={18} className="stroke-[3]" />
                                    <span>Proceed to Pre-Checkout Handover</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
