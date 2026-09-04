import React, { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function CategoriesView() {
    const { canManageEquipment, showToast } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (e) {
            showToast('Failed to load categories.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setName('');
        setCode('');
        setDescription('');
        setShowModal(true);
    };

    const handleOpenEdit = (c) => {
        setEditingCategory(c);
        setName(c.name);
        setCode(c.code);
        setDescription(c.description || '');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, { name, code, description });
                showToast('Category updated.', 'success');
            } else {
                await api.post('/categories', { name, code, description });
                showToast('Category created.', 'success');
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (c) => {
        if (!confirm(`Delete category '${c.name}'?`)) return;
        try {
            await api.delete(`/categories/${c.id}`);
            showToast('Category deleted.', 'info');
            fetchCategories();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete category.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Equipment Categories
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage asset prefixes, classification codes, and category hierarchies
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Add Category</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                {categories.map((c) => (
                    <div
                        key={c.id}
                        className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#386642]/20 text-[#FFEBCC] border border-[#386642]/50">
                                    {c.code}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                    {c.assets_count || 0} Assets
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-white">{c.name}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {c.description || 'No description provided.'}
                            </p>
                        </div>

                        {canManageEquipment && (
                            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                                <button
                                    onClick={() => handleOpenEdit(c)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(c)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Edit Category' : 'Create Equipment Category'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Cinema Cameras"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Classification Code (3-4 Letters) *
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. CAM"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Description
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short summary of gear in this category..."
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold transition disabled:opacity-50 shadow-md shadow-[#386642]/20 font-sans"
                        >
                            {submitting ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
