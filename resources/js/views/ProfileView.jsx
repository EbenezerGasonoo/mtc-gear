import React, { useState } from 'react';
import { User, Lock, Phone, Building, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { RoleBadge } from '../components/Badge';

export default function ProfileView() {
    const { user, refreshUser, showToast } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name,
                phone,
                department,
            };

            if (newPassword) {
                payload.current_password = currentPassword;
                payload.new_password = newPassword;
                payload.new_password_confirmation = newPasswordConfirmation;
            }

            await api.put('/profile', payload);
            showToast('Profile updated successfully.', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirmation('');
            refreshUser();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl font-sans">
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    Personnel Profile & Security
                </h2>
                <p className="text-xs text-[#829FA1] mt-0.5">
                    Manage your contact information, credentials, and access credentials
                </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
                {/* User Role Card */}
                <div className="p-4 rounded-xl bg-[#162224] border border-[#2D4044] flex items-center justify-between">
                    <div>
                        <div className="text-white font-bold text-sm">{user?.name}</div>
                        <div className="text-[#829FA1] font-mono text-[11px]">{user?.email}</div>
                    </div>
                    <div>
                        <RoleBadge role={user?.role} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+233 24 100 0000"
                            className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#386642]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                        Production Unit / Department
                    </label>
                    <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Cinematography"
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                    />
                </div>

                {/* Password Change Section */}
                <div className="pt-4 border-t border-[#2D4044] space-y-3">
                    <div className="font-bold text-[#CADEDF] uppercase tracking-wider text-[11px]">
                        Change Account Password (Optional)
                    </div>

                    <div>
                        <label className="block text-[#829FA1] mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[#829FA1] mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                            />
                        </div>
                        <div>
                            <label className="block text-[#829FA1] mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={newPasswordConfirmation}
                                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#2D4044] flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#386642]/20 disabled:opacity-50 font-sans"
                    >
                        <Save size={16} />
                        <span>{submitting ? 'Saving...' : 'Update Profile'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
