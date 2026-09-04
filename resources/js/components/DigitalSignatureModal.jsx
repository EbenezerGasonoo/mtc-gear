import React, { useState } from 'react';
import Modal from './Modal';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function DigitalSignatureModal({ isOpen, onClose, checkout, onSuccess }) {
    const { user, showToast } = useAuth();
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!checkout) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreed) {
            showToast('Please check the acknowledgment box to confirm receipt.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/checkouts/${checkout.id}/acknowledge`, {
                acknowledgment_text:
                    'I confirm that I have received this equipment and acknowledge responsibility for its safe use and return.',
            });
            showToast('Handover receipt signed successfully!', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to acknowledge handover.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Digital Equipment Handover Sign-off" maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                <div className="bg-[#386642]/20 border border-[#386642]/50 rounded-xl p-4 flex gap-3 text-[#FFEBCC]">
                    <ShieldCheck size={28} className="shrink-0 text-[#FFEBCC] mt-0.5" />
                    <div className="text-xs leading-relaxed">
                        <div className="font-bold text-sm text-white mb-1">
                            Official Custody Transfer
                        </div>
                        You are digitally signing for custody of <strong>{checkout.items?.length || 0} production assets</strong>{' '}
                        for project <strong>{checkout.request?.project_name}</strong>.
                    </div>
                </div>

                {/* Items Summary */}
                <div className="bg-[#162224] rounded-xl p-4 border border-[#2D4044] space-y-2 max-h-48 overflow-y-auto">
                    <div className="text-xs font-semibold text-[#829FA1] uppercase tracking-wider">
                        Assigned Equipment:
                    </div>
                    {checkout.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-[#2D4044] last:border-0">
                            <div>
                                <span className="font-mono text-[#FFEBCC] font-bold mr-2">{item.asset?.asset_id}</span>
                                <span className="text-[#CADEDF]">{item.asset?.name}</span>
                            </div>
                            <span className="text-[#829FA1] capitalize">{item.condition_before}</span>
                        </div>
                    ))}
                </div>

                {/* Legal Disclaimer */}
                <div className="p-4 bg-[#121A1C] rounded-xl border border-[#2D4044] text-xs text-[#CADEDF]/90 italic">
                    "I confirm that I have received the listed equipment in the condition stated above, and acknowledge full responsibility for its safe handling, operation, and timely return by {checkout.expected_return_date ? new Date(checkout.expected_return_date).toLocaleDateString() : 'the scheduled date'}."
                </div>

                {/* Signature Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#2D4044] bg-[#162224] cursor-pointer hover:bg-[#1D2729] transition">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-[#386642] focus:ring-[#386642] border-[#2D4044] bg-[#121A1C]"
                    />
                    <span className="text-xs text-[#CADEDF] font-medium select-none">
                        I, <strong className="text-white">{user?.name}</strong>, digitally confirm and sign this equipment handover agreement.
                    </span>
                </label>

                {/* Submit button */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#2D4044] text-[#CADEDF] hover:bg-[#1D2729] text-sm font-semibold transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !agreed}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#386642] hover:bg-[#2E5437] disabled:opacity-50 text-[#FFEBCC] text-sm font-bold shadow-lg shadow-[#386642]/20 transition"
                    >
                        <CheckCircle size={18} />
                        {submitting ? 'Signing...' : 'Confirm & Sign Handover'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
