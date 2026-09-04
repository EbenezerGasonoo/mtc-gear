import React, { useEffect, useState } from 'react';
import { Settings, Save, ShieldCheck, Palette, Building, DollarSign } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SettingsView() {
    const { showToast } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [settings, setSettings] = useState({
        branding_app_name: 'MTC GEAR',
        branding_subtitle: 'Equipment Inventory & Deployment Management',
        branding_organization: 'Mountain Top Communications',
        branding_primary_color: '#386642',
        branding_currency: 'USD',
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            setSettings((prev) => ({
                ...prev,
                branding_app_name: res.data.branding_app_name || prev.branding_app_name,
                branding_subtitle: res.data.branding_subtitle || prev.branding_subtitle,
                branding_organization: res.data.branding_organization || prev.branding_organization,
                branding_primary_color: res.data.branding_primary_color || prev.branding_primary_color,
                branding_currency: res.data.branding_currency || prev.branding_currency,
            }));
        } catch (e) {
            showToast('Failed to load branding configuration.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/settings', { settings });
            showToast('Central branding and configuration saved.', 'success');
        } catch (err) {
            showToast('Failed to update settings.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl font-sans">
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    Central Branding & System Configuration
                </h2>
                <p className="text-xs text-[#829FA1] mt-0.5">
                    Customize MTC production branding, currency defaults, and organization labels
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
                <div>
                    <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                        Application Brand Name
                    </label>
                    <input
                        type="text"
                        required
                        value={settings.branding_app_name}
                        onChange={(e) => setSettings({ ...settings, branding_app_name: e.target.value })}
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#386642]"
                    />
                </div>

                <div>
                    <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                        Application Subtitle
                    </label>
                    <input
                        type="text"
                        required
                        value={settings.branding_subtitle}
                        onChange={(e) => setSettings({ ...settings, branding_subtitle: e.target.value })}
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                    />
                </div>

                <div>
                    <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                        Parent Organization Name
                    </label>
                    <input
                        type="text"
                        required
                        value={settings.branding_organization}
                        onChange={(e) => setSettings({ ...settings, branding_organization: e.target.value })}
                        className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                            Brand Accent Color (Hunter Green: #386642)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.branding_primary_color}
                                onChange={(e) => setSettings({ ...settings, branding_primary_color: e.target.value })}
                                className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={settings.branding_primary_color}
                                onChange={(e) => setSettings({ ...settings, branding_primary_color: e.target.value })}
                                className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#386642]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-[#CADEDF] uppercase tracking-wider mb-1">
                            Currency Unit
                        </label>
                        <select
                            value={settings.branding_currency}
                            onChange={(e) => setSettings({ ...settings, branding_currency: e.target.value })}
                            className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="GHS">GHS (GH₵)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="ZAR">ZAR (R)</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#2D4044] flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#386642]/20 disabled:opacity-50 font-sans"
                    >
                        <Save size={16} />
                        <span>{submitting ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
