import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';
import { Camera, Search } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
    const [manualCode, setManualCode] = useState('');
    const [scannerError, setScannerError] = useState('');
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode = null;

        if (isOpen) {
            setScannerError('');

            // Give DOM time to render reader div
            const timer = setTimeout(() => {
                const element = document.getElementById('qr-reader');
                if (!element) return;

                html5QrCode = new Html5Qrcode('qr-reader');
                scannerRef.current = html5QrCode;

                html5QrCode
                    .start(
                        { facingMode: 'environment' },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                        },
                        (decodedText) => {
                            // Extract ID if full URL
                            let assetId = decodedText;
                            if (decodedText.includes('/assets/')) {
                                assetId = decodedText.split('/assets/').pop().split('?')[0];
                            }
                            html5QrCode.stop().then(() => {
                                onScanSuccess(assetId);
                                onClose();
                            });
                        },
                        () => {
                            // ignore frame error
                        }
                    )
                    .catch(() => {
                        setScannerError(
                            'Camera access unavailable or permission denied. You can manually enter the Asset ID below.'
                        );
                    });
            }, 300);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current
                        .stop()
                        .then(() => scannerRef.current.clear())
                        .catch(() => {});
                }
            };
        }
    }, [isOpen]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        onScanSuccess(manualCode.trim());
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan Asset QR Code" maxWidth="max-w-md">
            <div className="space-y-4">
                {/* Camera View Area */}
                <div className="relative overflow-hidden rounded-xl bg-[#121A1C] border border-[#2D4044] min-h-[280px] flex items-center justify-center">
                    <div id="qr-reader" className="w-full"></div>
                    {scannerError && (
                        <div className="p-4 text-center text-xs text-[#FFEBCC] max-w-xs">
                            <Camera size={32} className="mx-auto mb-2 text-[#386642]" />
                            {scannerError}
                        </div>
                    )}
                </div>

                {/* Manual Code Input fallback */}
                <div className="pt-2 border-t border-[#2D4044]">
                    <label className="block text-xs font-semibold text-[#CADEDF] uppercase tracking-wider mb-2 font-sans">
                        Or Type Asset ID / Serial
                    </label>
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g. MTC-CAM-001"
                            className="flex-1 bg-[#162224] border border-[#2D4044] rounded-xl px-4 py-2 text-sm text-white font-mono placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642]"
                        />
                        <button
                            type="submit"
                            className="bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1.5 font-sans"
                        >
                            <Search size={16} />
                            Find
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
