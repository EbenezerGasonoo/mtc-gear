import React, { useEffect, useState } from 'react';
import { Package, Plus, ArrowRight, CheckCircle2, Boxes, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function KitsView({ onRequestKit }) {
    const { canManageEquipment, showToast } = useAuth();
    const [kits, setKits] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        category_id: '',
        selected_assets: [],
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchKits = async () => {
        setLoading(true);
        try {
            const res = await api.get('/kits');
            setKits(res.data);
        } catch (e) {
            showToast('Failed to load gear kits.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadDependencies = async () => {
        try {
            const [assetsRes, catsRes] = await Promise.all([
                api.get('/assets', { params: { per_page: 100 } }),
                api.get('/categories'),
            ]);
            setAssets(assetsRes.data.data);
            setCategories(catsRes.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchKits();
        loadDependencies();
    }, []);

    const handleCreateKit = async (e) => {
        e.preventDefault();
        if (formData.selected_assets.length === 0) {
            showToast('Please select at least one asset for the kit.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/kits', {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                category_id: formData.category_id || undefined,
                items: formData.selected_assets.map((id) => ({
                    asset_id: id,
                    quantity: 1,
                    is_required: true,
                })),
            });

            showToast('Gear Kit created successfully!', 'success');
            setShowCreateModal(false);
            setFormData({
                name: '',
                code: '',
                description: '',
                category_id: '',
                selected_assets: [],
            });
            fetchKits();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create kit.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Production Gear Kits & Bundles
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Pre-configured turnkey gear packages for fast deployment and single-click requests
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Create Gear Kit</span>
                    </button>
                )}
            </div>

            {/* Kits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {loading ? (
                    <div className="col-span-full py-16 text-center text-[#829FA1]">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#386642]"></div>
                        <div className="mt-2 text-xs">Loading kits...</div>
                    </div>
                ) : kits.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-[#829FA1] bg-[#1D2729] rounded-2xl border border-[#2D4044]">
                        <Package size={40} className="mx-auto mb-2 opacity-40 text-[#829FA1]" />
                        <div className="text-sm font-semibold text-slate-300">No Gear Kits Configured</div>
                    </div>
                ) : (
                    kits.map((kit) => (
                        <div
                            key={kit.id}
                            className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-[#386642]/60 transition group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-[#FFEBCC] px-2 py-0.5 rounded bg-[#386642]/20 border border-[#386642]/50">
                                        {kit.code}
                                    </span>
                                    <span className="text-[10px] text-[#829FA1] font-mono">
                                        {kit.items?.length || 0} Assets
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-white group-hover:text-[#FFEBCC] transition font-sans">
                                        {kit.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        {kit.description || 'Pre-configured production kit.'}
                                    </p>
                                </div>

                                {/* Included Assets list */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Constituent Assets:
                                    </div>
                                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                        {kit.items?.map((item) => (
                                            <div
                                                key={item.id}
                                                className="text-xs flex items-center justify-between text-slate-300 py-0.5"
                                            >
                                                <div className="truncate pr-2">
                                                    <span className="font-mono text-amber-400/80 mr-1.5 font-semibold text-[11px]">
                                                        {item.asset?.asset_id}
                                                    </span>
                                                    <span>{item.asset?.name}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-400 font-mono shrink-0 capitalize">
                                                    {item.asset?.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4 mt-4 border-t border-[#2D4044]">
                                <button
                                    onClick={() => onRequestKit(kit)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#162224] hover:bg-[#386642] text-[#CADEDF] hover:text-[#FFEBCC] font-bold text-xs border border-[#2D4044] hover:border-[#386642] transition shadow-sm font-sans"
                                >
                                    <span>Request Entire Kit</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Kit Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Assemble New Production Gear Kit"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleCreateKit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Kit Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Studio Interview Kit"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Kit Code *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. KIT-INT-001"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Description & Recommended Deployment
                        </label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Complete solo shooting kit including primary camera, fast zoom, wireless lavs..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Asset Checklist */}
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Select Constituent Equipment Assets ({formData.selected_assets.length} selected) *
                        </label>
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950 p-2">
                            {assets.map((a) => {
                                const isChecked = formData.selected_assets.includes(a.id);
                                return (
                                    <label
                                        key={a.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-slate-900 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        selected_assets: [...formData.selected_assets, a.id],
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        selected_assets: formData.selected_assets.filter(
                                                            (id) => id !== a.id
                                                        ),
                                                    });
                                                }
                                            }}
                                            className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                                        />
                                        <div>
                                            <span className="font-mono text-amber-400 font-bold mr-2">{a.asset_id}</span>
                                            <span className="text-white font-medium">{a.name}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
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
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Creating...' : 'Create Kit'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
