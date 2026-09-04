import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';
import { Printer, Download } from 'lucide-react';
import { MtcIcon } from './MtcLogo';

export default function PrintAssetLabelModal({ isOpen, onClose, asset }) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const labelRef = useRef(null);

    useEffect(() => {
        if (asset && isOpen) {
            const url = `${window.location.origin}/assets/${asset.id}`;
            QRCode.toDataURL(url, {
                width: 240,
                margin: 1,
                color: {
                    dark: '#1D2729', // Oxford Blue for crisp print
                    light: '#ffffff',
                },
            }).then(setQrDataUrl);
        }
    }, [asset, isOpen]);

    if (!asset) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${asset.asset_id}</title>
                    <style>
                        @page { size: 80mm 50mm; margin: 0; }
                        body {
                            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0;
                            padding: 8px;
                            box-sizing: border-box;
                            width: 80mm;
                            height: 50mm;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            border: 1px dashed #386642;
                        }
                        .info {
                            flex: 1;
                            padding-right: 8px;
                        }
                        .header {
                            font-size: 10px;
                            font-weight: 800;
                            letter-spacing: 0.5px;
                            color: #386642;
                            margin-bottom: 2px;
                        }
                        .sub {
                            font-size: 8px;
                            color: #555;
                            margin-bottom: 6px;
                            text-transform: uppercase;
                        }
                        .id {
                            font-family: 'JetBrains Mono', monospace;
                            font-size: 14px;
                            font-weight: 900;
                            background: #1D2729;
                            color: #FFEBCC;
                            display: inline-block;
                            padding: 2px 6px;
                            border-radius: 4px;
                            margin-bottom: 4px;
                        }
                        .name {
                            font-size: 11px;
                            font-weight: bold;
                            color: #111;
                            line-height: 1.2;
                            margin-bottom: 2px;
                        }
                        .serial {
                            font-size: 8px;
                            font-family: 'JetBrains Mono', monospace;
                            color: #444;
                        }
                        .qr-box {
                            width: 85px;
                            height: 85px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .qr-box img {
                            width: 100%;
                            height: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="info">
                        <div class="header">MOUNTAIN TOP COMMUNICATIONS</div>
                        <div class="sub">MTC GEAR ASSET MANAGEMENT</div>
                        <div class="id">${asset.asset_id}</div>
                        <div class="name">${asset.name}</div>
                        <div class="serial">SN: ${asset.serial_number}</div>
                    </div>
                    <div class="qr-box">
                        <img src="${qrDataUrl}" alt="QR" />
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadQr = () => {
        const link = document.createElement('a');
        link.download = `QR-${asset.asset_id}.png`;
        link.href = qrDataUrl;
        link.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asset Label & QR Code" maxWidth="max-w-md">
            <div className="flex flex-col items-center gap-6">
                {/* Visual Label Card */}
                <div
                    ref={labelRef}
                    className="w-full bg-white text-slate-900 p-5 rounded-xl shadow-lg border-2 border-[#386642]/30 flex items-center justify-between gap-4 font-sans"
                >
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                            <MtcIcon size={18} bg="#386642" peakColor="#FFEBCC" rounded="rounded-sm" />
                            <span className="text-[10px] font-extrabold tracking-wider text-[#386642] uppercase font-sans">
                                Mountain Top Communications
                            </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-semibold tracking-wide uppercase">
                            MTC Gear Asset Tag
                        </div>

                        <div className="pt-1">
                            <span className="inline-block bg-[#1D2729] text-[#FFEBCC] font-mono font-black text-sm px-2.5 py-1 rounded shadow">
                                {asset.asset_id}
                            </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 leading-tight pt-1">
                            {asset.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                            SN: <span className="font-semibold text-slate-800">{asset.serial_number}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Asset QR" className="w-24 h-24 object-contain" />
                        ) : (
                            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                                Generating...
                            </div>
                        )}
                        <span className="text-[9px] font-mono font-bold text-[#386642] mt-1">MTC GEAR TAG</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-[#386642]/20 transition"
                    >
                        <Printer size={18} />
                        Print Asset Label
                    </button>
                    <button
                        onClick={handleDownloadQr}
                        className="flex items-center justify-center gap-2 bg-[#162224] hover:bg-[#1D2729] text-[#CADEDF] font-semibold py-2.5 px-4 rounded-xl border border-[#2D4044] transition"
                    >
                        <Download size={18} />
                        Download QR
                    </button>
                </div>
            </div>
        </Modal>
    );
}
