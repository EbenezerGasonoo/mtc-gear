import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div
                className={`relative w-full ${maxWidth} bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-2xl overflow-hidden z-10 my-8 transform transition-all text-[#CADEDF] flex flex-col max-h-[90vh]`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D4044] bg-[#162224]">
                    <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 font-sans">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#829FA1] hover:text-[#FFEBCC] hover:bg-[#243336] transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
