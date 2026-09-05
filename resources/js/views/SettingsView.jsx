import React, { useEffect, useState } from 'react';
import {
    Settings,
    Save,
    Palette,
    Bell,
    Send,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Mail,
    PhoneCall,
    ExternalLink,
    RefreshCw,
    MessageSquare
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SettingsView() {
    const { showToast } = useAuth();
    const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'alerts'

    // Branding Settings State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        branding_app_name: 'MTC GEAR',
        branding_subtitle: 'Equipment Inventory & Deployment Management',
        branding_organization: 'Mountain Top Communications',
        branding_primary_color: '#386642',
        branding_currency: 'USD',
    });

    // Webhooks / Alerts State
    const [webhooks, setWebhooks] = useState([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);
    const [testingWebhookId, setTestingWebhookId] = useState(null);
    const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
    const [savingWebhook, setSavingWebhook] = useState(false);

    const [webhookForm, setWebhookForm] = useState({
        name: '',
        service_type: 'whatsapp',
        url: '',
        phone_number: '',
        secret: '',
        events: [
            'request.created',
            'request.approved',
            'checkout.completed',
            'return.completed',
            'incident.reported',
            'checkout.overdue',
        ],
        is_active: true,
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

    const fetchWebhooks = async () => {
        setLoadingWebhooks(true);
        try {
            const res = await api.get('/webhooks');
            setWebhooks(res.data || []);
        } catch (e) {
            showToast('Failed to load webhook channels.', 'error');
        } finally {
            setLoadingWebhooks(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchWebhooks();
    }, []);

    const handleSaveSettings = async (e) => {
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

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        setSavingWebhook(true);
        try {
            const res = await api.post('/webhooks', webhookForm);
            setWebhooks([res.data, ...webhooks]);
            setIsAddWebhookOpen(false);
            setWebhookForm({
                name: '',
                service_type: 'whatsapp',
                url: '',
                phone_number: '',
                secret: '',
                events: [
                    'request.created',
                    'request.approved',
                    'checkout.completed',
                    'return.completed',
                    'incident.reported',
                    'checkout.overdue',
                ],
                is_active: true,
            });
            showToast('WhatsApp alert endpoint registered successfully.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create webhook.', 'error');
        } finally {
            setSavingWebhook(false);
        }
    };

    const handleDeleteWebhook = async (id) => {
        if (!confirm('Are you sure you want to remove this alert webhook?')) return;
        try {
            await api.delete(`/webhooks/${id}`);
            setWebhooks(webhooks.filter((w) => w.id !== id));
            showToast('Alert webhook deleted.', 'success');
        } catch (e) {
            showToast('Failed to delete webhook.', 'error');
        }
    };

    const handleTestWebhook = async (id) => {
        setTestingWebhookId(id);
        try {
            const res = await api.post(`/webhooks/${id}/test`);
            const status = res.data.result?.status;
            if (res.data.result?.success) {
                showToast(`Test ping succeeded! HTTP ${status}`, 'success');
            } else {
                showToast(`Test failed with status HTTP ${status}`, 'error');
            }
            // Refresh webhooks to get updated last_triggered_at & last_status_code
            fetchWebhooks();
        } catch (e) {
            showToast('Failed to fire test alert ping.', 'error');
        } finally {
            setTestingWebhookId(null);
        }
    };

    const toggleEvent = (eventName) => {
        setWebhookForm((prev) => {
            const exists = prev.events.includes(eventName);
            return {
                ...prev,
                events: exists
                    ? prev.events.filter((ev) => ev !== eventName)
                    : [...prev.events, eventName],
            };
        });
    };

    return (
        <div className="space-y-6 max-w-4xl font-sans">
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    System Configuration & Automated Alerts
                </h2>
                <p className="text-xs text-[#CADEDF] mt-0.5">
                    Configure MTC branding, currency defaults, transactional emails, and live WhatsApp webhook dispatchers.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#2D4044]">
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'branding'
                            ? 'border-[#386642] text-[#FFEBCC] bg-[#1D2729]'
                            : 'border-transparent text-[#CADEDF] hover:text-white'
                    }`}
                >
                    <Palette className="w-4 h-4" />
                    <span>General & Branding</span>
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'alerts'
                            ? 'border-[#386642] text-[#FFEBCC] bg-[#1D2729]'
                            : 'border-transparent text-[#CADEDF] hover:text-white'
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    <span>Email & WhatsApp Alerts</span>
                    {webhooks.length > 0 && (
                        <span className="bg-[#386642] text-[#FFEBCC] text-[10px] px-1.5 py-0.5 rounded-full">
                            {webhooks.length}
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: Branding Configuration */}
            {activeTab === 'branding' && (
                <form onSubmit={handleSaveSettings} className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
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
                            className="flex items-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#386642]/20 disabled:opacity-50 font-sans cursor-pointer"
                        >
                            <Save size={16} />
                            <span>{submitting ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 2: Email & WhatsApp Alerts */}
            {activeTab === 'alerts' && (
                <div className="space-y-6">
                    {/* Email Dispatch Card */}
                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-[#386642]/20 border border-[#386642] rounded-lg text-[#FFEBCC]">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Transactional HTML Email Engine</h3>
                                    <p className="text-xs text-[#CADEDF]">
                                        Branded HTML notifications dispatched automatically to requesters and equipment overseers.
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                            </span>
                        </div>
                        <div className="bg-[#162224] p-3 rounded-xl border border-[#2D4044] text-xs text-[#CADEDF] grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <span className="text-[#CADEDF]/60 block text-[10px] uppercase font-semibold">Active Template</span>
                                <span className="text-white font-medium">MTC Oxford & Hunter Theme</span>
                            </div>
                            <div>
                                <span className="text-[#CADEDF]/60 block text-[10px] uppercase font-semibold">Recipients</span>
                                <span className="text-white font-medium">Requesters & Overseers</span>
                            </div>
                            <div>
                                <span className="text-[#CADEDF]/60 block text-[10px] uppercase font-semibold">Triggered Events</span>
                                <span className="text-white font-medium">All Lifecycle Changes</span>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Alert Channels Card */}
                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-emerald-900/30 border border-emerald-500/40 rounded-lg text-emerald-300">
                                    <MessageSquare className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-white">WhatsApp Automated Alert Channels</h3>
                                    <p className="text-xs text-[#CADEDF]">
                                        Dispatch formatted WhatsApp alert payloads to Twilio, Meta Cloud API, or automation webhooks (Make / Zapier).
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddWebhookOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#386642] hover:bg-[#4a8257] text-[#FFEBCC] rounded-xl text-xs font-bold transition shadow cursor-pointer self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add WhatsApp Webhook</span>
                            </button>
                        </div>

                        {/* Webhook List Table */}
                        {loadingWebhooks ? (
                            <div className="p-8 text-center text-[#CADEDF]">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#FFEBCC]" />
                                <p className="text-xs">Loading alert webhooks...</p>
                            </div>
                        ) : webhooks.length === 0 ? (
                            <div className="p-8 text-center text-[#CADEDF] bg-[#162224] rounded-xl border border-[#2D4044]">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#FFEBCC]" />
                                <p className="text-xs font-medium text-white">No WhatsApp webhooks configured yet.</p>
                                <p className="text-[11px] text-[#CADEDF]/70 mt-1 max-w-md mx-auto">
                                    Click "Add WhatsApp Webhook" to connect your team's WhatsApp bot or group automation webhook.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {webhooks.map((w) => (
                                    <div
                                        key={w.id}
                                        className="bg-[#162224] border border-[#2D4044] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-xs">{w.name}</span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 uppercase">
                                                    {w.service_type}
                                                </span>
                                                {w.last_status_code && (
                                                    <span
                                                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                                            w.last_status_code === 200
                                                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                                                : 'bg-red-950/40 text-red-400 border-red-500/30'
                                                        }`}
                                                    >
                                                        HTTP {w.last_status_code}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-[#CADEDF]/70 font-mono truncate max-w-lg">
                                                {w.url}
                                            </div>

                                            {w.phone_number && (
                                                <div className="text-[11px] text-[#FFEBCC] font-mono flex items-center gap-1">
                                                    <PhoneCall className="w-3 h-3 text-[#386642]" />
                                                    <span>Target: {w.phone_number}</span>
                                                </div>
                                            )}

                                            <div className="text-[10px] text-[#CADEDF]/60">
                                                Subscribed to: {w.events ? w.events.join(', ') : 'All events'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                onClick={() => handleTestWebhook(w.id)}
                                                disabled={testingWebhookId === w.id}
                                                className="px-3 py-1.5 bg-[#1D2729] hover:bg-[#253335] text-[#FFEBCC] border border-[#2D4044] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                                title="Dispatch test alert to verify connectivity"
                                            >
                                                <Send className={`w-3.5 h-3.5 ${testingWebhookId === w.id ? 'animate-bounce' : ''}`} />
                                                <span>{testingWebhookId === w.id ? 'Pinging...' : 'Test Ping'}</span>
                                            </button>

                                            <button
                                                onClick={() => handleDeleteWebhook(w.id)}
                                                className="p-1.5 text-[#CADEDF]/60 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                                title="Delete webhook"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formatted WhatsApp Message Preview */}
                    <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-5 shadow-xl text-xs space-y-3">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <span>📱 Formatted WhatsApp Dispatch Preview</span>
                        </h4>
                        <div className="bg-[#121A1C] border border-[#2D4044] rounded-xl p-4 font-mono text-[11px] text-[#CADEDF] leading-relaxed whitespace-pre-wrap">
{`⛰️ *MTC GEAR ALERT: NEW GEAR REQUEST SUBMITTED*
----------------------------------------
Ebenezer Gasonoo has submitted a new gear request for project 'Documentary Film Shoot'.

*📋 Details:*
• *Project:* Documentary Film Shoot
• *Requester:* Ebenezer Gasonoo
• *Start Date:* 2026-09-08
• *Return Date:* 2026-09-12
• *Location:* Studio A

🔗 *Link:* https://mtc-gear.onrender.com/requests/42
----------------------------------------
_Mountain Top Communications • Equipment Custody_`}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add WhatsApp Webhook */}
            {isAddWebhookOpen && (
                <Modal
                    isOpen={isAddWebhookOpen}
                    onClose={() => setIsAddWebhookOpen(false)}
                    title="Add WhatsApp / Alert Webhook Channel"
                >
                    <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs text-[#CADEDF]">
                        <div>
                            <label className="block font-semibold text-white uppercase tracking-wider mb-1">
                                Webhook Channel Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Production Team WhatsApp Group"
                                value={webhookForm.name}
                                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                                className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#386642]"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-white uppercase tracking-wider mb-1">
                                Webhook Target URL
                            </label>
                            <input
                                type="url"
                                required
                                placeholder="https://api.twilio.com/... or Zapier/Make Webhook URL"
                                value={webhookForm.url}
                                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                                className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#386642]"
                            />
                            <p className="text-[10px] text-[#CADEDF]/60 mt-1">
                                Enter your WhatsApp API gateway URL, Twilio function, or Make/Zapier webhook.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-white uppercase tracking-wider mb-1">
                                    Target Phone / Group ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="+233201234567 or Group ID"
                                    value={webhookForm.phone_number}
                                    onChange={(e) => setWebhookForm({ ...webhookForm, phone_number: e.target.value })}
                                    className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#386642]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-white uppercase tracking-wider mb-1">
                                    Bearer Token / Secret (Optional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Optional Authorization Secret"
                                    value={webhookForm.secret}
                                    onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                                    className="w-full bg-[#162224] border border-[#2D4044] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#386642]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-white uppercase tracking-wider mb-2">
                                Subscribed Notification Events
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#162224] p-3 rounded-xl border border-[#2D4044]">
                                {[
                                    { id: 'request.created', label: 'New Gear Request' },
                                    { id: 'request.approved', label: 'Request Approved' },
                                    { id: 'request.rejected', label: 'Request Declined' },
                                    { id: 'checkout.completed', label: 'Equipment Checked Out' },
                                    { id: 'return.completed', label: 'Equipment Returned' },
                                    { id: 'incident.reported', label: 'Damage / Incident Logged' },
                                    { id: 'checkout.overdue', label: 'Overdue Equipment Alert' },
                                ].map((ev) => (
                                    <label key={ev.id} className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={webhookForm.events.includes(ev.id)}
                                            onChange={() => toggleEvent(ev.id)}
                                            className="accent-[#386642] w-4 h-4 rounded"
                                        />
                                        <span className="text-xs text-[#CADEDF]">{ev.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#2D4044] flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddWebhookOpen(false)}
                                className="px-4 py-2 bg-[#162224] hover:bg-[#253335] text-[#CADEDF] border border-[#2D4044] rounded-xl font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingWebhook}
                                className="px-5 py-2 bg-[#386642] hover:bg-[#4a8257] text-[#FFEBCC] font-bold rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                            >
                                {savingWebhook ? 'Saving...' : 'Register Webhook'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
