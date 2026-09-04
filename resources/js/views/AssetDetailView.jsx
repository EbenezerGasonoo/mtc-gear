import React, { useEffect, useState } from 'react';
import {
    ChevronLeft,
    Printer,
    Download,
    Edit2,
    Calendar,
    Clock,
    User,
    MapPin,
    Tag,
    FileText,
    Wrench,
    AlertTriangle,
    ShieldCheck,
    History,
    Boxes
} from 'lucide-react';
import QRCode from 'qrcode';
import api from '../api';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import PrintAssetLabelModal from '../components/PrintAssetLabelModal';

export default function AssetDetailView({ assetId, onBack, onOpenRequestWithAsset }) {
    const { canManageEquipment, showToast } = useAuth();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);

    const fetchAsset = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/assets/${assetId}`);
            setAsset(res.data.asset);

            // Generate QR code for scanning
            const url = `${window.location.origin}/assets/${res.data.asset.id}`;
            QRCode.toDataURL(url, {
                width: 200,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
            }).then(setQrDataUrl);
        } catch (err) {
            console.error(err);
            showToast('Failed to load asset details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assetId) fetchAsset();
    }, [assetId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Asset not found.</p>
                <button onClick={onBack} className="mt-4 text-xs text-amber-400 hover:underline">
                    ← Back to Inventory
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                    <ChevronLeft size={16} />
                    Back to Inventory
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPrintModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    >
                        <Printer size={15} />
                        <span>Print Label & QR</span>
                    </button>

                    {asset.status === 'available' && (
                        <button
                            onClick={() => onOpenRequestWithAsset(asset)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] text-xs font-bold transition shadow-sm font-sans"
                        >
                            + Request Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Hero Asset Card */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl relative overflow-hidden font-sans">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Primary Photo or Placeholder */}
                    <div className="w-full md:w-56 h-56 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {asset.primary_photo?.file_path ? (
                            <img
                                src={`/storage/${asset.primary_photo.file_path}`}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center p-4 text-slate-600">
                                <Boxes size={48} className="mx-auto mb-2 opacity-30" />
                                <div className="text-xs font-mono">No Photo Uploaded</div>
                            </div>
                        )}
                    </div>

                    {/* Metadata & Badges */}
                    <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-[#386642]/20 border border-[#386642]/50 text-[#FFEBCC]">
                                {asset.asset_id}
                            </span>
                            <StatusBadge status={asset.status} />
                            <ConditionBadge condition={asset.condition} />
                            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {asset.category?.name}
                            </span>
                        </div>

                        <h2 className="text-2xl font-black text-white tracking-wide">
                            {asset.name}
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                            <div>
                                <span className="text-slate-500 block">Brand & Model:</span>
                                <span className="text-slate-200 font-semibold">{asset.brand} {asset.model}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Serial Number:</span>
                                <span className="text-slate-200 font-mono font-bold">{asset.serial_number}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Location:</span>
                                <span className="text-slate-200 font-medium">{asset.location?.name}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Assigned Borrower:</span>
                                <span className="text-slate-200 font-medium">
                                    {asset.assigned_user?.name || 'In Vault (Unassigned)'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Purchase Value:</span>
                                <span className="text-slate-200 font-mono">
                                    {asset.purchase_price ? `$${parseFloat(asset.purchase_price).toFixed(2)}` : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Warranty Until:</span>
                                <span className="text-slate-200">
                                    {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Preview Box */}
                    <div className="hidden lg:flex flex-col items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0">
                        {qrDataUrl && (
                            <img src={qrDataUrl} alt="QR" className="w-28 h-28 rounded bg-white p-1" />
                        )}
                        <span className="text-[10px] font-mono text-slate-400 mt-1.5 font-bold">
                            {asset.asset_id}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-[#243249] flex gap-2">
                {[
                    { id: 'overview', label: 'Overview & Specs', icon: FileText },
                    { id: 'history', label: `History Trail (${asset.history?.length || 0})`, icon: History },
                    { id: 'maintenance', label: `Maintenance (${asset.maintenance_records?.length || 0})`, icon: Wrench },
                    { id: 'incidents', label: `Incidents (${asset.incidents?.length || 0})`, icon: AlertTriangle },
                ].map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
                                active
                                    ? 'border-[#386642] text-[#FFEBCC]'
                                    : 'border-transparent text-[#CADEDF]/70 hover:text-white'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl p-6 shadow-xl">
                {activeTab === 'overview' && (
                    <div className="space-y-4 text-xs leading-relaxed">
                        <div>
                            <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-1">
                                Description & Included Rigging
                            </h4>
                            <p className="text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
                                {asset.description || 'No description provided.'}
                            </p>
                        </div>

                        {asset.notes && (
                            <div>
                                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Internal Gear Room Notes
                                </h4>
                                <p className="text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 italic">
                                    {asset.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="text-xs text-slate-400">
                            Immutable chronological event log for {asset.asset_id}:
                        </div>
                        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
                            {asset.history?.map((h) => (
                                <div key={h.id} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#386642] border-2 border-[#1D2729] shadow"></div>

                                    <div className="bg-[#162224] border border-[#2D4044] p-3.5 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[#FFEBCC] font-bold uppercase text-[11px] bg-[#1D2729] border border-[#2D4044] px-2 py-0.5 rounded">
                                                    {h.action.replace('_', ' ')}
                                                </span>
                                                {h.project_name && (
                                                    <span className="text-xs font-semibold text-white">
                                                        Project: {h.project_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {new Date(h.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-300 pt-1">
                                            {h.notes}
                                        </div>

                                        {h.user && (
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                By: <span className="text-slate-400">{h.user.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-3">
                        {asset.maintenance_records?.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                                No maintenance or service records logged for this asset.
                            </div>
                        ) : (
                            asset.maintenance_records?.map((m) => (
                                <div key={m.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between text-xs">
                                    <div className="space-y-1">
                                        <div className="font-bold text-white text-sm">
                                            {m.issue_description}
                                        </div>
                                        <div className="text-slate-400">
                                            Provider: {m.provider_name || 'In-house Technical Lab'}
                                        </div>
                                        {m.cost && (
                                            <div className="text-amber-400 font-mono font-bold">
                                                Cost: ${parseFloat(m.cost).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            {m.status}
                                        </span>
                                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                            {m.scheduled_date}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="space-y-3">
                        {asset.incidents?.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                                Clean record. No damage or fault incidents recorded.
                            </div>
                        ) : (
                            asset.incidents?.map((inc) => (
                                <div key={inc.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-bold text-white">
                                            <span className="font-mono text-red-400">{inc.incident_number}</span>
                                            <span className="capitalize text-slate-300">[{inc.type}]</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                                            Severity: {inc.severity}
                                        </span>
                                    </div>

                                    <div className="text-slate-300 leading-relaxed">
                                        {inc.description}
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                                        <div>Reported by: {inc.reported_by?.name || 'Staff'}</div>
                                        <div className="font-mono">{inc.incident_date}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Print Modal */}
            <PrintAssetLabelModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                asset={asset}
            />
        </div>
    );
}
