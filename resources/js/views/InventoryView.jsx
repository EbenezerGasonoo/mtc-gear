import React, { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    Plus,
    QrCode,
    Printer,
    SlidersHorizontal,
    Boxes,
    Camera,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit2,
    Trash2
} from 'lucide-react';
import api from '../api';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PrintAssetLabelModal from '../components/PrintAssetLabelModal';

export default function InventoryView({ onSelectAsset }) {
    const { canManageEquipment, showToast } = useAuth();

    // Data states
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Filter states
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [printAsset, setPrintAsset] = useState(null);

    // Add Form State
    const [formData, setFormData] = useState({
        category_id: '',
        asset_id: '',
        manual_override: false,
        name: '',
        brand: '',
        model: '',
        serial_number: '',
        description: '',
        condition: 'excellent',
        status: 'available',
        location_id: '',
        purchase_date: '',
        purchase_price: '',
        warranty_expiry: '',
        notes: '',
        photo: null,
    });
    const [previewAssetId, setPreviewAssetId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                search: search || undefined,
                category_id: selectedCategory || undefined,
                status: selectedStatus || undefined,
                condition: selectedCondition || undefined,
                location_id: selectedLocation || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            const [assetsRes, catsRes, locsRes] = await Promise.all([
                api.get('/assets', { params }),
                categories.length === 0 ? api.get('/categories') : Promise.resolve({ data: categories }),
                locations.length === 0 ? api.get('/locations') : Promise.resolve({ data: locations }),
            ]);

            setAssets(assetsRes.data.data);
            setPagination({
                current_page: assetsRes.data.current_page,
                last_page: assetsRes.data.last_page,
                total: assetsRes.data.total,
            });

            if (categories.length === 0) setCategories(catsRes.data);
            if (locations.length === 0) setLocations(locsRes.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load inventory assets.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, selectedCategory, selectedStatus, selectedCondition, selectedLocation, sortBy, sortOrder]);

    const handleCategoryChange = async (catId) => {
        setFormData((prev) => ({ ...prev, category_id: catId }));
        if (catId) {
            try {
                const res = await api.get('/assets/preview-id', { params: { category_id: catId } });
                setPreviewAssetId(res.data.asset_id);
                if (!formData.manual_override) {
                    setFormData((prev) => ({ ...prev, asset_id: res.data.asset_id }));
                }
            } catch (e) {}
        } else {
            setPreviewAssetId('');
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => {
                if (key === 'photo' && formData.photo) {
                    data.append('photo', formData.photo);
                } else if (key !== 'photo' && key !== 'manual_override') {
                    if (formData[key] !== null && formData[key] !== '') {
                        data.append(key, formData[key]);
                    }
                }
            });

            await api.post('/assets', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('Equipment registered successfully!', 'success');
            setShowAddModal(false);
            setFormData({
                category_id: '',
                asset_id: '',
                manual_override: false,
                name: '',
                brand: '',
                model: '',
                serial_number: '',
                description: '',
                condition: 'excellent',
                status: 'available',
                location_id: '',
                purchase_date: '',
                purchase_price: '',
                warranty_expiry: '',
                notes: '',
                photo: null,
            });
            fetchData(1);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add asset. Check required fields.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Equipment Vault Inventory
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {pagination.total} registered production assets across {categories.length} categories
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Register New Asset</span>
                    </button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-4 shadow-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829FA1]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Asset ID, Name, Brand, Serial..."
                            className="w-full bg-[#162224] border border-[#2D4044] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642] transition"
                        />
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-[#090D17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-[#090D17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="checked_out">Checked Out</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="damaged">Damaged</option>
                            <option value="lost">Lost</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>

                    {/* Condition Filter */}
                    <div>
                        <select
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="w-full bg-[#090D17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                            <option value="">All Conditions</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="minor_damage">Minor Damage</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Asset Table / Grid */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Asset ID</th>
                                <th className="py-3.5 px-4">Equipment Details</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Condition</th>
                                <th className="py-3.5 px-4">Vault Location</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#829FA1]">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#386642]"></div>
                                        <div className="mt-2 text-xs">Searching Vault...</div>
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#829FA1]">
                                        <Boxes size={36} className="mx-auto mb-2 opacity-40 text-[#829FA1]" />
                                        <div className="text-sm font-semibold text-slate-300">No equipment found</div>
                                        <div className="text-xs text-[#829FA1] mt-1">
                                            Try adjusting your filters or search keywords.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className="hover:bg-[#243336] transition cursor-pointer"
                                        onClick={() => onSelectAsset(asset.id)}
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-[#FFEBCC]">
                                            {asset.asset_id}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-white text-sm">
                                                {asset.name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono">
                                                {asset.brand} {asset.model} • SN: {asset.serial_number}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                                                {asset.category?.name}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={asset.status} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <ConditionBadge condition={asset.condition} />
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 text-[11px]">
                                            {asset.location?.name || 'MTC Headquarters'}
                                        </td>
                                        <td
                                            className="py-3 px-4 text-right space-x-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => setPrintAsset(asset)}
                                                title="Print Label & QR"
                                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition"
                                            >
                                                <Printer size={15} />
                                            </button>
                                            <button
                                                onClick={() => onSelectAsset(asset.id)}
                                                title="View Full Details"
                                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                            >
                                                <Eye size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {pagination.last_page > 1 && (
                    <div className="p-4 border-t border-[#243249] bg-[#0F1626] flex items-center justify-between text-xs text-slate-400">
                        <div>
                            Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} items)
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.current_page === 1}
                                onClick={() => fetchData(pagination.current_page - 1)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white hover:bg-slate-700 transition flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => fetchData(pagination.current_page + 1)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white hover:bg-slate-700 transition flex items-center gap-1"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Print Label Modal */}
            <PrintAssetLabelModal
                isOpen={!!printAsset}
                onClose={() => setPrintAsset(null)}
                asset={printAsset}
            />

            {/* Register New Asset Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Register New Equipment Asset"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleAddAsset} className="space-y-4">
                    {/* Category & Asset ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Category *
                            </label>
                            <select
                                required
                                value={formData.category_id}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Asset ID *
                                </label>
                                <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.manual_override}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                manual_override: e.target.checked,
                                                asset_id: e.target.checked ? prev.asset_id : previewAssetId,
                                            }))
                                        }
                                        className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 w-3 h-3"
                                    />
                                    Manual Override
                                </label>
                            </div>
                            <input
                                type="text"
                                required
                                readOnly={!formData.manual_override}
                                value={formData.asset_id}
                                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                                placeholder="Auto-generated e.g. MTC-CAM-001"
                                className={`w-full font-mono text-xs px-3 py-2 rounded-xl border focus:outline-none transition ${
                                    formData.manual_override
                                        ? 'bg-slate-900 border-amber-500 text-amber-300'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Name, Brand, Model */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Equipment Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Sony FX6 Cinema Camera"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Brand *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                placeholder="e.g. Sony"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Model *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                placeholder="e.g. ILME-FX6V"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Serial Number *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.serial_number}
                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                placeholder="e.g. TEST-SERIAL-101"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* Condition, Status, Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Initial Condition *
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="minor_damage">Minor Damage</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Initial Status *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Location *
                            </label>
                            <select
                                required
                                value={formData.location_id}
                                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select Location</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Purchase Price & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Purchase Price ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Purchase Date
                            </label>
                            <input
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Warranty Expiry
                            </label>
                            <input
                                type="date"
                                value={formData.warranty_expiry}
                                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* Description & Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Description / Included Accessories
                        </label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g. Includes lens hood, front/rear caps, carry pouch..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Equipment Photo
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                            className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600"
                        />
                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold text-xs shadow-md shadow-[#386642]/20 transition"
                        >
                            {submitting ? 'Registering...' : 'Register Asset'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
