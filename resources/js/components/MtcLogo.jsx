import React from 'react';

/**
 * Official Mountain Top Communications Logo Icon
 * Features the iconic 3-peaks mountain symbol with the central cross encapsulated in a rounded square.
 * Matches pages 10, 11, 12, 21 of the MTC Brand Guideline.
 */
export function MtcIcon({ 
    size = 40, 
    className = '', 
    bg = '#386642', // Default: Hunter Green (#386642)
    peakColor = '#FFEBCC', // Default: Cornsilk (#FFEBCC)
    rounded = 'rounded-xl'
}) {
    return (
        <div 
            style={{ width: size, height: size, backgroundColor: bg }}
            className={`flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md ${rounded} ${className}`}
        >
            <svg
                viewBox="0 0 100 100"
                width={size * 0.82}
                height={size * 0.82}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Left Mountain Peak */}
                <path
                    d="M 14 82 L 40 33 L 52 82 Z"
                    fill={peakColor}
                />
                {/* Central Peak with Cross Motif */}
                <path
                    d="M 44 82 L 67 15 L 75 15 L 85 82 L 53 82 Z"
                    fill={peakColor}
                />
                {/* Central peak cutout creating the cross / internal negative space */}
                <path
                    d="M 23 82 L 40 46 L 50 82 Z"
                    fill={bg}
                />
                {/* Third Stylized Detached Peak (Top Right) */}
                <path
                    d="M 78 15 C 84 15 92 20 92 36 L 85 46 C 85 30 81 22 75 18 Z"
                    fill={peakColor}
                />
            </svg>
        </div>
    );
}

/**
 * Official Horizontal Logo Lockup
 * Icon + MTC (Poppins Extra Bold) + Subtitle (Poppins Medium)
 */
export function MtcLogoHorizontal({ 
    subtitle = "EQUIPMENT INVENTORY & DEPLOYMENT", 
    size = "md",
    className = "" 
}) {
    const isSmall = size === 'sm';
    const isLarge = size === 'lg';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <MtcIcon 
                size={isSmall ? 32 : isLarge ? 48 : 40} 
                bg="#386642" 
                peakColor="#FFEBCC" 
            />
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight text-white leading-none font-sans" style={{ fontSize: isSmall ? '16px' : isLarge ? '24px' : '20px' }}>
                        MTC <span className="text-[#FFEBCC]">GEAR</span>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#386642] animate-pulse"></span>
                </div>
                <div className="text-[9px] font-semibold text-[#CADEDF]/80 uppercase tracking-widest leading-tight mt-1 truncate max-w-[200px]">
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

export default MtcIcon;
