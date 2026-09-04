import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import { RoleBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function UsersView() {
    const { showToast } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        department: '',
        status: 'active',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data);
        } catch (e) {
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/users', formData);
            showToast('User created successfully.', 'success');
            setShowCreateModal(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                phone: '',
                department: '',
                status: 'active',
            });
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create user.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        User & Role Management
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage MTC personnel access, permissions, and departmental assignments
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-[#386642]/20 transition font-sans"
                >
                    <Plus size={16} className="stroke-[3]" />
                    <span>Create User</span>
                </button>
            </div>

            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2D4044] bg-[#162224] text-[11px] font-bold text-[#CADEDF] uppercase tracking-wider">
                                <th className="py-3.5 px-4">Name & Email</th>
                                <th className="py-3.5 px-4">System Role</th>
                                <th className="py-3.5 px-4">Department</th>
                                <th className="py-3.5 px-4">Phone</th>
                                <th className="py-3.5 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D4044] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                        <div className="mt-2 text-xs">Loading users...</div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-white text-sm">{u.name}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            {u.department || 'General Staff'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 font-mono">
                                            {u.phone || '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                                    u.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                }`}
                                            >
                                                {u.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Authorized User"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Kwame Mensah"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="kwame@mtc.local"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                            Initial Password *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Minimum 8 characters"
                            className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                System Role *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="staff">Staff / Crew</option>
                                <option value="gear_overseer">Gear Overseer</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="viewer">Viewer (Read-Only)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Account Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Department
                            </label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="e.g. Cinematography"
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+233 24 ..."
                                className="w-full bg-[#090D17] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                            />
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
                            {submitting ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
