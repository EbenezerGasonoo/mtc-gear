import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function LocationsView() {
    const { canManageEquipment, showToast } = useAuth();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingLoc, setEditingLoc] = useState(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
        } catch (e) {
            showToast('Failed to load locations.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleOpenCreate = () => {
        setEditingLoc(null);
        setName('');
        setCode('');
        setAddress('');
        setDescription('');
        setShowModal(true);
    };

    const handleOpenEdit = (l) => {
        setEditingLoc(l);
        setName(l.name);
        setCode(l.code);
        setAddress(l.address || '');
        setDescription(l.description || '');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingLoc) {
                await api.put(`/locations/${editingLoc.id}`, { name, code, address, description });
                showToast('Location updated.', 'success');
            } else {
                await api.post('/locations', { name, code, address, description });
                showToast('Location created.', 'success');
            }
            setShowModal(false);
            fetchLocations();
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        Facilities & Vault Locations
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage studio vaults, field fleet units, and repair storage points
                    </p>
                </div>

                {canManageEquipment && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Add Location</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                {locations.map((loc) => (
                    <div
                        key={loc.id}
                        className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#386642]/20 text-[#FFEBCC] border border-[#386642]/50">
                                    {loc.code}
                                </span>
                                <span className="text-[11px] text-[#829FA1] font-mono">
                                    {loc.assets_count || 0} Assets
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-white">{loc.name}</h3>
                            <div className="text-xs text-[#CADEDF]/80 flex items-start gap-1">
                                <MapPin size={14} className="shrink-0 text-[#386642] mt-0.5" />
                                <span>{loc.address || 'Address not specified'}</span>
                            </div>
                            {loc.description && (
                                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                                    {loc.description}
                                </p>
                            )}
                        </div>

                        {canManageEquipment && (
                            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                                <button
                                    onClick={() => handleOpenEdit(loc)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingLoc ? 'Edit Location' : 'Create Location'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Location Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. MTC Studio B Vault"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Location Code *
                        </label>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. HQ-STUDIO-B"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Physical Address / Van Registration
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. Ridge Media Complex, Accra"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                            placeholder="Storage purpose..."
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
                            {submitting ? 'Saving...' : 'Save Location'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
